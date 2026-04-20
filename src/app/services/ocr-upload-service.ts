import { Injectable } from '@angular/core';
import { OcrParsedDrill, OcrWord } from '../models/ocr-result-model';

@Injectable({ providedIn: 'root' })
export class PdfOcrService {
  // Render first page of PDF onto a canvas using pdf.js
  async renderPdfToCanvas(file: File, canvas: HTMLCanvasElement): Promise<void> {
    const pdfjsLib = await import('pdfjs-dist');
    // Serve worker from the application root (copied by angular.json)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext('2d')!,
      viewport,
      canvas,
    }).promise;
  }

  // Load image file onto a canvas
  async renderImageToCanvas(file: File, canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Run Tesseract OCR on the rendered canvas, return words with bounding boxes
  async runOcr(canvas: HTMLCanvasElement): Promise<OcrWord[]> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    const { data } = await worker.recognize(canvas);
    await worker.terminate();

    const words: OcrWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const par of block.paragraphs ?? []) {
        for (const line of par.lines ?? []) {
          for (const word of line.words ?? []) {
            if (word.confidence > 40) {
              words.push({
                text: word.text,
                confidence: word.confidence,
                bbox: {
                  x0: word.bbox.x0,
                  y0: word.bbox.y0,
                  x1: word.bbox.x1,
                  y1: word.bbox.y1,
                },
              });
            }
          }
        }
      }
    }
    return words;
  }

  // Parse structured drill fields from OCR words
  parseDrillFromWords(words: OcrWord[]): OcrParsedDrill {
    const rawText = words.map((w) => w.text).join(' ');
    const lines = this.groupIntoLines(words);

    // PDF ima format "Title: 3-Man Weave with Finish"
    const titleLine = lines.find((l) => /^title[:\s]/i.test(l));
    const title = titleLine
      ? titleLine.replace(/^title[:\s]+/i, '').trim()
      : (lines[0] ?? 'Untitled Drill');

    // Izvuci description iz linije koja počinje sa "Description:"
    const descLine = lines.find((l) => /^description[:\s]/i.test(l));
    const description = descLine ? descLine.replace(/^description[:\s]+/i, '').trim() : '';

    // Izvuci category - gleda "Category:" liniju
    const categoryLine = lines.find((l) => /^category[:\s]/i.test(l));
    const categoryRaw = categoryLine ? categoryLine.replace(/^category[:\s]+/i, '').trim() : null;
    const category = this.normalizeCategory(categoryRaw);

    // Izvuci complexity - gleda "Difficulty:" ili "Complexity:" liniju
    const complexityLine = lines.find((l) => /^(difficulty|complexity|level)[:\s]/i.test(l));
    const complexityRaw = complexityLine
      ? complexityLine.replace(/^(difficulty|complexity|level)[:\s]+/i, '').trim()
      : null;
    const complexity = this.normalizeComplexity(complexityRaw);

    // Highlight words koji pripadaju title, description, category, complexity
    const valuesToHighlight = [title, description, categoryRaw ?? '', complexityRaw ?? '']
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const keyTokens = valuesToHighlight.split(/\s+/).filter((t) => t.length > 2);

    const highlightedWords = words.filter((w) =>
      keyTokens.some((token) => w.text.toLowerCase().includes(token)),
    );

    return { title, description, category, complexity, highlightedWords, rawText };
  }
  // Draw yellow highlight rectangles on the overlay canvas
  drawHighlights(overlay: HTMLCanvasElement, words: OcrWord[]): void {
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.fillStyle = 'rgba(255, 220, 0, 0.38)';
    for (const w of words) {
      ctx.fillRect(w.bbox.x0, w.bbox.y0, w.bbox.x1 - w.bbox.x0, w.bbox.y1 - w.bbox.y0);
    }
  }


  // Group words into text lines by clustering similar Y positions
  private groupIntoLines(words: OcrWord[]): string[] {
    if (!words.length) return [];
    const sorted = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0);
    const lines: string[][] = [];
    let currentLine: OcrWord[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const lineHeight = prev.bbox.y1 - prev.bbox.y0;
      if (curr.bbox.y0 - prev.bbox.y0 < lineHeight * 0.8) {
        currentLine.push(curr);
      } else {
        lines.push(currentLine.map((w) => w.text));
        currentLine = [curr];
      }
    }
    lines.push(currentLine.map((w) => w.text));
    return lines.map((l) => l.join(' ').trim()).filter(Boolean);
  }

  private extractLabel(text: string, labels: string[]): string | null {
    for (const label of labels) {
      const match = text.match(new RegExp(`${label}[:\\s]+([\\w]+)`, 'i'));
      if (match?.[1]) return match[1].trim();
    }
    return null;
  }

  private normalizeComplexity(raw: string | null): 'Beginner' | 'Intermediate' | 'Advanced' {
    const lower = (raw ?? '').toLowerCase();
    if (lower.includes('inter')) return 'Intermediate';
    if (lower.includes('adv')) return 'Advanced';
    return 'Beginner';
  }
  private normalizeCategory(raw: string | null): string {
    if (!raw) return 'Offense';
    const lower = raw.toLowerCase();
    if (lower.includes('shoot')) return 'Shooting';
    if (lower.includes('defen')) return 'Defense';
    if (lower.includes('offense') || lower.includes('offens')) return 'Offense';
    if (lower.includes('condition')) return 'Conditioning';
    if (lower.includes('pass')) return 'Passing';
    if (lower.includes('rebound')) return 'Rebounding';
    if (lower.includes('recover')) return 'Recovery';
    if (lower.includes('team')) return 'Team Building';
    return raw;
  }

  async extractTextFromPdf(file: File): Promise<OcrWord[]> {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const scale = 1.5; // mora biti isti kao u renderPdfToCanvas!
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();

    const words: OcrWord[] = [];

    for (const item of textContent.items as any[]) {
      if (!item.str?.trim()) continue;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

      const x0 = tx[4];
      const y0 = tx[5] - (item.height ?? 12);
      const x1 = x0 + item.width;
      const y1 = tx[5];

      words.push({
        text: item.str,
        confidence: 100,
        bbox: { x0, y0, x1, y1 },
      });
    }

    return words;
  }
}
