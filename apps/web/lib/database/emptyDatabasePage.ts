import type { DatabasePage, Page } from "@obnofi/types";

export function buildEmptyDatabasePage(
  page: Page,
  databaseId: string
): DatabasePage {
  return {
    ...page,
    database: {
      id: databaseId,
      pageId: page.id,
      properties: [],
      columns: [],
      rows: [],
      views: [
        {
          id: `${databaseId}-table-view`,
          databaseId,
          name: "Table",
          type: "table",
          config: {
            visibleProperties: [],
            propertyWidths: {},
            sorts: [],
            filters: [],
          },
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        },
      ],
    },
  };
}
