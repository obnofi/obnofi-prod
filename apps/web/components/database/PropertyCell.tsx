"use client";

import {
  Property,
  PropertyValueData,
  PropertyType,
  SelectOption,
} from "@obnofi/types/database";
import {
  TextCell,
  NumberCell,
  CheckboxCell,
  DateCell,
  SelectCell,
  MultiSelectCell,
  StatusCell,
  UrlCell,
  EmailCell,
  PhoneCell,
  PersonCell,
  ComputedCell,
} from "@/components/database/cells";
import { createDefaultValue } from "@/lib/property-utils";

interface PropertyCellProps {
  property: Property;
  value?: PropertyValueData;
  options?: SelectOption[];
  users?: { id: string; name: string; avatar?: string }[];
  onChange: (value: PropertyValueData) => void;
}

export function PropertyCell({
  property,
  value,
  options = [],
  users = [],
  onChange,
}: PropertyCellProps) {
  // Use default value if none provided
  const currentValue = value ?? createDefaultValue(property.type);

  const handleChange = (newValue: unknown) => {
    onChange({
      type: property.type,
      value: newValue,
    } as PropertyValueData);
  };

  switch (property.type) {
    case "text":
      return (
        <TextCell
          value={(currentValue as { type: "text"; value: string }).value}
          onChange={(v) =>
            onChange({ type: "text", value: v })
          }
        />
      );

    case "number":
      return (
        <NumberCell
          value={
            (currentValue as { type: "number"; value: number | null }).value
          }
          onChange={(v) =>
            onChange({ type: "number", value: v })
          }
        />
      );

    case "checkbox":
      return (
        <CheckboxCell
          value={
            (currentValue as { type: "checkbox"; value: boolean }).value
          }
          onChange={(v) =>
            onChange({ type: "checkbox", value: v })
          }
        />
      );

    case "date": {
      const dateValue = currentValue as {
        type: "date";
        value: string | null;
        endValue?: string | null;
      };
      return (
        <DateCell
          value={dateValue.value}
          endValue={dateValue.endValue}
          onChange={(start, end) =>
            onChange({
              type: "date",
              value: start,
              endValue: end,
            })
          }
        />
      );
    }

    case "select":
      return (
        <SelectCell
          value={
            (currentValue as { type: "select"; optionId: string | null })
              .optionId
          }
          options={options}
          onChange={(v) =>
            onChange({ type: "select", optionId: v })
          }
        />
      );

    case "multi_select":
      return (
        <MultiSelectCell
          value={
            (currentValue as { type: "multi_select"; optionIds: string[] })
              .optionIds
          }
          options={options}
          onChange={(v) =>
            onChange({ type: "multi_select", optionIds: v })
          }
        />
      );

    case "status":
      return (
        <StatusCell
          value={
            (currentValue as { type: "status"; optionId: string | null })
              .optionId
          }
          options={options}
          onChange={(v) =>
            onChange({ type: "status", optionId: v })
          }
        />
      );

    case "url":
      return (
        <UrlCell
          value={(currentValue as { type: "url"; value: string }).value}
          onChange={(v) =>
            onChange({ type: "url", value: v })
          }
        />
      );

    case "email":
      return (
        <EmailCell
          value={(currentValue as { type: "email"; value: string }).value}
          onChange={(v) =>
            onChange({ type: "email", value: v })
          }
        />
      );

    case "phone":
      return (
        <PhoneCell
          value={(currentValue as { type: "phone"; value: string }).value}
          onChange={(v) =>
            onChange({ type: "phone", value: v })
          }
        />
      );

    case "person":
      return (
        <PersonCell
          value={
            (currentValue as { type: "person"; userId: string | null }).userId
          }
          users={users}
          onChange={(v) =>
            onChange({ type: "person", userId: v })
          }
        />
      );

    // Computed/read-only types
    case "formula":
    case "rollup":
    case "created_time":
    case "created_by":
    case "last_edited_time":
    case "last_edited_by":
      return <ComputedCell value={currentValue} options={options} />;

    // Advanced types (P1+)
    case "relation":
    case "files":
      return (
        <div className="px-2 py-1.5 text-sm text-zinc-400">
          {property.type} (coming soon)
        </div>
      );

    default:
      return (
        <div className="px-2 py-1.5 text-sm text-zinc-400">
          Unsupported type
        </div>
      );
  }
}
