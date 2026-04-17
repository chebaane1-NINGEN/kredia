export interface ReclamationAttachment {
  attachmentId?: number;
  reclamationId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  uploadedAt?: string;
}
