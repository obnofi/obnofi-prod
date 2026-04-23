# Notion-like System Architecture

## Overview

A block-based, nested page system with integrated databases, supporting multiple views, relations, and real-time collaboration.

## Core Principles

1. **Everything is a Block** - Pages, text, databases are all blocks
2. **Pages are Database Rows** - Every page can have properties
3. **Lazy Loading** - Load data on demand with pagination
4. **Optimistic UI** - Instant feedback with server sync
5. **Event Sourcing** - All changes are events for collaboration

---

## 1. Data Models

### Core Types

```typescript
// Unique identifier using ULID or UUID v7 (time-sortable)
type ID = string;
type Timestamp = number; // Unix ms

// User entity
interface User {
  id: ID;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Workspace (top-level container)
interface Workspace {
  id: ID;
  name: string;
  slug: string;
  ownerId: ID;
  memberIds: ID[];
  settings: WorkspaceSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Page System

```typescript
// Page = Block Container + Database Row
interface Page {
  id: ID;
  workspaceId: ID;
  
  // Tree structure
  parentId: ID | null;
  childrenIds: ID[]; // Ordered list of child page IDs
  
  // Block content (the actual page content)
  content: Block[];
  
  // Database integration - every page CAN have properties
  databaseId: ID | null; // If part of a database
  propertyValues: Record<PropertyId, PropertyValue>;
  
  // Metadata
  icon: Icon | null;
  cover: Cover | null;
  
  // System
  createdBy: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number; // For optimistic locking
  
  // Collaboration
  lastEditedBy: ID;
  lastEditedAt: Timestamp;
}

// Block system - everything is a block
interface Block {
  id: ID;
  type: BlockType;
  content: BlockContent;
  children: Block[]; // Nested blocks (infinite nesting)
  
  // Formatting
  format: BlockFormat;
  
  // Database reference (if block is a database)
  databaseId?: ID;
}

type BlockType = 
  | 'text' | 'heading_1' | 'heading_2' | 'heading_3'
  | 'bulleted_list' | 'numbered_list' | 'to_do'
  | 'toggle' | 'quote' | 'callout' | 'code'
  | 'divider' | 'page' | 'database'
  | 'image' | 'video' | 'file' | 'embed'
  | 'bookmark' | 'table' | 'table_row'
  | 'column_list' | 'column'
  | 'link_to_page' | 'link_preview';

interface BlockContent {
  // Text blocks
  text?: RichText[];
  
  // Code block
  code?: { language: string; code: string };
  
  // Media blocks
  file?: { url: string; name: string; size: number };
  
  // Page reference
  pageId?: ID;
  
  // Database reference
  databaseId?: ID;
  
  // Callout
  callout?: { icon: Icon; text: RichText[] };
  
  // Toggle
  toggle?: { text: RichText[]; children: Block[] };
}

interface RichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: {
    type: 'user' | 'page' | 'date';
    user?: { id: ID };
    page?: { id: ID };
    date?: { start: string; end?: string };
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}
```

### Database System

```typescript
// Database = Collection of Pages with Schema
interface Database {
  id: ID;
  workspaceId: ID;
  
  // Parent page that contains this database
  parentPageId: ID;
  parentBlockId: ID; // The block that renders this database
  
  // Schema
  properties: PropertyDefinition[];
  
  // Views (how to display the data)
  views: DatabaseView[];
  
  // All pages in this database
  pageIds: ID[];
  
  // Templates
  templates: DatabaseTemplate[];
  
  // Settings
  settings: DatabaseSettings;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Property Definition (Schema)
interface PropertyDefinition {
  id: ID;
  name: string;
  type: PropertyType;
  config: PropertyConfig;
  order: number;
}

type PropertyType =
  | 'title'           // Page title (required, always first)
  | 'rich_text'       // Plain text
  | 'number'          // Numeric with formatting
  | 'select'          // Single select
  | 'multi_select'    // Multiple select
  | 'status'          // Status with workflow
  | 'date'            // Date/time
  | 'person'          // User reference
  | 'file'            // Files & media
  | 'checkbox'        // Boolean
  | 'url'             // Link
  | 'email'           // Email
  | 'phone'           // Phone number
  | 'formula'         // Computed value
  | 'relation'        // Link to another database
  | 'rollup'          // Aggregate related data
  | 'created_time'    // Auto timestamp
  | 'created_by'      // Auto user
  | 'last_edited_time'
  | 'last_edited_by'
  | 'unique_id';      // Auto-increment ID

interface PropertyConfig {
  // Select/Multi-select options
  options?: SelectOption[];
  
