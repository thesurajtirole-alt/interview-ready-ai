import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { researchCompany, researchRole } from "@/lib/research/company-research";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const ResearchRequestSchema = z.object({ companyId: uuidSchema });

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(ResearchRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { companyId } = validation.data;

  // Fetch the company — RLS ensures this only succeeds if it's the
  // logged-in user's own row.
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (companyErr || !company) {
    return NextResponse.json(
      { error: "Company not found." },
      { status: 404 }
    );
  }

  // Also grab the most recent job description for this company, if any,
  // so role research can be more specific.
  const { data: jd } = await supabase
    .from("job_descriptions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const [companyResult, roleResult] = await Promise.all([
      researchCompany(company.name, company.website),
      jd ? researchRole(jd.title, company.name) : Promise.resolve(null),
    ]);

    const allFindings = [
      ...companyResult.overview,
      ...companyResult.products,
      ...companyResult.recentDevelopments,
      ...(roleResult?.competencySignals ?? []),
    ];

    if (allFindings.length === 0) {
      return NextResponse.json({
        ok: true,
        notice: "Not enough public information available.",
      });
    }

    // Build a plain-language summary purely by concatenating what we
    // actually found — no invented claims, no LLM embellishment.
    const summaryParts: string[] = [];
    if (companyResult.overview.length > 0) {
      summaryParts.push(companyResult.overview[0].summary);
    }
    if (companyResult.products.length > 0) {
      summaryParts.push(companyResult.products[0].summary);
    }

    const { data: researchRow, error: researchErr } = await supabase
      .from("company_research")
      .insert({
        company_id: companyId,
        summary: summaryParts.join(" "),
      })
      .select()
      .single();
    if (researchErr) throw researchErr;

    // Save every individual finding as a traceable research_source row.
    const sourceRows = allFindings.map((f) => ({
      user_id: user.id,
      related_table: "company_research",
      related_id: researchRow.id,
      source_url: f.sourceUrl,
      source_title: f.sourceTitle,
      source_type: f.sourceType,
      summary: f.summary,
      confidence: f.confidence,
    }));

    const { error: sourcesErr } = await supabase
      .from("research_sources")
      .insert(sourceRows);
    if (sourcesErr) throw sourcesErr;

    return NextResponse.json({ ok: true, researchId: researchRow.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Research failed." },
      { status: 500 }
    );
  }
}
