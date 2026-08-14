import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractResumeText } from "@/lib/resume/extract-text";
import { analyzeResume } from "@/lib/ai/resume-analysis";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { resumeId } = await request.json();
  if (!resumeId) {
    return NextResponse.json({ error: "resumeId is required." }, { status: 400 });
  }

  const { data: resume, error: resumeErr } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();
  if (resumeErr || !resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  try {
    // Download the real uploaded file from private storage.
    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from("resumes")
      .download(resume.storage_path);
    if (downloadErr || !fileBlob) {
      throw new Error("Could not download the uploaded resume file.");
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new Error("Resume file is too large (max 10MB).");
    }
    const buffer = Buffer.from(arrayBuffer);

    const text = await extractResumeText(buffer, resume.file_type);
    if (!text || text.trim().length < 50) {
      throw new Error(
        "Couldn't extract meaningful text from this file. It may be a scanned image rather than real text — try a different file."
      );
    }

    const analysis = await analyzeResume(text);

    const { data: candidateProfile, error: profileErr } = await supabase
      .from("candidate_profiles")
      .insert({
        user_id: user.id,
        experience: analysis.experience,
        skills: analysis.skills,
        projects: analysis.projects,
        achievements: analysis.achievements,
        education: analysis.education,
        certifications: analysis.certifications,
      })
      .select()
      .single();
    if (profileErr) throw profileErr;

    const { error: updateResumeErr } = await supabase
      .from("resumes")
      .update({
        candidate_profile_id: candidateProfile.id,
        resume_defense_map: analysis.defenseMap,
      })
      .eq("id", resumeId);
    if (updateResumeErr) throw updateResumeErr;

    // Also save each extracted skill into the shared skills reference
    // table + link to the candidate (spec tables: skills, candidate_skills)
    for (const skillName of analysis.skills) {
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .eq("name", skillName)
        .maybeSingle();

      const skillId =
        existingSkill?.id ??
        (
          await supabase.from("skills").insert({ name: skillName }).select().single()
        ).data?.id;

      if (skillId) {
        await supabase.from("candidate_skills").upsert(
          { user_id: user.id, skill_id: skillId },
          { onConflict: "user_id,skill_id" }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      candidateProfileId: candidateProfile.id,
      analysis,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Resume analysis failed." },
      { status: 500 }
    );
  }
}