  // Number format
  numberFormat?: 'number' | 'dollar' | 'euro' | 'percent';
  
  // Date format
  dateFormat?: string;
  includeTime?: boolean;
  
  // Relation config
  relation?: {
    databaseId: ID;
    type: 'single' | 'dual'; // dual = two-way relation
    syncedPropertyName?: string; // For dual relations
  };
  
  // Rollup config
  rollup?: {
    relationPropertyId: ID;
    function: RollupFunction;
    propertyId: ID; // Property in related database to aggregate
  };
  
  // Formula
  formula?: {
    expression: string; // JavaScript-like expression
  };
}

interface SelectOption {
  id: ID;
  name: string;
  color: string; // Color preset
}

type RollupFunction = 
  | 'show_original' | 'show_unique'
  | 'count' | 'count_values' | 'count_unique_values'
  | 'empty' | 'not_empty'
  | 'percent_empty' | 'percent_not_empty'
  | 'sum' | 'average' | 'median' | 'min' | 'max' | 'range'
  | 'earliest_date' | 'latest_date' | 'date_range'
  | 'checked' | 'unchecked'
  | 'percent_checked' | 'percent_unchecked'
  | 'join' | 'concatenate';

// Property Value on a Page
interface PropertyValue {
  propertyId: ID;
  type: PropertyType;
  value: unknown; // Type depends on property type
}

// Database View (Table, Board, Calendar, etc.)
interface DatabaseView {
  id: ID;
  name: string;
  type: ViewType;
  
  // Query configuration
  query: ViewQuery;
  
  // Layout configuration
  layout: ViewLayout;
  
  // Visibility
  visiblePropertyIds: ID[];
  propertyWidths: Record<ID, number>; // For table view
  
  // Sort order
  sort: ViewSort[];
}

type ViewType = 'table' | 'board' | 'timeline' | 'calendar' | 'list' | 'gallery' | 'form';

interface ViewQuery {
  // Filters (AND logic between groups, OR within group)
  filterGroups: FilterGroup[];
  
  // Sorting
  sorts: ViewSort[];
  
  // Grouping (for board view)
  groupBy?: ID; // Property ID
  
  // Search
  searchQuery?: string;
}

interface FilterGroup {
  operator: 'AND' | 'OR';
  filters: Filter[];
}

interface Filter {
  propertyId: ID;
  operator: FilterOperator;
  value: unknown;
}

type FilterOperator =
  | 'equals' | 'does_not_equal'
  | 'contains' | 'does_not_contain'
  | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal'
  | 'before' | 'after' | 'on_or_before' | 'on_or_after'
  | 'within' | 'past_week' | 'past_month' | 'past_year' | 'this_week' | 'next_week'
  | 'is' | 'is_not' | 'includes' | 'does_not_include'
  | 'has_any' | 'has_all' | 'is_exactly'
  | 'relative_before' | 'relative_after';

interface ViewSort {
  propertyId: ID;
  direction: 'ascending' | 'descending';
}

interface ViewLayout {
  // Table view
  table?: {
    wrapCells: boolean;
    showVerticalLines: boolean;
    rowHeight: 'short' | 'medium' | 'tall';
  };
  
  // Board view
  board?: {
    cardCoverPropertyId?: ID;
    cardSize: 'small' | 'medium' | 'large';
    hideEmptyGroups: boolean;
  };
  
  // Calendar view
  calendar?: {
    showWeekends: boolean;
    startWeekOn: number; // 0 = Sunday
    datePropertyId: ID;
  };
  
  // Gallery view
  gallery?: {
    cardCoverPropertyId?: ID;
    cardSize: 'small' | 'medium' | 'large';
    fit: 'cover' | 'contain';
  };
  
