import {
  PropertyType,
  PropertyValueData,
  SelectOption,
  SelectOptionColor,
  Property,
} from "@obnofi/types";

export interface DefaultColumnDefinition {
  name: string;
  type: PropertyType;
  options?: SelectOption[];
}

// All available property types
export const ALL_PROPERTY_TYPES: PropertyType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "person",
  "checkbox",
  "url",
  "email",
  "phone",
  "files",
  "relation",
  "rollup",
  "formula",
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
];

// Basic editable types (P0 priority)
export const BASIC_PROPERTY_TYPES: PropertyType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "person",
  "checkbox",
  "url",
  "email",
  "phone",
];

// Legacy export for backward compatibility
export const DATABASE_COLUMN_TYPES = BASIC_PROPERTY_TYPES;

const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { id: "status-todo", label: "To Do", color: "gray" },
  { id: "status-in-progress", label: "In Progress", color: "yellow" },
  { id: "status-done", label: "Done", color: "green" },
];

const DEFAULT_PRIORITY_OPTIONS: SelectOption[] = [
  { id: "priority-low", label: "Low", color: "gray" },
  { id: "priority-medium", label: "Medium", color: "yellow" },
  { id: "priority-high", label: "High", color: "red" },
];

export function getExampleDatabaseColumns(): DefaultColumnDefinition[] {
  return [
    {
      name: "Status",
      type: "status",
      options: DEFAULT_STATUS_OPTIONS,
    },
    {
      name: "Priority",
      type: "select",
      options: DEFAULT_PRIORITY_OPTIONS,
    },
    {
      name: "Due Date",
      type: "date",
    },
    {
      name: "Assignee",
      type: "person",
    },
  ];
}

export function getDefaultOptionsForProperty(
  type: PropertyType,
  name?: string
): SelectOption[] | undefined {
  if (type === "status") {
    return DEFAULT_STATUS_OPTIONS.map((option) => ({ ...option }));
  }

  if (type === "select") {
    if (name?.trim().toLowerCase() === "priority") {
      return DEFAULT_PRIORITY_OPTIONS.map((option) => ({ ...option }));
    }

    return [
      { id: `${name ?? "option"}-option-1`, label: "Option 1", color: "gray" },
      { id: `${name ?? "option"}-option-2`, label: "Option 2", color: "blue" },
      { id: `${name ?? "option"}-option-3`, label: "Option 3", color: "green" },
    ];
  }

  return undefined;
}

export function normalizePropertyOptions(
  type: PropertyType,
  name: string,
  options?: SelectOption[]
): SelectOption[] | undefined {
  if (type !== "select" && type !== "multi_select" && type !== "status") {
    return undefined;
  }

  if (options && options.length > 0) {
    return options;
  }

  return getDefaultOptionsForProperty(type, name);
}

// Get display label for property type
export function getPropertyTypeLabel(type: PropertyType): string {
  switch (type) {
    case "text":
      return "Text";
    case "number":
      return "Number";
    case "select":
      return "Select";
    case "multi_select":
      return "Multi-select";
    case "status":
      return "Status";
    case "date":
      return "Date";
    case "person":
      return "Person";
    case "checkbox":
      return "Checkbox";
    case "url":
      return "URL";
    case "email":
      return "Email";
    case "phone":
      return "Phone";
    case "files":
      return "Files & media";
    case "relation":
      return "Relation";
    case "rollup":
      return "Rollup";
    case "formula":
      return "Formula";
    case "created_time":
      return "Created time";
    case "created_by":
      return "Created by";
    case "last_edited_time":
      return "Last edited time";
    case "last_edited_by":
      return "Last edited by";
    default:
      return type;
  }
}

// Legacy alias for backward compatibility
export const getColumnTypeLabel = getPropertyTypeLabel;

// Get Lucide icon name for property type
export function getPropertyTypeIcon(type: PropertyType): string {
  switch (type) {
    case "text":
      return "Type";
    case "number":
      return "Hash";
    case "select":
      return "List";
    case "multi_select":
      return "ListChecks";
    case "status":
      return "Kanban";
    case "date":
      return "Calendar";
    case "person":
      return "User";
    case "checkbox":
      return "CheckSquare";
    case "url":
      return "Link";
    case "email":
      return "Mail";
    case "phone":
      return "Phone";
    case "files":
      return "Paperclip";
    case "relation":
      return "ArrowLeftRight";
    case "rollup":
      return "Calculator";
    case "formula":
      return "FunctionSquare";
    case "created_time":
    case "last_edited_time":
      return "Clock";
    case "created_by":
      return "UserPlus";
    case "last_edited_by":
      return "Edit3";
    default:
      return "HelpCircle";
  }
}

