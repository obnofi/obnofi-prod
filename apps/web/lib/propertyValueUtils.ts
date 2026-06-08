import { PropertyType, PropertyValueData, SelectOption } from "@obnofi/types/database";

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
      return new Date(value.value).toLocaleDateString();
    case "person":
      return value.userId ?? "";
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
