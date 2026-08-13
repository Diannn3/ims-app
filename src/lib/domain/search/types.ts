export type SearchKind = 'room' | 'course' | 'faculty' | 'service' | 'research' | 'resource';

export type SearchResult = {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

export type SearchCandidate = {
  title: string;
  aliases?: string[];
  keywords?: string[];
  canonicalCode?: string | null;
};
