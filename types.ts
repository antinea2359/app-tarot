export interface TarotCardData {
  name: string;
  visualDescription: string;
  meaning: string;
  spiritualMessage: string;
}

export interface TarotState {
  isLoading: boolean;
  cardData: TarotCardData | null;
  imageUrl: string | null;
  error: string | null;
  mode: 'idle' | 'drawing' | 'viewing' | 'editing';
}

export enum GeminiModel {
  TEXT = 'gemini-2.5-flash',
  IMAGE = 'gemini-2.5-flash-image'
}
