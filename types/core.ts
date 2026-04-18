/**
 * Core type definitions for the Notion-like system
 */

// ============================================
// Base Types
// ============================================

export type ID = string;
export type Timestamp = number;

export interface User {
  id: ID;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  startWeekOn: number; // 0 = Sunday
}

export interface Workspace {
  id: ID;
  name: string;
  slug: string;
  ownerId: ID;
  memberIds: ID[];
  settings: WorkspaceSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkspaceSettings {
  publicAccess: boolean;
  allowGuests: boolean;
  defaultPageIcon?: Icon;
}

// ============================================
// Icon & Cover Types
// ============================================

export type Icon = 
  | { type: 'emoji'; emoji: string }
  | { type: 'image'; url: string }
  | { type: 'lucide'; name: string };

export type Cover = 
  | { type: 'color'; color: string }
  | { type: 'gradient'; from: string; to: string }
  | { type: 'image'; url: string; position?: 'center' | 'top' | 'bottom' };

// ============================================
// Rich Text Types
// ============================================

export interface RichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: Mention;
  equation?: { expression: string };
  annotations: TextAnnotations;
}

export interface TextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string; // Color code or 'default'
}

export type Mention = 
  | { type: 'user'; user: { id: ID } }
  | { type: 'page'; page: { id: ID } }
  | { type: 'date'; date: { start: string; end?: string; timeZone?: string } }
  | { type: 'database'; database: { id: ID } };

// ============================================
// Block Types
// ============================================

export type BlockType = 
  // Text blocks
  | 'paragraph'
  | 'heading_1' 
  | 'heading_2' 
  | 'heading_3'
  | 'bulleted_list_item' 
  | 'numbered_list_item' 
  | 'to_do'
  | 'toggle'
  | 'quote' 
  | 'callout' 
  | 'code'
  // Layout blocks
  | 'divider' 
  | 'column_list' 
  | 'column'
  // Page blocks
  | 'child_page'
  | 'link_to_page'
  | 'link_preview'
  // Database blocks
  | 'child_database'
  | 'database_view'
  // Media blocks
  | 'image' 
  | 'video' 
  | 'file' 
  | 'pdf'
  | 'embed'
  | 'bookmark'
  // Table blocks
  | 'table' 
  | 'table_row';

export interface Block {
  id: ID;
  type: BlockType;
  content: BlockContent;
  children: Block[];
  format?: BlockFormat;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BlockContent {
  // Text-based blocks
  richText?: RichText[];
  
  // To-do
  checked?: boolean;
  
  // Code
  language?: string;
  code?: string;
  
  // Callout
  icon?: Icon;
  
  // Media
  file?: MediaFile;
  external?: { url: string };
  
  // Page reference
  pageId?: ID;
  
  // Database
  databaseId?: ID;
  viewId?: ID;
  
  // Bookmark/embed
  url?: string;
  caption?: RichText[];
  
  // Table
  tableWidth?: number;
  hasColumnHeader?: boolean;
  hasRowHeader?: boolean;
  
  // Column
  columnRatio?: number;
}

export interface MediaFile {
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface BlockFormat {
  blockColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
}

// ============================================
// Page Types
// ============================================

export interface Page {
  id: ID;
  workspaceId: ID;
  
  // Tree structure
  parentId: ID | null;
  childrenIds: ID[];
  
  // Content
  content: Block[];
  
  // Database integration
  databaseId: ID | null;
  propertyValues: Record<PropertyId, PropertyValue>;
  
  // Metadata
  icon: Icon | null;
  cover: Cover | null;
  
  // System
  createdBy: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
  
  // Collaboration
  lastEditedBy: ID;
  lastEditedAt: Timestamp;
}

// ============================================
// Property Types
// ============================================

export type PropertyId = ID;

export type PropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'status'
  | 'date'
  | 'person'
  | 'files'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone_number'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'
  | 'unique_id';

export interface PropertyDefinition {
  id: PropertyId;
  name: string;
  type: PropertyType;
  config: PropertyConfig;
  order: number;
}

export interface PropertyConfig {
  // Select options
  options?: SelectOption[];
  optionGroups?: OptionGroup[];
  
