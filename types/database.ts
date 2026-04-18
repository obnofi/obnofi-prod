// Database Property Types
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
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by"
  | "files"
  | "status";

// Select option definition
export interface SelectOption {
  id: string;
  label: string;
  color: SelectOptionColor;
}

// Notion-like color palette for select options
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

// Color values for UI rendering
export const SELECT_OPTION_COLORS: Record<SelectOptionColor, string> = {
  default: "#E3E2E0",
  gray: "#E3E2E0",
  brown: "#EEE0DA",
  orange: "#FADEC9",
  yellow: "#FDECC8",
  green: "#DBEDDB",
  blue: "#D3E5EF",
  purple: "#E8DEEE",
  pink: "#F4E0E9",
  red: "#FFE2DD",
};

// Darker text colors for better contrast
export const SELECT_OPTION_TEXT_COLORS: Record<SelectOptionColor, string> = {
  default: "#37352F",
  gray: "#37352F",
  brown: "#43302B",
  orange: "#594A3C",
  yellow: "#594A3C",
  green: "#2E4435",
  blue: "#364954",
  purple: "#443A57",
  pink: "#533B4C",
  red: "#5C3B39",
};

// Database column (property) definition
export interface Property {
  id: string;
  databaseId: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[]; // For select, multi_select, status
  order: number;
  // For relation type
  relationConfig?: {
    relatedDatabaseId: string;
    twoWay: boolean;
    twoWayPropertyName?: string;
  };
  // For rollup type
  rollupConfig?: {
    relationPropertyId: string;
    rollupPropertyId: string;
    function: RollupFunction;
  };
  // For formula type
  formulaConfig?: {
    expression: string;
  };
}

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

// Property value union type
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

// Property value instance (linking property to page)
export interface PropertyValue {
  id: string;
  pageId: string;
  propertyId: string;
  value: PropertyValueData;
}

export type TaskStatus = "To Do" | "In Progress" | "Done";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  tags: string[];
  date: string;
  startDate: string;
  endDate: string;
}

// Database view types
export type ViewType = "table" | "board" | "gallery" | "list" | "calendar" | "timeline";

export interface View {
  id: string;
  databaseId: string;
  name: string;
  type: ViewType;
  // View configuration
  config: ViewConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ViewConfig {
  // Properties visibility and order
  visibleProperties: string[]; // propertyIds
  propertyWidths: Record<string, number>;
  // Sorting
  sorts: SortConfig[];
  // Filtering
  filters: FilterConfig[];
  // Grouping (for board view)
  groupBy?: string; // propertyId
  // Calendar view
  calendarBy?: string; // date propertyId
  // Timeline view
  timelineBy?: {
    startPropertyId: string;
    endPropertyId?: string;
  };
  // Board view
  boardColumns?: string[]; // optionIds for select/status
}

export interface SortConfig {
  propertyId: string;
  direction: "ascending" | "descending";
}

export interface FilterConfig {
  propertyId: string;
  operator: FilterOperator;
  value?: unknown;
}

export type FilterOperator =
  | "equals"
  | "does_not_equal"
  | "contains"
  | "does_not_contain"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal_to"
  | "less_than_or_equal_to"
  | "before"
  | "after"
  | "on_or_before"
  | "on_or_after"
  | "within_last"
  | "within_next"
  | "past_week"
  | "past_month"
  | "past_year"
  | "this_week"
  | "this_month"
  | "this_year"
  | "is"
  | "is_not"
  | "includes"
  | "does_not_include"
  | "includes_all"
  | "includes_any"
  | "is_checked"
  | "is_unchecked";

// Database definition
export interface Database {
  id: string;
  pageId: string;
  properties: Property[];
  views: View[];
  rows: DatabaseRow[];
}

// Page that is a row in a database
export interface DatabaseRow {
  id: string;
  title: string;
  icon?: string | null;
  cover?: string | null;
  propertyValues: PropertyValue[];
  createdAt: string;
  updatedAt: string;
}

// Property type metadata for UI
export interface PropertyTypeMeta {
  type: PropertyType;
  label: string;
  icon: string; // Lucide icon name
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

// Helper to get property type metadata
export function getPropertyTypeMeta(type: PropertyType): PropertyTypeMeta | undefined {
  return PROPERTY_TYPE_METADATA.find((meta) => meta.type === type);
}

// Check if property type supports options (select, multi_select, status)
export function isOptionBasedType(type: PropertyType): boolean {
  return type === "select" || type === "multi_select" || type === "status";
}

// Check if property type is computed (read-only)
export function isComputedType(type: PropertyType): boolean {
  return ["created_time", "created_by", "last_edited_time", "last_edited_by", "formula", "rollup"].includes(type);
}
