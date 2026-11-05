// Batas input situasi (divalidasi juga di server, 07.2)
export const MAX_SITUATION_LENGTH = 600;

// normal = sekitar 90 kata, short = sekitar 40 kata
export type StaffLength = "normal" | "short";

export interface StaffSource {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  detailPath?: string | null;
}

// Body request ke POST /api/staff/assistant
export interface StaffRequest {
  situation: string;
  destinationId: string;
  length?: StaffLength; // default "normal"
  regenerate?: boolean; // true = minta versi kalimat lain
}

export interface StaffAnswer {
  explanation: string; // penjelasan bahasa Inggris untuk disampaikan ke pengunjung
  sources: StaffSource[];
  fallback: boolean; // true = data destinasi tidak cukup, jangan disampaikan sebagai aturan resmi
  length: StaffLength;
}