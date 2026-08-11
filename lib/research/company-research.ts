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
