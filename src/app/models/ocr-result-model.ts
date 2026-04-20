export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export interface OcrParsedDrill {
  title: string;
  description: string;
  category: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  highlightedWords: OcrWord[];
  rawText: string;
}

export type PdfImportStep = 'upload' | 'processing' | 'review';