  // Timeline view
  timeline?: {
    datePropertyId: ID;
    zoomLevel: 'day' | 'week' | 'month' | 'quarter' | 'year';
    showDependencies: boolean;
  };
}
```

---

## 2. Block System Architecture

### Block Operations (CRDT-like)

```typescript
// All block changes are operations
interface BlockOperation {
  id: ID;
  type: OperationType;
  blockId: ID;
  pageId: ID;
  
  // Operation data
  data: OperationData;
  
  // Metadata
  userId: ID;
  timestamp: Timestamp;
  
  // For conflict resolution
  parentOperationId: ID | null;
}

type OperationType =
  | 'insert_block'
  | 'update_block'
  | 'delete_block'
  | 'move_block'
  | 'duplicate_block'
  | 'indent_block'
  | 'outdent_block';

interface OperationData {
  // Insert
  block?: Block;
  afterBlockId?: ID; // Insert after this block
  parentBlockId?: ID; // Insert as child
  
  // Update
  updates?: Partial<Block>;
  
  // Move
  newParentId?: ID;
  newAfterBlockId?: ID;
}

// Block Store (Zustand-like)
interface BlockStore {
  // State
  blocks: Map<ID, Block>;
  pageBlockIds: Map<ID, ID[]>; // pageId -> ordered block IDs
  
  // Actions
  insertBlock: (pageId: ID, block: Block, afterBlockId?: ID) => void;
  updateBlock: (blockId: ID, updates: Partial<Block>) => void;
  deleteBlock: (blockId: ID) => void;
  moveBlock: (blockId: ID, newParentId: ID, newAfterBlockId?: ID) => void;
  
  // Derived
  getBlockChildren: (blockId: ID) => Block[];
  getBlockPath: (blockId: ID) => Block[]; // For breadcrumbs
}
```

### Block Rendering Strategy

```typescript
// Virtual list for performance
interface BlockListProps {
  pageId: ID;
  blocks: Block[];
  
  // Virtualization
  overscan: number;
  estimateHeight: (block: Block) => number;
  
  // Selection
  selectedBlockIds: Set<ID>;
  onSelect: (blockId: ID, multi: boolean) => void;
  
  // Drag & drop
  onDragStart: (blockId: ID) => void;
  onDragEnd: (targetBlockId: ID, position: 'before' | 'after' | 'child') => void;
}

// Block component registry
const blockComponents: Record<BlockType, ComponentType<BlockProps>> = {
  text: TextBlock,
  heading_1: Heading1Block,
  heading_2: Heading2Block,
  heading_3: Heading3Block,
  bulleted_list: BulletedListBlock,
  numbered_list: NumberedListBlock,
  to_do: ToDoBlock,
  toggle: ToggleBlock,
  database: DatabaseBlock, // Renders the database view
  // ... etc
};
```

---

## 3. Database Query Engine

### Query Pipeline

```typescript
// Query execution pipeline
class DatabaseQueryEngine {
  // Step 1: Get base set of pages
  async getPages(databaseId: ID): Promise<Page[]> {
    // From cache or API
  }
  
  // Step 2: Apply filters
  filterPages(pages: Page[], query: ViewQuery): Page[] {
    return pages.filter(page => {
      return query.filterGroups.every(group => {
        const results = group.filters.map(f => this.applyFilter(page, f));
        return group.operator === 'AND' 
          ? results.every(r => r)
          : results.some(r => r);
      });
    });
  }
  
  // Step 3: Apply sorts
  sortPages(pages: Page[], sorts: ViewSort[]): Page[] {
    return [...pages].sort((a, b) => {
      for (const sort of sorts) {
        const comparison = this.comparePages(a, b, sort);
        if (comparison !== 0) return sort.direction === 'ascending' ? comparison : -comparison;
      }
      return 0;
    });
  }
  
  // Step 4: Apply grouping (for board view)
  groupPages(pages: Page[], groupByPropertyId: ID): Map<string, Page[]> {
    const groups = new Map<string, Page[]>();
    
    for (const page of pages) {
      const value = this.getPropertyValue(page, groupByPropertyId);
      const key = this.valueToString(value);
      
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(page);
    }
    
    return groups;
  }
  
