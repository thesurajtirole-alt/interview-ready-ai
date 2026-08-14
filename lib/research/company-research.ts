import { tavilySearch, type TavilyResult } from "./tavily";

export interface ResearchFinding {
  sourceUrl: string;
  sourceTitle: string;
  sourceType: string;
  summary: string;
  confidence: "confirmed" | "strong_indication" | "possible";
}

export interface CompanyResearchResult {
  overview: ResearchFinding[];
  products: ResearchFinding[];
  recentDevelopments: ResearchFinding[];
}

function toFindings(
  results: TavilyResult[],
  sourceType: string
): ResearchFinding[] {
  return results.map((r) => ({
    sourceUrl: r.url,
    sourceTitle: r.title,
    sourceType,
    // We show Tavily's own extracted snippet directly rather than having
    // an LLM "summarize" it — this guarantees nothing here is invented.
    summary: r.content.slice(0, 500),
    // Tavily's relevance score maps loosely to how confidently this
    // snippet actually answers the query.
    confidence: r.score > 0.6 ? "strong_indication" : "possible",
  }));
}

/**
 * Runs real web searches for a company and organizes the results.
 * Every fact returned is traceable to a real URL — nothing is fabricated.
 * If a topic returns no usable results, its array is simply empty, and
 * the caller should render "Not enough public information available."
 */
export async function researchCompany(
  companyName: string,
  website?: string | null
): Promise<CompanyResearchResult> {
  const siteHint = website ? ` ${website}` : "";

  const [overviewResults, productResults, newsResults] = await Promise.all([
    tavilySearch(`${companyName}${siteHint} company overview industry`, 4),
    tavilySearch(`${companyName} products services business model`, 4),
    tavilySearch(`${companyName} news 2026`, 4),
  ]);

  return {
    overview: toFindings(overviewResults, "company_overview"),
    products: toFindings(productResults, "company_products"),
    recentDevelopments: toFindings(newsResults, "company_news"),
  };
}

export interface InterviewerResearchResult {
  careerHistory: ResearchFinding[];
  expertise: string[];
  focusAreas: string[];
  yearsOfExperience: string | null; // only if explicitly stated somewhere, never estimated
  companyDescription: ResearchFinding | null; // what the company's own site says about them
  publicStatements: ResearchFinding[]; // their own quotes/talks/articles, sourced
  confidence: "confirmed" | "strong_indication" | "possible";
}

const EXPERIENCE_PATTERN = /(\d{1,2})\+?\s*(?:years|yrs)(?:\s+of)?\s+experience/i;

/**
 * Researches a named panel member using only their public professional
 * information (spec section 3 and 8) — never private data, never
 * invented psychology. "Publicly stated approach" surfaces what they've
 * actually said, not a guess at how they think.
 */
export async function researchInterviewer(
  name: string,
  companyName: string,
  linkedinUrl?: string | null,
  companyWebsite?: string | null
): Promise<InterviewerResearchResult> {
  const [profileResults, companySiteResults, quoteResults] = await Promise.all([
    tavilySearch(
      linkedinUrl
        ? `${name} ${companyName} ${linkedinUrl}`
        : `${name} ${companyName} LinkedIn professional background`,
      5
    ),
    tavilySearch(
      companyWebsite
        ? `${name} ${companyName} team ${companyWebsite}`
        : `"${name}" ${companyName} team about us`,
      3
    ),
    // Tied to the company name specifically — searching on name alone
    // risks matching a completely different person who shares the name.
    tavilySearch(`"${name}" ${companyName} quote OR interview OR article`, 4),
  ]);

  const careerHistory = toFindings(profileResults, "interviewer_research");
  const companySiteFindings = toFindings(companySiteResults, "company_page_mention");

  // Extra safety filter: even with a company-scoped query, only keep a
  // "public statement" if the company name (or its first word, for
  // multi-word names) actually appears in the retrieved text — otherwise
  // we risk attributing a different person's words to this interviewer.
  const companyKeyword = companyName.split(" ")[0]?.toLowerCase();
  const publicStatements = toFindings(quoteResults, "public_statement").filter(
    (f) =>
      !companyKeyword ||
      f.summary.toLowerCase().includes(companyKeyword) ||
      f.sourceTitle.toLowerCase().includes(companyKeyword)
  );

  const combinedText = careerHistory.map((f) => f.summary).join(" ").toLowerCase();

  // Real extraction only — never estimate a number that isn't there.
  const expMatch = combinedText.match(EXPERIENCE_PATTERN);
  const yearsOfExperience = expMatch ? `${expMatch[1]}+ years` : null;

  const skillCandidates = [
    "aws", "azure", "gcp", "kubernetes", "docker", "react", "node.js",
    "python", "java", "javascript", "typescript", "c#", "sql",
    "distributed systems", "system design", "microservices", "cloud",
    "healthcare technology", "fintech", "e-commerce", "sales",
    "business development", "marketing", "product management",
    "project management", "engineering leadership", "architecture",
    "solution architect", "data science", "machine learning", "ai", "ml",
    "devops", "cybersecurity", "crm", "erp", "dynamics 365", "salesforce",
    "sap", "consulting", "strategy", "operations", "finance",
  ];
  const expertise = skillCandidates.filter((s) => combinedText.includes(s));

  // Only treat a company-site result as a real "company description" if
  // it actually appears to be from that company's own domain. Guard
  // against malformed/missing website values rather than throwing.
  function safeHostname(url: string): string | null {
    try {
      const withProtocol = url.startsWith("http") ? url : `https://${url}`;
      return new URL(withProtocol).hostname.replace("www.", "");
    } catch {
      return null;
    }
  }

  const companyHostname = companyWebsite ? safeHostname(companyWebsite) : null;
  const companyDescription =
    companySiteFindings.find((f) =>
      companyHostname ? f.sourceUrl.includes(companyHostname) : true
    ) ?? null;

  return {
    careerHistory,
    expertise,
    focusAreas: expertise.slice(0, 4),
    yearsOfExperience,
    companyDescription,
    publicStatements,
    confidence: careerHistory.some((f) => f.confidence === "strong_indication")
      ? "strong_indication"
      : "possible",
  };
}

export interface RoleResearchResult {
  competencySignals: ResearchFinding[];
}

/**
 * Runs a real search for what the role/title typically requires, to
 * complement (not replace) the job description the candidate pasted in.
 */
export async function researchRole(
  roleTitle: string,
  companyName?: string
): Promise<RoleResearchResult> {
  const query = companyName
    ? `${roleTitle} responsibilities skills ${companyName}`
    : `${roleTitle} responsibilities required skills`;
  const results = await tavilySearch(query, 4);
  return { competencySignals: toFindings(results, "role_research") };
}
