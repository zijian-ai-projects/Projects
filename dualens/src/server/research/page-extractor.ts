export type ExtractedPage = {
  summary: string;
  notableDataPoints: string[];
};

export type PageExtractor = {
  extract(url: string): Promise<ExtractedPage>;
};
