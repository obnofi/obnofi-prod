import {
  Column,
  ColumnType,
  Database,
  DatabasePage,
  Page,
  PropertyValue,
  SelectOption,
  View,
} from "@/types";
import { ViewType } from "@/types/database";

interface MockDbStore {
  pages: Map<string, Page>;
  databases: Map<string, Database>;
  views: Map<string, View>;
  columns: Map<string, Column>;
  propertyValues: Map<string, PropertyValue>;
  seeded: boolean;
}

const globalMockDb = globalThis as typeof globalThis & {
  __obnofiMockDbStore?: MockDbStore;
};

function createInitialStore(): MockDbStore {
  return {
    pages: new Map([
      ["page-1", {
        id: "page-1", title: "Getting Started",
        content: { type: "doc", content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome to Obnofi" }] },
          { type: "paragraph", content: [{ type: "text", text: "Link out to [[Child Page]] to see the graph view populate." }] },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Features" }] },
          { type: "bulletList", content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Block-based markdown editor" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Database views (Table, Board, Calendar, Gallery)" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Clearing blocks with infinite whiteboard collaboration" }] }] },
          ]},
        ]},
        type: "document", icon: "📝", parentId: null, workspaceId: "ws-1",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["page-2", {
        id: "page-2", title: "Project Clearing", content: null, type: "canvas", icon: "🎨",
        parentId: null, workspaceId: "ws-1",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["page-3", {
        id: "page-3", title: "Tasks", content: null, type: "database", icon: "📋",
        parentId: null, workspaceId: "ws-1", databaseId: "db-1",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["page-4", {
        id: "page-4", title: "Child Page",
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "This is a child page under Getting Started. Points back to [[Getting Started]]." }] }] },
        type: "document", icon: null, parentId: "page-1", workspaceId: "ws-1",
        createdAt: new Date(Date.now() - 100000).toISOString(),
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      // Database rows
      ["row-1", {
        id: "row-1", title: "Homepage Redesign", content: null, type: "document", icon: null,
        parentId: "page-3", workspaceId: "ws-1", databaseId: "db-1", parentDatabaseId: "db-1",
        createdAt: new Date("2026-04-10").toISOString(), updatedAt: new Date("2026-04-10").toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["row-2", {
        id: "row-2", title: "API Documentation", content: null, type: "document", icon: null,
        parentId: "page-3", workspaceId: "ws-1", databaseId: "db-1", parentDatabaseId: "db-1",
        createdAt: new Date("2026-04-12").toISOString(), updatedAt: new Date("2026-04-12").toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["row-3", {
        id: "row-3", title: "User Research", content: null, type: "document", icon: null,
        parentId: "page-3", workspaceId: "ws-1", databaseId: "db-1", parentDatabaseId: "db-1",
        createdAt: new Date("2026-04-14").toISOString(), updatedAt: new Date("2026-04-14").toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["row-4", {
        id: "row-4", title: "Backend Migration", content: null, type: "document", icon: null,
        parentId: "page-3", workspaceId: "ws-1", databaseId: "db-1", parentDatabaseId: "db-1",
        createdAt: new Date("2026-04-06").toISOString(), updatedAt: new Date("2026-04-06").toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
      ["row-5", {
        id: "row-5", title: "Onboarding Flow", content: null, type: "document", icon: null,
        parentId: "page-3", workspaceId: "ws-1", databaseId: "db-1", parentDatabaseId: "db-1",
        createdAt: new Date("2026-04-05").toISOString(), updatedAt: new Date("2026-04-05").toISOString(),
        isPublic: false, shareId: null, sharePassword: null,
      }],
    ]),

    databases: new Map([
      ["db-1", { id: "db-1", pageId: "page-3", columns: [], properties: [], rows: [], views: [] }],
    ]),

    views: new Map([
      ["view-table", { id: "view-table", databaseId: "db-1", name: "Table", type: "table" as ViewType, config: { visibleProperties: [], propertyWidths: {}, sorts: [], filters: [] }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    ]),

    columns: new Map([
      ["col-status", {
        id: "col-status", databaseId: "db-1", name: "Status", type: "select", order: 0,
        options: [
          { id: "opt-design", label: "Design",  color: "blue"  },
          { id: "opt-todo",   label: "Todo",    color: "gray"  },
          { id: "opt-done",   label: "Done",    color: "green" },
        ],
      }],
      ["col-date", {
        id: "col-date", databaseId: "db-1", name: "Date", type: "date", order: 1,
      }],
      ["col-tags", {
        id: "col-tags", databaseId: "db-1", name: "Tags", type: "multi_select", order: 2,
        options: [
          { id: "tag-eng",     label: "Engineering", color: "blue"   },
          { id: "tag-design",  label: "Design",      color: "purple" },
          { id: "tag-product", label: "Product",     color: "orange" },
        ],
      }],
    ]),

    propertyValues: new Map([
      // row-1: Homepage Redesign — Design / Apr 15 / Design + Engineering
      ["pv-r1-status", { id: "pv-r1-status", pageId: "row-1", columnId: "col-status", propertyId: "col-status", value: { type: "select", optionId: "opt-design" } }],
      ["pv-r1-date",   { id: "pv-r1-date",   pageId: "row-1", columnId: "col-date",   propertyId: "col-date",   value: { type: "date", value: "2026-04-15", endValue: null } }],
      ["pv-r1-tags",   { id: "pv-r1-tags",   pageId: "row-1", columnId: "col-tags",   propertyId: "col-tags",   value: { type: "multi_select", optionIds: ["tag-design", "tag-eng"] } }],

      // row-2: API Documentation — Done / Apr 20 / Engineering
      ["pv-r2-status", { id: "pv-r2-status", pageId: "row-2", columnId: "col-status", propertyId: "col-status", value: { type: "select", optionId: "opt-done" } }],
      ["pv-r2-date",   { id: "pv-r2-date",   pageId: "row-2", columnId: "col-date",   propertyId: "col-date",   value: { type: "date", value: "2026-04-20", endValue: null } }],
      ["pv-r2-tags",   { id: "pv-r2-tags",   pageId: "row-2", columnId: "col-tags",   propertyId: "col-tags",   value: { type: "multi_select", optionIds: ["tag-eng"] } }],

      // row-3: User Research — Todo / Apr 25 / Design + Product
      ["pv-r3-status", { id: "pv-r3-status", pageId: "row-3", columnId: "col-status", propertyId: "col-status", value: { type: "select", optionId: "opt-todo" } }],
      ["pv-r3-date",   { id: "pv-r3-date",   pageId: "row-3", columnId: "col-date",   propertyId: "col-date",   value: { type: "date", value: "2026-04-25", endValue: null } }],
      ["pv-r3-tags",   { id: "pv-r3-tags",   pageId: "row-3", columnId: "col-tags",   propertyId: "col-tags",   value: { type: "multi_select", optionIds: ["tag-design", "tag-product"] } }],

      // row-4: Backend Migration — Done / Apr 18 / Engineering + Product
      ["pv-r4-status", { id: "pv-r4-status", pageId: "row-4", columnId: "col-status", propertyId: "col-status", value: { type: "select", optionId: "opt-done" } }],
      ["pv-r4-date",   { id: "pv-r4-date",   pageId: "row-4", columnId: "col-date",   propertyId: "col-date",   value: { type: "date", value: "2026-04-18", endValue: null } }],
      ["pv-r4-tags",   { id: "pv-r4-tags",   pageId: "row-4", columnId: "col-tags",   propertyId: "col-tags",   value: { type: "multi_select", optionIds: ["tag-eng", "tag-product"] } }],

      // row-5: Onboarding Flow — Done / Apr 8 / Design + Engineering
      ["pv-r5-status", { id: "pv-r5-status", pageId: "row-5", columnId: "col-status", propertyId: "col-status", value: { type: "select", optionId: "opt-done" } }],
      ["pv-r5-date",   { id: "pv-r5-date",   pageId: "row-5", columnId: "col-date",   propertyId: "col-date",   value: { type: "date", value: "2026-04-08", endValue: null } }],
      ["pv-r5-tags",   { id: "pv-r5-tags",   pageId: "row-5", columnId: "col-tags",   propertyId: "col-tags",   value: { type: "multi_select", optionIds: ["tag-design", "tag-eng"] } }],
    ]),
    seeded: false,
  };
}

const store = globalMockDb.__obnofiMockDbStore ?? createInitialStore();
globalMockDb.__obnofiMockDbStore = store;

const mockPages = store.pages;
const mockDatabases = store.databases;
const mockViews = store.views;
const mockColumns = store.columns;
const mockPropertyValues = store.propertyValues;

function createDefaultColumns(databaseId: string) {
  mockDb.columns.create({
    databaseId,
    name: "Status",
    type: "select",
    options: [
      { id: `opt-${Date.now()}-todo`, label: "To Do", color: "gray" },
      { id: `opt-${Date.now()}-progress`, label: "In Progress", color: "yellow" },
      { id: `opt-${Date.now()}-done`, label: "Done", color: "green" },
    ],
  });

  mockDb.columns.create({
    databaseId,
    name: "Notes",
    type: "text",
  });
}

export const mockDb = {
  pages: {
    get: (id: string): Page | undefined => mockPages.get(id),
    getAll: (): Page[] => Array.from(mockPages.values()),
    getByWorkspace: (workspaceId: string): Page[] => {
      return Array.from(mockPages.values()).filter(
        (p) => p.workspaceId === workspaceId && !p.parentDatabaseId
      );
    },
    create: (data: Omit<Page, "id" | "createdAt" | "updatedAt">): Page => {
      const id = `page-${Date.now()}`;
      const now = new Date().toISOString();
      const page: Page = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      mockPages.set(id, page);
      return page;
    },
    update: (id: string, data: Partial<Page>): Page | undefined => {
      const page = mockPages.get(id);
      if (!page) return undefined;
      const updated = { ...page, ...data, updatedAt: new Date().toISOString() };
      mockPages.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => {
      const children = Array.from(mockPages.values()).filter(
        (p) => p.parentId === id
      );
      children.forEach((child) => mockDb.pages.delete(child.id));
      const propertyValues = mockDb.propertyValues.getByPage(id);
      propertyValues.forEach((propertyValue) =>
        mockDb.propertyValues.delete(propertyValue.id)
      );
      return mockPages.delete(id);
    },
    getByShareId: (shareId: string): Page | undefined => {
      return Array.from(mockPages.values()).find((p) => p.shareId === shareId);
    },
    getByDatabase: (databaseId: string): Page[] => {
      return Array.from(mockPages.values()).filter(
        (p) => p.parentDatabaseId === databaseId
      );
    },
    getDatabasePage: (pageId: string): DatabasePage | undefined => {
      const page = mockPages.get(pageId);
      if (!page || page.type !== "database") {
        return undefined;
      }

      const database = mockDb.databases.getByPageId(pageId);
      if (!database) {
        return undefined;
      }

      return {
        ...page,
        database,
      };
    },
    getAncestors: (pageId: string): Array<{ id: string; title: string; icon?: string | null }> => {
      const ancestors: Array<{ id: string; title: string; icon?: string | null }> = [];
      const visited = new Set<string>();
      let currentId: string | null = pageId;

      while (currentId) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const page = mockPages.get(currentId);
        if (!page) break;

        if (page.parentId) {
          const parent = mockPages.get(page.parentId);
          if (parent) {
            ancestors.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
            currentId = parent.id;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      return ancestors;
    },
  },

  databases: {
    get: (id: string): Database | undefined => {
      const db = mockDatabases.get(id);
      if (!db) return undefined;
      
      const columns = Array.from(mockColumns.values())
        .filter((c) => c.databaseId === id)
        .sort((a, b) => a.order - b.order);
      
      const rows = mockDb.pages.getByDatabase(id);
      const views = mockDb.views.getByDatabase(id);
      
      return {
        ...db,
        columns,
        properties: columns,
        rows: rows.map((row) => ({
          ...row,
          propertyValues: mockDb.propertyValues.getByPage(row.id),
        })),
        views,
      };
    },
    getByPageId: (pageId: string): Database | undefined => {
      const db = Array.from(mockDatabases.values()).find((d) => d.pageId === pageId);
      if (!db) return undefined;
      return mockDb.databases.get(db.id);
    },
    create: (pageId: string): Database => {
      const id = `db-${Date.now()}`;
      const database: Database = {
        id,
        pageId,
        columns: [],
        properties: [],
        rows: [],
      };
      mockDatabases.set(id, database);
      mockDb.views.create({
        databaseId: id,
        name: "Table",
        type: "table" as ViewType,
      });
      const page = mockDb.pages.get(pageId);
      if (page) {
        mockDb.pages.update(pageId, {
          databaseId: id,
        });
      }
      return database;
    },
    delete: (id: string): boolean => {
      mockDb.columns.getByDatabase(id).forEach((column) => {
        mockDb.columns.delete(column.id);
      });
      mockDb.pages.getByDatabase(id).forEach((row) => {
        mockDb.pages.delete(row.id);
      });
      mockDb.views.getByDatabase(id).forEach((view) => {
        mockDb.views.delete(view.id);
      });
      return mockDatabases.delete(id);
    },
  },

  views: {
    get: (id: string): View | undefined => mockViews.get(id),
    getByDatabase: (databaseId: string): View[] => {
      return Array.from(mockViews.values())
        .filter((v) => v.databaseId === databaseId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    create: (data: {
      databaseId: string;
      name: string;
      type: ViewType;
      config?: View["config"];
    }): View => {
      const id = `view-${Date.now()}`;
      const now = new Date().toISOString();
      const view: View = {
        ...data,
        id,
        config: data.config || {
          visibleProperties: [],
          propertyWidths: {},
          sorts: [],
          filters: [],
        },
        createdAt: now,
        updatedAt: now,
      };
      mockViews.set(id, view);
      return view;
    },
    update: (id: string, data: Partial<Omit<View, "id" | "createdAt">>): View | undefined => {
      const view = mockViews.get(id);
      if (!view) return undefined;
      const updated = { ...view, ...data, updatedAt: new Date().toISOString() };
      mockViews.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => {
      return mockViews.delete(id);
    },
  },

  columns: {
    get: (id: string): Column | undefined => mockColumns.get(id),
    getByDatabase: (databaseId: string): Column[] => {
      return Array.from(mockColumns.values())
        .filter((c) => c.databaseId === databaseId)
        .sort((a, b) => a.order - b.order);
    },
    create: (data: {
      databaseId: string;
      name: string;
      type: ColumnType;
      options?: SelectOption[];
    }): Column => {
      const id = `col-${Date.now()}`;
      const existingColumns = mockDb.columns.getByDatabase(data.databaseId);
      const column: Column = {
        ...data,
        id,
        order: existingColumns.length,
      };
      mockColumns.set(id, column);
      return column;
    },
    update: (id: string, data: Partial<Column>): Column | undefined => {
      const column = mockColumns.get(id);
      if (!column) return undefined;
      const updated = { ...column, ...data };
      mockColumns.set(id, updated);
      return updated;
    },
    delete: (id: string): boolean => {
      const propertyValues = mockDb.propertyValues.getByColumn(id);
      propertyValues.forEach((propertyValue) =>
        mockDb.propertyValues.delete(propertyValue.id)
      );
      return mockColumns.delete(id);
    },
  },

  propertyValues: {
    get: (id: string): PropertyValue | undefined => mockPropertyValues.get(id),
    getByPage: (pageId: string): PropertyValue[] => {
      return Array.from(mockPropertyValues.values()).filter(
        (pv) => pv.pageId === pageId
      );
    },
    getByColumn: (columnId: string): PropertyValue[] => {
      return Array.from(mockPropertyValues.values()).filter(
        (pv) => pv.columnId === columnId
      );
    },
    getByPageAndColumn: (pageId: string, columnId: string): PropertyValue | undefined => {
      return Array.from(mockPropertyValues.values()).find(
        (pv) => pv.pageId === pageId && pv.columnId === columnId
      );
    },
    create: (data: {
      pageId: string;
      columnId: string;
      value: PropertyValue["value"];
    }): PropertyValue => {
      const id = `pv-${Date.now()}`;
      const propertyValue: PropertyValue = {
        ...data,
        propertyId: data.columnId,
        id,
      };
      mockPropertyValues.set(id, propertyValue);
      return propertyValue;
    },
    update: (id: string, data: { value: PropertyValue["value"] }): PropertyValue | undefined => {
      const pv = mockPropertyValues.get(id);
      if (!pv) return undefined;
      const updated = { ...pv, ...data };
      mockPropertyValues.set(id, updated);
      return updated;
    },
    upsert: (pageId: string, propertyId: string, value: PropertyValue["value"]): PropertyValue => {
      const existing = mockDb.propertyValues.getByPageAndColumn(pageId, propertyId);
      if (existing) {
        return mockDb.propertyValues.update(existing.id, { value })!;
      }
      return mockDb.propertyValues.create({ pageId, columnId: propertyId, value });
    },
    delete: (id: string): boolean => {
      return mockPropertyValues.delete(id);
    },
  },
};

if (!store.seeded) {
  const seededDatabase = mockDb.databases.get("db-1");
  if (seededDatabase && seededDatabase.columns.length === 0) {
    createDefaultColumns(seededDatabase.id);
  }
  store.seeded = true;
}