  // Status options
  groups?: StatusGroup[];
  
  // Number
  numberFormat?: NumberFormat;
  
  // Date
  dateFormat?: DateFormat;
  includeTime?: boolean;
  
  // Relation
  relation?: RelationConfig;
  
  // Rollup
  rollup?: RollupConfig;
  
  // Formula
  formula?: FormulaConfig;
  
  // Unique ID
  prefix?: string;
  
  // Person
  multiple?: boolean;
}

export interface SelectOption {
  id: ID;
  name: string;
  color: ColorPreset;
}

export interface OptionGroup {
  id: ID;
  name: string;
  optionIds: ID[];
  color: ColorPreset;
}

export interface StatusGroup {
  id: ID;
  name: string;
  color: ColorPreset;
  optionIds: ID[];
}

export type ColorPreset = 
  | 'default' | 'gray' | 'brown' | 'orange' | 'yellow' 
  | 'green' | 'blue' | 'purple' | 'pink' | 'red';

export type NumberFormat = 
  | 'number' | 'dollar' | 'euro' | 'pound' | 'yen' 
  | 'rupee' | 'won' | 'ruble' | 'percent' | 'progress_bar';

export type DateFormat = 
  | 'full_date' | 'month_day_year' | 'day_month_year' 
  | 'year_month_day' | 'relative';

export interface RelationConfig {
  databaseId: ID;
  type: 'single' | 'dual';
  syncedPropertyId?: PropertyId;
  syncedPropertyName?: string;
}

export interface RollupConfig {
  relationPropertyId: PropertyId;
  rollupPropertyId: PropertyId;
  function: RollupFunction;
}

export type RollupFunction = 
  | 'show_original' | 'show_unique'
  | 'count' | 'count_values' | 'count_unique_values'
  | 'empty' | 'not_empty'
  | 'percent_empty' | 'percent_not_empty'
  | 'sum' | 'average' | 'median' | 'min' | 'max' | 'range'
  | 'earliest_date' | 'latest_date' | 'date_range'
  | 'checked' | 'unchecked'
  | 'percent_checked' | 'percent_unchecked'
  | 'join' | 'concatenate';

export interface FormulaConfig {
  expression: string;
  returnType: 'string' | 'number' | 'boolean' | 'date';
}

export interface PropertyValue {
  propertyId: PropertyId;
  type: PropertyType;
  value: PropertyValueType;
}

export type PropertyValueType =
  | string                          // title, rich_text, url, email, phone_number
  | number                          // number
  | ID                              // select
  | ID[]                            // multi_select, person, files
  | { start: string; end?: string } // date
  | boolean                         // checkbox
  | ID[]                            // relation
  | unknown                         // rollup, formula
  | null;

// ============================================
// Database Types
// ============================================

export interface Database {
  id: ID;
  workspaceId: ID;
  parentPageId: ID;
  parentBlockId: ID;
  
  // Schema
  properties: PropertyDefinition[];
  
  // Views
  views: DatabaseView[];
  
  // Pages in this database
  pageIds: ID[];
  
  // Templates
  templates: DatabaseTemplate[];
  