  // Step 5: Pagination
  paginate(pages: Page[], offset: number, limit: number): Page[] {
    return pages.slice(offset, offset + limit);
  }
}
```

### Computed Properties (Formula & Rollup)

```typescript
class ComputedPropertyEngine {
  // Formula evaluation
  evaluateFormula(formula: string, page: Page, context: FormulaContext): unknown {
    // Parse formula to AST
    const ast = this.parseFormula(formula);
    
    // Evaluate with context
    return this.evaluateAst(ast, {
      prop: (name: string) => this.getPropertyByName(page, name),
      now: () => new Date(),
      dateBetween: (start: Date, end: Date, unit: string) => {
        // Calculate difference
      },
      // ... other built-in functions
    });
  }
  
  // Rollup calculation
  calculateRollup(
    page: Page,
    relationPropertyId: ID,
    targetPropertyId: ID,
    function: RollupFunction
  ): unknown {
    // Get related pages
    const relatedPageIds = page.propertyValues[relationPropertyId]?.value as ID[];
    const relatedPages = relatedPageIds.map(id => this.getPage(id));
    
    // Get values from related pages
    const values = relatedPages.map(p => p.propertyValues[targetPropertyId]?.value);
    
    // Apply aggregation function
    return this.aggregate(values, function);
  }
  
  private aggregate(values: unknown[], fn: RollupFunction): unknown {
    switch (fn) {
      case 'count': return values.length;
      case 'sum': return values.reduce((a, b) => (a as number) + (b as number), 0);
      case 'average': return (values as number[]).reduce((a, b) => a + b, 0) / values.length;
      // ... etc
    }
  }
}
```

---

## 4. Relation & Rollup System

### Two-Way Relations

```typescript
class RelationManager {
  // Create a relation between databases
  async createRelation(
    sourceDbId: ID,
    targetDbId: ID,
    config: { name: string; syncedName?: string }
  ): Promise<{ sourceProp: PropertyDefinition; targetProp?: PropertyDefinition }> {
    
    // Create source property
    const sourceProp: PropertyDefinition = {
      id: generateId(),
      name: config.name,
      type: 'relation',
      config: {
        relation: {
          databaseId: targetDbId,
          type: config.syncedName ? 'dual' : 'single',
          syncedPropertyName: config.syncedName,
        },
      },
      order: 0,
    };
    
    // Create synced property if dual
    let targetProp: PropertyDefinition | undefined;
    if (config.syncedName) {
      targetProp = {
        id: generateId(),
        name: config.syncedName,
        type: 'relation',
        config: {
          relation: {
            databaseId: sourceDbId,
            type: 'dual',
            syncedPropertyName: config.name,
          },
        },
        order: 0,
      };
    }
    
    return { sourceProp, targetProp };
  }
  
  // Add relation between pages (keeps both sides in sync)
  async addRelation(
    sourcePageId: ID,
    sourcePropertyId: ID,
    targetPageId: ID
  ): Promise<void> {
    const sourcePage = await this.getPage(sourcePageId);
    const propDef = await this.getPropertyDefinition(sourcePropertyId);
    
    // Add to source
    const currentRelations = (sourcePage.propertyValues[sourcePropertyId]?.value as ID[]) || [];
    await this.updatePropertyValue(sourcePageId, sourcePropertyId, [...currentRelations, targetPageId]);
    
    // If dual relation, add to target
    if (propDef.config.relation?.type === 'dual') {
      const targetDb = await this.getDatabase(propDef.config.relation.databaseId);
      const syncedProp = targetDb.properties.find(
        p => p.name === propDef.config.relation!.syncedPropertyName
      );
      
      if (syncedProp) {
        const targetPage = await this.getPage(targetPageId);
        const targetRelations = (targetPage.propertyValues[syncedProp.id]?.value as ID[]) || [];
        await this.updatePropertyValue(targetPageId, syncedProp.id, [...targetRelations, sourcePageId]);
      }
    }
  }
}
```

---

## 5. Real-time Collaboration

### Operational Transformation / CRDT Hybrid

```typescript
// Collaboration session
interface CollaborationSession {
  workspaceId: ID;
  pageId: ID;
  
  // Connected users
  users: Map<ID, UserCursor>;
  
