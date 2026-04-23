/**
 * Backlink and Graph System
 * Tracks page references and generates graph data
 */

import type { ID, Page, Block, RichText, GraphData, GraphNode, GraphEdge, BacklinkInfo } from '@obnofi/types/core';

export interface LinkIndex {
  // Forward: page -> pages it links to
  outgoing: Map<ID, Set<ID>>;
  // Backward: page -> pages that link to it
  incoming: Map<ID, Set<ID>>;
  // Block-level links
  blockLinks: Map<ID, Set<ID>>; // blockId -> pageIds
}

export class BacklinkManager {
  private index: LinkIndex = {
    outgoing: new Map(),
    incoming: new Map(),
    blockLinks: new Map(),
  };

  private pages = new Map<ID, Page>();

  /**
   * Index a page and extract all links
   */
  indexPage(page: Page): void {
    // Remove old links first
    this.removePageLinks(page.id);
    
    // Store page
    this.pages.set(page.id, page);

    // Extract links from all blocks
    const links = new Set<ID>();
    
    for (const block of page.content) {
      const blockLinks = this.extractBlockLinks(block);
      
      if (blockLinks.length > 0) {
        this.index.blockLinks.set(block.id, new Set(blockLinks));
        blockLinks.forEach(id => links.add(id));
      }
    }

    // Also check property values for relations
    for (const [propId, propValue] of Object.entries(page.propertyValues)) {
      if (propValue.type === 'relation' && Array.isArray(propValue.value)) {
        (propValue.value as ID[]).forEach(id => links.add(id));
      }
    }

    // Update index
    this.index.outgoing.set(page.id, links);
    
    // Update incoming links
    for (const targetId of links) {
      if (!this.index.incoming.has(targetId)) {
        this.index.incoming.set(targetId, new Set());
      }
      this.index.incoming.get(targetId)!.add(page.id);
    }
  }

  /**
   * Remove a page and its links from the index
   */
  removePage(pageId: ID): void {
    this.removePageLinks(pageId);
    this.pages.delete(pageId);
    this.index.outgoing.delete(pageId);
    this.index.incoming.delete(pageId);
  }

  /**
   * Get all backlinks for a page
   */
  getBacklinks(pageId: ID): BacklinkInfo[] {
    const sourceIds = this.index.incoming.get(pageId);
    if (!sourceIds) return [];

    const backlinks: BacklinkInfo[] = [];

    for (const sourceId of sourceIds) {
      const sourcePage = this.pages.get(sourceId);
      if (!sourcePage) continue;

      // Find blocks that link to this page
      for (const block of sourcePage.content) {
        const blockLinks = this.index.blockLinks.get(block.id);
        if (blockLinks?.has(pageId)) {
          backlinks.push({
            sourcePageId: sourceId,
            sourcePageTitle: this.getPageTitle(sourcePage),
            sourcePageIcon: sourcePage.icon,
            blockId: block.id,
            context: this.extractContext(block),
          });
        }
      }

      // Check relation properties
      for (const [propId, propValue] of Object.entries(sourcePage.propertyValues)) {
        if (propValue.type === 'relation' && Array.isArray(propValue.value)) {
          if ((propValue.value as ID[]).includes(pageId)) {
            backlinks.push({
              sourcePageId: sourceId,
              sourcePageTitle: this.getPageTitle(sourcePage),
              sourcePageIcon: sourcePage.icon,
              context: 'Linked via relation property',
            });
          }
        }
      }
    }

    return backlinks;
  }

  /**
   * Get outgoing links from a page
   */
  getOutgoingLinks(pageId: ID): ID[] {
    const links = this.index.outgoing.get(pageId);
    return links ? Array.from(links) : [];
  }

  /**
   * Get graph data for visualization
   */
  getGraphData(options?: {
    centerNodeId?: ID;
    depth?: number;
    includeDatabases?: boolean;
  }): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const visited = new Set<ID>();
    const nodeMap = new Map<ID, GraphNode>();

    const addNode = (pageId: ID, depth = 0) => {
      if (visited.has(pageId)) return;
      visited.add(pageId);

      const page = this.pages.get(pageId);
      if (!page) return;

      const node: GraphNode = {
        id: pageId,
        type: page.databaseId ? 'database' : 'page',
        title: this.getPageTitle(page),
        icon: page.icon,
        depth,
      };

      nodes.push(node);
      nodeMap.set(pageId, node);

      // Add edges to outgoing links
      const outgoing = this.index.outgoing.get(pageId);
      if (outgoing) {
        for (const targetId of outgoing) {
          edges.push({
            source: pageId,
            target: targetId,
            type: 'link',
          });

          // Recursively add connected nodes if within depth
          if (options?.depth === undefined || depth < options.depth) {
            addNode(targetId, depth + 1);
          }
        }
      }

      // Add edges from incoming links
      const incoming = this.index.incoming.get(pageId);
      if (incoming) {
        for (const sourceId of incoming) {
          // Only add edge if not already added
          const exists = edges.some(
            e => e.source === sourceId && e.target === pageId
          );
          
          if (!exists) {
            edges.push({
              source: sourceId,
              target: pageId,
              type: 'link',
            });
          }

          if (options?.depth === undefined || depth < options.depth) {
            addNode(sourceId, depth + 1);
          }
        }
      }
    };

