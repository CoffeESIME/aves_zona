export type BirdMedia = { url: string; attribution: string; license: string; evidenceUrl: string };
export type BirdDetails = {
  taxonUrl: string | null;
  photos: BirdMedia[];
  sounds: BirdMedia[];
  conservation: Array<{ status: string; label: string; authority: string; scope: string; url: string | null }>;
  notices: string[];
};