  // Operation log
  operations: BlockOperation[];
  
  // Current state version
  version: number;
}

interface UserCursor {
  userId: ID;
  userName: string;
  userColor: string;
  
  // Selection state
  blockId: ID | null;
  range: { start: number; end: number } | null;
  
  // Last activity
  lastSeen: Timestamp;
}

// WebSocket message types
interface CollabMessage {
  type: 'operation' | 'cursor' | 'presence' | 'awareness';
  data: unknown;
  timestamp: Timestamp;
}

// Conflict resolution
class ConflictResolver {
  // Transform local operation against remote operations
  transform(op: BlockOperation, against: BlockOperation[]): BlockOperation {
    let transformed = op;
    
    for (const remoteOp of against) {
      // If both modify same block, resolve based on timestamp
      if (transformed.blockId === remoteOp.blockId) {
        if (remoteOp.timestamp > transformed.timestamp) {
          // Remote wins, mark local as conflict
          transformed = this.markConflict(transformed, remoteOp);
        }
      }
      
      // Transform indices for list operations
      if (this.isListOperation(transformed) && this.isListOperation(remoteOp)) {
        transformed = this.transformIndices(transformed, remoteOp);
      }
    }
    
    return transformed;
  }
}

// Comments system
interface Comment {
  id: ID;
  pageId: ID;
  blockId: ID | null; // Can be attached to specific block
  
  // Comment content
  content: RichText[];
  
  // Thread
  parentId: ID | null; // For replies
  replyIds: ID[];
  
  // Resolution
  resolved: boolean;
  resolvedBy?: ID;
  resolvedAt?: Timestamp;
  
