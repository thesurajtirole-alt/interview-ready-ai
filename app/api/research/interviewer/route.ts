import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { researchInterviewer } from "@/lib/research/company-research";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { interviewerId } = await request.json();
  if (!interviewerId) {
    return NextResponse.json(
      { error: "interviewerId is required." },
      { status: 400 }
    );
  }

  const { data: interviewer, error: intErr } = await supabase
    .from("interviewers")
    .select("*, companies(name, website)")
    .eq("id", interviewerId)
    .single();
  if (intErr || !interviewer) {
    return NextResponse.json({ error: "Interviewer not found." }, { status: 404 });
  }

  try {
    const result = await researchInterviewer(
      interviewer.name,
      interviewer.companies?.name ?? "",
      interviewer.linkedin_url,
      interviewer.companies?.website
    );

    if (result.careerHistory.length === 0) {
      return NextResponse.json({
        ok: true,
        notice: "Not enough public information available.",
      });
    }

    const { data: researchRow, error: researchErr } = await supabase
      .from("interviewer_research")
      .insert({
        interviewer_id: interviewerId,
        career_history: result.careerHistory,
        expertise: result.expertise,
        focus_areas: result.focusAreas,
        confidence: result.confidence,
        summary: result.careerHistory[0]?.summary ?? null,
        years_experience: result.yearsOfExperience,
        company_description: result.companyDescription,
        public_statements: result.publicStatements,
      })
      .select()
      .single();
    if (researchErr) throw researchErr;

    const allSourcedFindings = [
      ...result.careerHistory,
      ...(result.companyDescription ? [result.companyDescription] : []),
      ...result.publicStatements,
    ];

    const sourceRows = allSourcedFindings.map((f) => ({
      user_id: user.id,
      related_table: "interviewer_research",
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
      { error: e.message ?? "Interviewer research failed." },
      { status: 500 }
    );
  }
}
