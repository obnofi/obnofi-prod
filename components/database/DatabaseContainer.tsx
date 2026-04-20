"use client";

import { Property, Page } from "@/types";
import { DatabaseViewRenderer } from "@/components/database/DatabaseViewRenderer";
import { DatabaseViewTabs } from "@/components/database/DatabaseViewTabs";

interface DatabaseContainerProps {
  properties: Property[];
  rows: Page[];
}

export function DatabaseContainer({ properties, rows }: DatabaseContainerProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-background)]">
      <DatabaseViewTabs />
      <div className="flex-1 overflow-auto p-6">
        <DatabaseViewRenderer properties={properties} rows={rows} />
      </div>
    </div>
  );
}
