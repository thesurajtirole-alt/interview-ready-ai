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
  confidence: "confirmed" | "strong_indication" | "possible";
}

/**
 * Researches a named panel member using only their public professional
 * information (spec section 8) — never private/personal data. Confidence
 * is deliberately conservative: LinkedIn-sourced hits are the strongest
 * signal we have without a paid people-data API.
 */
export async function researchInterviewer(
  name: string,
  companyName: string,
  linkedinUrl?: string | null
): Promise<InterviewerResearchResult> {
  const query = linkedinUrl
    ? `${name} ${companyName} ${linkedinUrl}`
    : `${name} ${companyName} LinkedIn professional background`;

  const results = await tavilySearch(query, 5);
  const findings = toFindings(results, "interviewer_research");

  // Pull out expertise-sounding keywords from the snippets themselves —
  // no invented skills, only what's actually in the retrieved text.
  const combinedText = findings.map((f) => f.summary).join(" ").toLowerCase();
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

  return {
    careerHistory: findings,
    expertise,
    focusAreas: expertise.slice(0, 4),
    confidence: findings.some((f) => f.confidence === "strong_indication")
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