    if (options?.centerNodeId) {
      addNode(options.centerNodeId, 0);
    } else {
      // Add all pages
      for (const pageId of this.pages.keys()) {
        addNode(pageId);
      }
    }

    return { nodes, edges };
  }

  /**
   * Find shortest path between two pages
   */
  findPath(fromId: ID, toId: ID): ID[] | null {
    if (fromId === toId) return [fromId];

    const queue: Array<{ id: ID; path: ID[] }> = [{ id: fromId, path: [fromId] }];
    const visited = new Set<ID>();

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      // Check outgoing links
      const outgoing = this.index.outgoing.get(id);
      if (outgoing) {
        for (const nextId of outgoing) {
          if (nextId === toId) {
            return [...path, nextId];
          }
          if (!visited.has(nextId)) {
            queue.push({ id: nextId, path: [...path, nextId] });
          }
        }
      }

      // Check incoming links (bidirectional search)
      const incoming = this.index.incoming.get(id);
      if (incoming) {
        for (const prevId of incoming) {
          if (prevId === toId) {
            return [...path, prevId];
          }
          if (!visited.has(prevId)) {
            queue.push({ id: prevId, path: [...path, prevId] });
          }
        }
      }
    }

    return null;
  }

  /**
   * Get related pages (pages that link to same targets)
   */
  getRelatedPages(pageId: ID, limit = 5): ID[] {
    const outgoing = this.index.outgoing.get(pageId);
    if (!outgoing || outgoing.size === 0) return [];

    const scores = new Map<ID, number>();

    // Find pages that link to the same targets
    for (const targetId of outgoing) {
      const incoming = this.index.incoming.get(targetId);
      if (incoming) {
        for (const sourceId of incoming) {
          if (sourceId !== pageId) {
            scores.set(sourceId, (scores.get(sourceId) || 0) + 1);
          }
        }
      }
    }

    // Sort by score and return top matches
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  /**
   * Get orphaned pages (no incoming or outgoing links)
   */
  getOrphanedPages(): ID[] {
    const orphaned: ID[] = [];

    for (const [pageId, page] of this.pages) {
      const outgoing = this.index.outgoing.get(pageId);
      const incoming = this.index.incoming.get(pageId);

      if ((!outgoing || outgoing.size === 0) && (!incoming || incoming.size === 0)) {
        orphaned.push(pageId);
      }
    }

    return orphaned;
  }

  /**
   * Get hub pages (most linked to)
   */
  getHubPages(limit = 10): Array<{ id: ID; incomingCount: number; outgoingCount: number }> {
    const scores: Array<{ id: ID; incomingCount: number; outgoingCount: number }> = [];

    for (const [pageId, page] of this.pages) {
      const incoming = this.index.incoming.get(pageId)?.size || 0;
      const outgoing = this.index.outgoing.get(pageId)?.size || 0;

      scores.push({ id: pageId, incomingCount: incoming, outgoingCount: outgoing });
    }

    return scores
      .sort((a, b) => (b.incomingCount + b.outgoingCount) - (a.incomingCount + a.outgoingCount))
      .slice(0, limit);
  }

  // ============================================
  // Private Helpers
  // ============================================

  private removePageLinks(pageId: ID): void {
    const oldOutgoing = this.index.outgoing.get(pageId);
    
    if (oldOutgoing) {
      // Remove from incoming links of targets
      for (const targetId of oldOutgoing) {
        this.index.incoming.get(targetId)?.delete(pageId);
      }
    }

    // Clean up block links
    const page = this.pages.get(pageId);
    if (page) {
      for (const block of page.content) {
        this.index.blockLinks.delete(block.id);
      }
    }
  }

  private extractBlockLinks(block: Block): ID[] {
    const links: ID[] = [];

    // Check rich text for mentions
    if (block.content?.richText) {
      for (const rt of block.content.richText) {
        if (rt.type === 'mention' && rt.mention?.type === 'page') {
          links.push(rt.mention.page!.id);
        }
      }
    }

    // Check for page references
    if (block.content?.pageId) {
      links.push(block.content.pageId);
    }

    // Recursively check children
    if (block.children) {
      for (const child of block.children) {
        links.push(...this.extractBlockLinks(child));
      }
    }

    return links;
  }

  private getPageTitle(page: Page): string {
    // Try to get title from title property
    for (const [propId, propValue] of Object.entries(page.propertyValues)) {
      if (propValue.type === 'title' && propValue.value) {
        return String(propValue.value);
      }
    }

    // Try to extract from first heading or text block
    for (const block of page.content) {
      if (block.content?.richText) {
        const text = block.content.richText.map(rt => rt.text?.content || '').join('');
        if (text.trim()) return text.trim();
      }
    }

    return 'Untitled';
  }

  private extractContext(block: Block, maxLength = 100): string {
    if (!block.content?.richText) return '';

    const text = block.content.richText
      .map(rt => rt.text?.content || '')
      .join('');

    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }
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
    for (const [propId, propValue] of Object.entries(page.propertyValues)) {
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
