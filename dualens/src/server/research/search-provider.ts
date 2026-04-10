export type SearchResult = {
  title: string;
  url: string;
  sourceName: string;
  sourceType: string;
  snippet?: string;
};

export type SearchProvider = {
  search(query: string): Promise<SearchResult[]>;
};
