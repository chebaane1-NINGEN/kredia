export type SenderType = 'CLIENT' | 'AGENT' | 'SYSTEM';

export interface ReclamationMessage {
  messageId?: number;
  reclamationId: number;
  senderType: SenderType;
  senderName: string;
  content: string;
  sentAt?: string;
}