  // Metadata
  createdBy: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 6. Backlink & Graph System

```typescript
// Backlink tracking
interface BacklinkIndex {
  // Forward: page -> pages it links to
  outgoing: Map<ID, Set<ID>>;
  
  // Backward: page -> pages that link to it
  incoming: Map<ID, Set<ID>>;
}

class BacklinkManager {
  private index: BacklinkIndex = {
    outgoing: new Map(),
    incoming: new Map(),
  };
  
  // Extract links from block content
  extractLinks(block: Block): ID[] {
    const links: ID[] = [];
    
    if (block.content.text) {
      for (const rt of block.content.text) {
        if (rt.type === 'mention' && rt.mention?.type === 'page') {
          links.push(rt.mention.page!.id);
        }
      }
    }
    
    if (block.content.pageId) {
      links.push(block.content.pageId);
    }
    
    return links;
  }
  
  // Update index when page changes
  async updatePageLinks(pageId: ID, blocks: Block[]): Promise<void> {
    const oldOutgoing = this.index.outgoing.get(pageId) || new Set();
    const newOutgoing = new Set<ID>();
    
    // Extract all links
    const traverse = (block: Block) => {
      newOutgoing.add(...this.extractLinks(block));
      block.children.forEach(traverse);
    };
    blocks.forEach(traverse);
    
    // Update outgoing
    this.index.outgoing.set(pageId, newOutgoing);
    
    // Update incoming (remove old, add new)
    for (const targetId of oldOutgoing) {
      if (!newOutgoing.has(targetId)) {
        this.index.incoming.get(targetId)?.delete(pageId);
      }
    }
    
    for (const targetId of newOutgoing) {
      if (!this.index.incoming.has(targetId)) {
        this.index.incoming.set(targetId, new Set());
      }
      this.index.incoming.get(targetId)!.add(pageId);
    }
  }
  
  // Get backlinks for a page
  getBacklinks(pageId: ID): ID[] {
    return Array.from(this.index.incoming.get(pageId) || []);
  }
  
  // Get graph data for visualization
  getGraphData(workspaceId: ID): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    for (const [sourceId, targets] of this.index.outgoing) {
      nodes.push({ id: sourceId, type: 'page' });
      
      for (const targetId of targets) {
        edges.push({ source: sourceId, target: targetId });
      }
    }
    
    return { nodes, edges };
  }
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNode {
  id: ID;
  type: 'page' | 'database';
  title?: string;
  color?: string;
}

interface GraphEdge {
  source: ID;
  target: ID;
  type?: 'link' | 'relation';
}
```

---

## 7. API Design

### REST + WebSocket Hybrid

```typescript
// HTTP API for CRUD
interface PageAPI {
  // Pages
  'GET /api/pages/:id': { response: Page };
  'POST /api/pages': { body: CreatePageInput; response: Page };
  'PATCH /api/pages/:id': { body: UpdatePageInput; response: Page };
  'DELETE /api/pages/:id': { response: void };
  
  // Blocks (batch operations for performance)
  'POST /api/pages/:id/blocks': { body: BlockOperation[]; response: Block[] };
  'PATCH /api/blocks/:id': { body: Partial<Block>; response: Block };
  
  // Databases
  'GET /api/databases/:id': { response: Database };
  'POST /api/databases': { body: CreateDatabaseInput; response: Database };
  'POST /api/databases/:id/query': { body: ViewQuery; response: QueryResult };
  
  // Search
  'GET /api/search': { query: { q: string; workspaceId: ID }; response: SearchResult[] };
  
  // Backlinks
  'GET /api/pages/:id/backlinks': { response: Page[] };
}

// WebSocket for real-time
interface WebSocketAPI {
  // Client -> Server
  'join': { pageId: ID };
  'leave': { pageId: ID };
  'operation': { operation: BlockOperation };
  'cursor': { cursor: UserCursor };
  'awareness': { state: unknown };
  
  // Server -> Client
  'user_joined': { user: UserInfo };
  'user_left': { userId: ID };
  'operation': { operation: BlockOperation };
  'cursor': { userId: ID; cursor: UserCursor };
  'awareness': { states: Map<ID, unknown> };
}
```

---

## 8. Storage & Sync Strategy

### Local-First with Server Sync

```typescript
interface SyncEngine {
  // Local storage (IndexedDB)
  local: {
    pages: IDBObjectStore;
    blocks: IDBObjectStore;
    operations: IDBObjectStore; // Pending operations
  };
  
  // Sync state
  syncState: {
    lastSyncAt: Timestamp;
    pendingOperations: BlockOperation[];
    conflictQueue: BlockOperation[];
  };
  
  // Operations
  applyLocal(operation: BlockOperation): void;
  syncToServer(): Promise<void>;
  handleServerOperations(ops: BlockOperation[]): void;
  resolveConflicts(): void;
}

// Optimistic updates with rollback
class OptimisticUpdater {
  private pending = new Map<ID, () => void>(); // Rollback functions
  
  async update<T>(
    operation: BlockOperation,
    optimisticApply: () => T,
    serverCall: () => Promise<T>
  ): Promise<T> {
    // Apply optimistically
    const rollback = this.captureState();
    const result = optimisticApply();
    
    try {
      // Send to server
      const serverResult = await serverCall();
      this.pending.delete(operation.id);
      return serverResult;
    } catch (error) {
      // Rollback on error
      rollback();
      this.pending.delete(operation.id);
      throw error;
    }
  }
}
```

---

## 9. Component Architecture

```
App
├── WorkspaceProvider
│   ├── PageTree (sidebar)
│   └── PageContainer
│       ├── PageHeader (icon, title, properties)
│       ├── BlockEditor
│       │   ├── VirtualBlockList
│       │   │   └── BlockRenderer (by type)
│       │   │       ├── TextBlock
│       │   │       ├── DatabaseBlock
│       │   │       │   └── DatabaseView
│       │   │       │       ├── TableView
│       │   │       │       ├── BoardView
│       │   │       │       └── ...
│       │   │       └── ...
│       │   ├── BlockToolbar (slash commands)
│       │   └── SelectionManager
│       └── CommentsSidebar
├── CollaborationProvider
│   ├── CursorOverlay
│   └── PresenceIndicator
└── CommandPalette
```

---

## 10. Key Implementation Decisions

1. **Use Yjs or Automerge for CRDTs** - Handle concurrent editing
2. **Virtualize long lists** - React-window or similar
3. **Debounced saves** - 500ms delay for auto-save
4. **Incremental loading** - Load blocks on scroll
5. **Property value caching** - Cache computed formulas/rollups
6. **IndexDB for offline** - Local-first architecture
7. **WebSocket with reconnection** - Reliable real-time sync