  // Settings
  settings: DatabaseSettings;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DatabaseSettings {
  isInline: boolean;
  defaultViewId?: ID;
  duplicateProperties?: boolean;
}

export type ViewType = 'table' | 'board' | 'timeline' | 'calendar' | 'list' | 'gallery' | 'form';

export interface DatabaseView {
  id: ID;
  name: string;
  type: ViewType;
  query: ViewQuery;
  layout: ViewLayout;
  visiblePropertyIds: PropertyId[];
  propertyWidths: Record<PropertyId, number>;
  sort: ViewSort[];
}

export interface ViewQuery {
  filterGroups: FilterGroup[];
  sorts: ViewSort[];
  groupBy?: PropertyId;
  searchQuery?: string;
}

export interface FilterGroup {
  operator: 'AND' | 'OR';
  filters: Filter[];
}

export interface Filter {
  propertyId: PropertyId;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator =
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

export interface ViewSort {
  propertyId: PropertyId;
  direction: 'ascending' | 'descending';
}

export interface ViewLayout {
  table?: TableLayout;
  board?: BoardLayout;
  calendar?: CalendarLayout;
  gallery?: GalleryLayout;
  timeline?: TimelineLayout;
  list?: ListLayout;
}

export interface TableLayout {
  wrapCells: boolean;
  showVerticalLines: boolean;
  rowHeight: 'short' | 'medium' | 'tall';
  frozenColumnId?: PropertyId;
}

export interface BoardLayout {
  cardCoverPropertyId?: PropertyId;
  cardSize: 'small' | 'medium' | 'large';
  hideEmptyGroups: boolean;
  groupBy: PropertyId;
}

export interface CalendarLayout {
  showWeekends: boolean;
  startWeekOn: number;
  datePropertyId: PropertyId;
  viewMode: 'month' | 'week' | 'day';
}

export interface GalleryLayout {
  cardCoverPropertyId?: PropertyId;
  cardSize: 'small' | 'medium' | 'large';
  fit: 'cover' | 'contain';
  showName: boolean;
}

export interface TimelineLayout {
  datePropertyId: PropertyId;
  endDatePropertyId?: PropertyId;
  zoomLevel: 'day' | 'week' | 'month' | 'quarter' | 'year';
  showDependencies: boolean;
  groupBy?: PropertyId;
}

export interface ListLayout {
  showPageIcon: boolean;
  showCover: boolean;
  propertyVisibility: 'all' | 'minimal' | 'custom';
  visiblePropertyIds?: PropertyId[];
}

export interface DatabaseTemplate {
  id: ID;
  name: string;
  icon?: Icon;
  pageContent: Block[];
  defaultPropertyValues: Record<PropertyId, PropertyValueType>;
}

// ============================================
// Collaboration Types
// ============================================

export interface Comment {
  id: ID;
  pageId: ID;
  blockId?: ID;
  
  content: RichText[];
  
  // Threading
  parentId?: ID;
  replyIds: ID[];
  
  // Resolution
  resolved: boolean;
  resolvedBy?: ID;
  resolvedAt?: Timestamp;
  
  createdBy: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserCursor {
  userId: ID;
  userName: string;
  userColor: string;
  
  blockId: ID | null;
  range: { start: number; end: number } | null;
  
  lastSeen: Timestamp;
}

export interface CollaborationSession {
  workspaceId: ID;
  pageId: ID;
  users: Map<ID, UserCursor>;
  version: number;
}

// ============================================
// Operation Types (for real-time sync)
// ============================================

export type OperationType =
  | 'insert_block'
  | 'update_block'
  | 'delete_block'
  | 'move_block'
  | 'duplicate_block'
  | 'indent_block'
  | 'outdent_block'
  | 'update_page'
  | 'update_property';

export interface BlockOperation {
  id: ID;
  type: OperationType;
  blockId: ID;
  pageId: ID;
  data: OperationData;
  userId: ID;
  timestamp: Timestamp;
  parentOperationId: ID | null;
}

export interface OperationData {
  block?: Block;
  afterBlockId?: ID;
  parentBlockId?: ID;
  updates?: Partial<Block> | Partial<Page>;
  newParentId?: ID;
  newAfterBlockId?: ID;
  propertyId?: PropertyId;
  propertyValue?: PropertyValue;
}

// ============================================
// Search & Backlinks
// ============================================

export interface SearchResult {
  type: 'page' | 'database' | 'block';
  id: ID;
  title: string;
  icon?: Icon;
  parentTitle?: string;
  snippet?: string;
  matches: Array<{ start: number; end: number }>;
}

export interface BacklinkInfo {
  sourcePageId: ID;
  sourcePageTitle: string;
  sourcePageIcon?: Icon | null;
  blockId?: ID;
  context: string; // Surrounding text
}

export interface GraphNode {
  id: ID;
  type: 'page' | 'database';
  title: string;
  icon?: Icon | null;
  x?: number;
  y?: number;
  depth?: number;
}

export interface GraphEdge {
  source: ID;
  target: ID;
  type: 'link' | 'relation';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
