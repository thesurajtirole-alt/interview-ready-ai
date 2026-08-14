/**
 * Extracts plain text from an uploaded resume file. Server-side only.
 * Never fabricates content — if extraction fails, it throws rather than
 * returning placeholder text (spec section 73: never fake functionality).
 */
export async function extractResumeText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  if (fileType === "application/pdf" || fileType.includes("pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    fileType.includes("wordprocessingml") ||
    fileType.includes("docx") ||
    fileType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (fileType === "text/plain" || fileType.includes("txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error(
    `Unsupported resume file type: ${fileType}. Please upload a PDF, DOCX, or TXT file.`
  );
}
