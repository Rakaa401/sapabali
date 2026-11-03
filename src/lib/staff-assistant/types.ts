// Batas input situasi (07.2 akan memvalidasi batas yang sama di server)
export const MAX_SITUATION_LENGTH = 600;

export interface StaffSource {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  detailPath?: string | null;
}

// Body request ke POST /api/staff/assistant (07.2). Samakan dengan API yang dibuat tim.
export interface StaffRequest {
  situation: string;
  destinationId: string;
}

export interface StaffAnswer {
  explanation: string; // penjelasan bahasa Inggris untuk disampaikan ke pengunjung
  sources: StaffSource[];
  fallback: boolean; // true = data destinasi tidak cukup, jangan disampaikan sebagai aturan resmi
}
