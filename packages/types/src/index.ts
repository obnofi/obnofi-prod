export * from "./database";
export * from "./ai";
export * from "./db-diagram";

// Re-export common types at the top level
export type PageType = "document" | "canvas" | "database";
export type GroveTitleLevel = 1 | 2 | 3 | 4 | 5;
export type HeadingLevel = 1 | 2 | 3 | 4 | 5;
export type PageHighlightColor =
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange";

export interface PageHeadingFontSizes {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
}

export interface Page {
  id: string;
  title: string;
  groveTitleLevel: GroveTitleLevel;
  bodyFontSizePt: number;
  headingFontSizes: PageHeadingFontSizes;
  highlightColors: PageHighlightColor[];
  content: object | null;
  type: PageType;
  icon?: string | null;
  coverImage?: string | null;
  parentId: string | null;
  order: number;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  yjsUpdatedAt?: string | null;
  isPublic: boolean;
  shareId: string | null;
  sharePassword: string | null;
  databaseId?: string | null;
  parentDatabaseId?: string | null;
  propertyValues?: PropertyValue[];
  collaborationEnabled: boolean;
  lineIndicatorEnabled: boolean;
}

export type CollabRole = "editor" | "viewer";

export interface PageCollaborator {
  id: string;
  pageId: string;
  userId: string;
  role: CollabRole;
  invitedBy: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface PublicPageResponse {
  id: string;
  title: string;
  content: object | null;
  isPasswordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShareSettings {
  isPublic: boolean;
  password?: string;
}

export interface CreatePageInput {
  title: string;
  type: PageType;
  parentId?: string | null;
  workspaceId: string;
  databaseId?: string | null;
  content?: object | null;
}

export interface UpdatePageInput {
  title?: string;
  groveTitleLevel?: GroveTitleLevel;
  bodyFontSizePt?: number;
  headingFontSizes?: Partial<PageHeadingFontSizes>;
  highlightColors?: PageHighlightColor[];
  content?: object | null;
  icon?: string | null;
  coverImage?: string | null;
  parentId?: string | null;
  order?: number;
  isPublic?: boolean;
  collaborationEnabled?: boolean;
  lineIndicatorEnabled?: boolean;
}

// ============================================
// Database Property Types (Notion-like)
// ============================================

export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "person"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "status"
  | "files"
  | "relation"
  | "rollup"
  | "formula"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by";

// Legacy alias for backward compatibility
export type ColumnType = PropertyType;

export type SelectOptionColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export interface SelectOption {
  id: string;
  label: string;
  color: SelectOptionColor;
}

export interface Property {
  id: string;
  databaseId: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[];
  order: number;
  relationConfig?: {
    relatedDatabaseId: string;
    twoWay: boolean;
    twoWayPropertyName?: string;
  };
  rollupConfig?: {
    relationPropertyId: string;
    rollupPropertyId: string;
    function: RollupFunction;
  };
  formulaConfig?: {
    expression: string;
  };
}

// Legacy alias for backward compatibility
export type Column = Property;

export type RollupFunction =
  | "show_original"
  | "count"
  | "count_values"
  | "count_unique_values"
  | "count_empty"
  | "count_not_empty"
  | "percent_empty"
  | "percent_not_empty"
  | "sum"
  | "average"
  | "median"
  | "min"
  | "max"
  | "range"
  | "earliest_date"
  | "latest_date"
  | "date_range"
  | "checked"
  | "unchecked"
  | "percent_checked"
  | "percent_unchecked"
  | "show_unique_values"
  | "join"
  | "join_all"
  | "concatenate";

export type PropertyValueData =
  | { type: "text"; value: string }
  | { type: "number"; value: number | null }
  | { type: "select"; optionId: string | null }
  | { type: "multi_select"; optionIds: string[] }
  | { type: "status"; optionId: string | null }
  | { type: "date"; value: string | null; endValue?: string | null; includeTime?: boolean }
  | { type: "person"; userId: string | null }
  | { type: "people"; userIds: string[] }
  | { type: "checkbox"; value: boolean }
  | { type: "url"; value: string }
  | { type: "email"; value: string }
  | { type: "phone"; value: string }
  | { type: "formula"; value: string; resultType: PropertyType }
  | { type: "relation"; pageIds: string[] }
  | { type: "rollup"; value: unknown; function: RollupFunction }
  | { type: "created_time"; value: string }
  | { type: "created_by"; userId: string }
  | { type: "last_edited_time"; value: string }
  | { type: "last_edited_by"; userId: string }
  | { type: "files"; files: FileReference[] };

export interface FileReference {
  id: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface PropertyValue {
  id: string;
  pageId: string;
  propertyId: string;
  columnId: string; // Legacy field for backward compatibility
  value: PropertyValueData;
}

// ============================================
// Database Types
// ============================================

export interface Database {
  id: string;
  pageId: string;
  properties: Property[];
  columns: Property[]; // Legacy alias
  rows: Page[];
  views?: import("./database").View[];
}

export interface DatabasePage extends Page {
  database: Database;
}

// ============================================
// View Types
// ============================================

export type ViewMode = "table" | "board" | "gallery" | "list" | "calendar" | "timeline";

export interface DatabaseViewState {
  viewMode: ViewMode;
  sortColumnId?: string;
  sortDirection: "asc" | "desc";
  filterColumnId?: string;
  filterValue?: string;
  groupByColumnId?: string;
  searchQuery: string;
}

// ============================================
// API Input Types
// ============================================

export interface CreatePropertyInput {
  databaseId: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[];
}

// Legacy alias
export type CreateColumnInput = CreatePropertyInput;

export interface UpdatePropertyInput {
  name?: string;
  type?: PropertyType;
  options?: SelectOption[];
  order?: number;
}

// Legacy alias
export type UpdateColumnInput = UpdatePropertyInput;

export interface CreatePropertyValueInput {
  pageId: string;
  propertyId: string;
  value: PropertyValueData;
}

export interface UpdatePropertyValueInput {
  value: PropertyValueData;
}

// ============================================
// Property Type Metadata
// ============================================

export interface PropertyTypeMeta {
  type: PropertyType;
  label: string;
  icon: string;
  description: string;
  category: "basic" | "advanced" | "computed";
  editable: boolean;
}

export const PROPERTY_TYPE_METADATA: PropertyTypeMeta[] = [
  // Basic types
  { type: "text", label: "Text", icon: "Type", description: "Plain text", category: "basic", editable: true },
  { type: "number", label: "Number", icon: "Hash", description: "Numeric value", category: "basic", editable: true },
  { type: "select", label: "Select", icon: "List", description: "Single option from a list", category: "basic", editable: true },
  { type: "multi_select", label: "Multi-select", icon: "ListChecks", description: "Multiple options from a list", category: "basic", editable: true },
  { type: "status", label: "Status", icon: "Kanban", description: "Status with workflow", category: "basic", editable: true },
  { type: "date", label: "Date", icon: "Calendar", description: "Date and optional time", category: "basic", editable: true },
  { type: "person", label: "Person", icon: "User", description: "Single user", category: "basic", editable: true },
  { type: "checkbox", label: "Checkbox", icon: "CheckSquare", description: "Yes/No value", category: "basic", editable: true },
  { type: "url", label: "URL", icon: "Link", description: "Web link", category: "basic", editable: true },
  { type: "email", label: "Email", icon: "Mail", description: "Email address", category: "basic", editable: true },
  { type: "phone", label: "Phone", icon: "Phone", description: "Phone number", category: "basic", editable: true },
  { type: "files", label: "Files & media", icon: "Paperclip", description: "Attachments", category: "basic", editable: true },
  
  // Advanced types
  { type: "relation", label: "Relation", icon: "ArrowLeftRight", description: "Link to another database", category: "advanced", editable: false },
  { type: "rollup", label: "Rollup", icon: "Calculator", description: "Aggregate related data", category: "advanced", editable: false },
  { type: "formula", label: "Formula", icon: "FunctionSquare", description: "Computed from other properties", category: "advanced", editable: false },
  
  // Computed types (auto-generated)
  { type: "created_time", label: "Created time", icon: "Clock", description: "When page was created", category: "computed", editable: false },
  { type: "created_by", label: "Created by", icon: "UserPlus", description: "Who created the page", category: "computed", editable: false },
  { type: "last_edited_time", label: "Last edited time", icon: "Clock", description: "When page was last edited", category: "computed", editable: false },
  { type: "last_edited_by", label: "Last edited by", icon: "Edit3", description: "Who last edited the page", category: "computed", editable: false },
];
