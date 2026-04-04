import { Injectable } from '@nestjs/common';

export type ParsedExpense = { expenseName: string; amount: number };

export type ParseLinesResult = {
  items: ParsedExpense[];
  /** Non-empty lines that did not parse (trimmed text). */
  invalidLines: string[];
};

@Injectable()
export class ExpenseParserService {
  /**
   * Expects trailing amount: "Сосиски 45000"
   * Supports spaces in the number part: "Кофе 1 500" -> 1500
   */
  parse(text: string): ParsedExpense | null {
    const trimmed = text.trim();
    const match = trimmed.match(/^(.+?)\s+([\d\s.,]+)$/u);
    if (!match) {
      return null;
    }
    const expenseName = match[1].trim();
    const rawAmount = match[2].replace(/\s/g, '');
    if (!expenseName) {
      return null;
    }
    const normalized = rawAmount.replace(',', '.');
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    return { expenseName, amount };
  }

  /**
   * One expense per non-empty line; same format as {@link parse}.
   */
  parseLines(text: string): ParseLinesResult {
    const lines = text.split(/\r?\n/u);
    const items: ParsedExpense[] = [];
    const invalidLines: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t) {
        continue;
      }
      const p = this.parse(t);
      if (p) {
        items.push(p);
      } else {
        invalidLines.push(t);
      }
    }
    return { items, invalidLines };
  }
}