// Create default empty value for a property type
export function createDefaultValue(type: PropertyType): PropertyValueData {
  switch (type) {
    case "number":
      return { type: "number", value: null };
    case "select":
    case "status":
      return { type, optionId: null };
    case "multi_select":
      return { type: "multi_select", optionIds: [] };
    case "date":
      return { type: "date", value: null };
    case "person":
      return { type: "person", userId: null };
    case "checkbox":
      return { type: "checkbox", value: false };
    case "url":
      return { type: "url", value: "" };
    case "email":
      return { type: "email", value: "" };
    case "phone":
      return { type: "phone", value: "" };
    case "files":
      return { type: "files", files: [] };
    case "relation":
      return { type: "relation", pageIds: [] };
    case "formula":
      return { type: "formula", value: "", resultType: "text" };
    case "rollup":
      return { type: "rollup", value: null, function: "show_original" };
    case "created_time":
    case "last_edited_time":
      return { type, value: new Date().toISOString() };
    case "created_by":
    case "last_edited_by":
      return { type, userId: "" };
    case "text":
    default:
      return { type: "text", value: "" };
  }
}

// Legacy alias for backward compatibility
export function createDefaultPropertyValue(
  column: Pick<Property, "type">
): PropertyValueData {
  return createDefaultValue(column.type);
}

// Format property value for display
export function formatPropertyValue(
  value: PropertyValueData | undefined,
  options?: SelectOption[]
): string {
  if (!value) return "";

  switch (value.type) {
    case "text":
      return value.value;
    case "number":
      return value.value !== null ? String(value.value) : "";
    case "select":
      if (!value.optionId || !options) return "";
      return options.find((opt) => opt.id === value.optionId)?.label ?? "";
    case "multi_select":
      if (!options) return "";
      return value.optionIds
        .map((id) => options.find((opt) => opt.id === id)?.label)
        .filter(Boolean)
        .join(", ");
    case "status":
      if (!value.optionId || !options) return "";
      return options.find((opt) => opt.id === value.optionId)?.label ?? "";
    case "date":
      if (!value.value) return "";
      const date = new Date(value.value);
      return date.toLocaleDateString();
    case "person":
      return value.userId ?? "";
    case "people":
      return value.userIds.join(", ");
    case "checkbox":
      return value.value ? "Yes" : "No";
    case "url":
      return value.value;
    case "email":
      return value.value;
    case "phone":
      return value.value;
    case "files":
      return `${value.files.length} file${value.files.length !== 1 ? "s" : ""}`;
    case "relation":
      return `${value.pageIds.length} linked`;
    case "formula":
      return value.value;
    case "rollup":
      return String(value.value ?? "");
    case "created_time":
    case "last_edited_time":
      return new Date(value.value).toLocaleString();
    case "created_by":
    case "last_edited_by":
      return value.userId;
    default:
      return "";
  }
}

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

// Generate a random color for select options
export function getRandomOptionColor(): SelectOptionColor {
  const colors: SelectOptionColor[] = [
    "gray",
    "brown",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "red",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create a new select option
export function createSelectOption(
  label: string,
  color?: SelectOptionColor
): SelectOption {
  return {
    id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    label,
    color: color ?? getRandomOptionColor(),
  };
}

// Get CSS background color for option
export function getOptionBgColor(color: SelectOptionColor): string {
  return SELECT_OPTION_COLORS[color] ?? SELECT_OPTION_COLORS.default;
}

// Get CSS text color for option
export function getOptionTextColor(color: SelectOptionColor): string {
  return SELECT_OPTION_TEXT_COLORS[color] ?? SELECT_OPTION_TEXT_COLORS.default;
}

// Validate property value based on type
export function validatePropertyValue(
  value: unknown,
  type: PropertyType
): boolean {
  if (!value || typeof value !== "object") return false;

  const val = value as Record<string, unknown>;
  if (val.type !== type) return false;

  switch (type) {
    case "text":
      return typeof val.value === "string";
    case "number":
      return val.value === null || typeof val.value === "number";
    case "select":
    case "status":
      return val.optionId === null || typeof val.optionId === "string";
    case "multi_select":
      return (
        Array.isArray(val.optionIds) &&
        val.optionIds.every((id) => typeof id === "string")
      );
    case "date":
      return val.value === null || typeof val.value === "string";
    case "person":
      return val.userId === null || typeof val.userId === "string";
    case "checkbox":
      return typeof val.value === "boolean";
    case "url":
    case "email":
    case "phone":
      return typeof val.value === "string";
    case "files":
      return Array.isArray(val.files);
    case "relation":
      return (
        Array.isArray(val.pageIds) &&
        val.pageIds.every((id) => typeof id === "string")
      );
    default:
      return true;
  }
}

// Check if property type requires options configuration
export function requiresOptions(type: PropertyType): boolean {
  return type === "select" || type === "multi_select" || type === "status";
}

// Check if property type is computed (read-only)
export function isComputedType(type: PropertyType): boolean {
  return [
    "created_time",
    "created_by",
    "last_edited_time",
    "last_edited_by",
    "formula",
    "rollup",
  ].includes(type);
}

// Get input placeholder for property type
export function getPropertyPlaceholder(type: PropertyType): string {
  switch (type) {
    case "text":
      return "Enter text...";
    case "number":
      return "Enter number...";
    case "url":
      return "https://...";
    case "email":
      return "email@example.com";
    case "phone":
      return "+1 (555) 000-0000";
    default:
      return "";
  }
}
