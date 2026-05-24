/**
 * Backlink and Graph System
 * Tracks page references and generates graph data
 */

import type { ID, Page, Block, GraphData, BacklinkInfo } from '@obnofi/types/core';
import { buildGraphData, findShortestPath } from './graphUtils';

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
    for (const [, propValue] of Object.entries(page.propertyValues)) {
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
      for (const [, propValue] of Object.entries(sourcePage.propertyValues)) {
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
    return buildGraphData(this.index, this.pages, options);
  }

  /**
   * Find shortest path between two pages
   */
  findPath(fromId: ID, toId: ID): ID[] | null {
    return findShortestPath(this.index, fromId, toId);
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

    for (const [pageId] of this.pages) {
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

    for (const [pageId] of this.pages) {
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
    for (const [, propValue] of Object.entries(page.propertyValues)) {
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

export { SearchIndex } from "./searchIndex";
