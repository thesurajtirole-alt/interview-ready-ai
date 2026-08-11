/**
 * Thin wrapper around the Tavily search API.
 * Server-side only — never call this from a Client Component,
 * since it uses TAVILY_API_KEY (a secret, not a NEXT_PUBLIC_ var).
 */

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(
  query: string,
  maxResults = 5
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not configured. Research features require a free Tavily API key — see SETUP.md."
    );
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: maxResults,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily search failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return (data.results ?? []) as TavilyResult[];
}
