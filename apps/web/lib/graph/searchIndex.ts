import type { ID, Page, Block } from '@obnofi/types/core';

interface SearchDocument {
  id: ID;
  title: string;
  content: string;
  updatedAt: number;
}

interface SearchResult {
  id: ID;
  title: string;
  snippet: string;
  score: number;
}

/**
 * Search index for full-text search
 */
export class SearchIndex {
  private index = new Map<ID, SearchDocument>();
  private invertedIndex = new Map<string, Set<ID>>(); // word -> pageIds

  addPage(page: Page): void {
    const doc: SearchDocument = {
      id: page.id,
      title: this.extractTitle(page),
      content: this.extractContent(page),
      updatedAt: page.updatedAt,
    };

    this.index.set(page.id, doc);
    this.updateInvertedIndex(page.id, doc);
  }

  removePage(pageId: ID): void {
    const doc = this.index.get(pageId);
    if (doc) {
      // Remove from inverted index
      const words = this.tokenize(doc.title + ' ' + doc.content);
      for (const word of words) {
        this.invertedIndex.get(word)?.delete(pageId);
      }
      this.index.delete(pageId);
    }
  }

  search(query: string, options?: { limit?: number; workspaceId?: ID }): SearchResult[] {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];

    const scores = new Map<ID, number>();

    for (const token of tokens) {
      const pageIds = this.invertedIndex.get(token);
      if (pageIds) {
        for (const pageId of pageIds) {
          const doc = this.index.get(pageId);
          if (!doc) continue;

          // Calculate score based on where token appears
          let score = 1;

          // Title match is worth more
          if (this.tokenize(doc.title).includes(token)) {
            score += 5;
          }

          // Exact title match is worth even more
          if (doc.title.toLowerCase().includes(query.toLowerCase())) {
            score += 10;
          }

          scores.set(pageId, (scores.get(pageId) || 0) + score);
        }
      }
    }

    // Sort by score
    const results = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, options?.limit || 20)
      .map(([id, score]) => {
        const doc = this.index.get(id)!;
        return {
          id,
          title: doc.title,
          snippet: this.generateSnippet(doc.content, query),
          score,
        };
      });

    return results;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  private updateInvertedIndex(pageId: ID, doc: SearchDocument): void {
    const words = this.tokenize(doc.title + ' ' + doc.content);

    for (const word of words) {
      if (!this.invertedIndex.has(word)) {
        this.invertedIndex.set(word, new Set());
      }
      this.invertedIndex.get(word)!.add(pageId);
    }
  }

  private extractTitle(page: Page): string {
    for (const [, propValue] of Object.entries(page.propertyValues)) {
      if (propValue.type === 'title' && propValue.value) {
        return String(propValue.value);
      }
    }
    return 'Untitled';
  }

  private extractContent(page: Page): string {
    const parts: string[] = [];

    const extractFromBlock = (block: Block) => {
      if (block.content?.richText) {
        const text = block.content.richText
          .map(rt => rt.text?.content || '')
          .join(' ');
        if (text) parts.push(text);
      }

      if (block.children) {
        block.children.forEach(extractFromBlock);
      }
    };

    page.content.forEach(extractFromBlock);
    return parts.join(' ');
  }

  private generateSnippet(content: string, query: string, maxLength = 150): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);

    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }
}
