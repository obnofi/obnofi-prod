/**
 * Database Query Engine
 * Handles filtering, sorting, grouping, and pagination for database views
 */

import type {
  Page,
  Database,
  DatabaseView,
  ViewQuery,
  ViewSort,
  Filter,
  FilterGroup,
  FilterOperator,
  PropertyValue,
  PropertyType,
  RollupFunction,
} from '@obnofi/types/core';

export interface QueryResult {
  pages: Page[];
  totalCount: number;
  hasMore: boolean;
  groups?: Map<string, Page[]>;
}

export class DatabaseQueryEngine {
  private database: Database;
  private pages: Map<string, Page>;

  constructor(database: Database, pages: Page[]) {
    this.database = database;
    this.pages = new Map(pages.map(p => [p.id, p]));
  }

  /**
   * Execute a complete query pipeline
   */
  async execute(view: DatabaseView, offset = 0, limit = 100): Promise<QueryResult> {
    // 1. Get all pages in database
    let pages = this.getDatabasePages();

    // 2. Apply filters
    pages = this.filterPages(pages, view.query);

    // 3. Apply sorts
    pages = this.sortPages(pages, view.query.sorts);

    // 4. Calculate total before pagination
    const totalCount = pages.length;

    // 5. Group if needed (for board view)
    let groups: Map<string, Page[]> | undefined;
    if (view.query.groupBy) {
      groups = this.groupPages(pages, view.query.groupBy);
    }

    // 6. Paginate
    const paginatedPages = this.paginate(pages, offset, limit);

    return {
      pages: paginatedPages,
      totalCount,
      hasMore: offset + limit < totalCount,
      groups,
    };
  }

  /**
   * Get all pages belonging to this database
   */
  private getDatabasePages(): Page[] {
    return this.database.pageIds
      .map(id => this.pages.get(id))
      .filter((p): p is Page => p !== undefined);
  }

  /**
   * Apply filter groups to pages
   */
  filterPages(pages: Page[], query: ViewQuery): Page[] {
    if (query.filterGroups.length === 0) return pages;

    return pages.filter(page => {
      // All filter groups must pass (AND logic between groups)
      return query.filterGroups.every(group => this.applyFilterGroup(page, group));
    });
  }

  /**
   * Apply a single filter group
   */
  private applyFilterGroup(page: Page, group: FilterGroup): boolean {
    const results = group.filters.map(filter => this.applyFilter(page, filter));
    
    // OR within group, AND between groups
    return group.operator === 'AND' 
      ? results.every(r => r)
      : results.some(r => r);
  }

  /**
   * Apply a single filter to a page
   */
  private applyFilter(page: Page, filter: Filter): boolean {
    const propertyValue = page.propertyValues[filter.propertyId];
    const propertyDef = this.database.properties.find(p => p.id === filter.propertyId);
    
    if (!propertyDef) return false;

    const actualValue = propertyValue?.value ?? null;
    
    return this.evaluateFilter(
      filter.operator,
      actualValue,
      filter.value,
      propertyDef.type
    );
  }

  /**
   * Evaluate a filter operator against values
   */
  private evaluateFilter(
    operator: FilterOperator,
    actualValue: unknown,
    filterValue: unknown,
    propertyType: PropertyType
  ): boolean {
    switch (operator) {
      // Equality
      case 'equals':
        return this.areEqual(actualValue, filterValue);
      case 'does_not_equal':
        return !this.areEqual(actualValue, filterValue);

      // String operations
      case 'contains':
        return this.stringContains(actualValue, filterValue);
      case 'does_not_contain':
        return !this.stringContains(actualValue, filterValue);
      case 'starts_with':
        return this.stringStartsWith(actualValue, filterValue);
      case 'ends_with':
        return this.stringEndsWith(actualValue, filterValue);

      // Empty check
      case 'is_empty':
        return this.isEmpty(actualValue);
      case 'is_not_empty':
        return !this.isEmpty(actualValue);

      // Number comparisons
      case 'greater_than':
        return (actualValue as number) > (filterValue as number);
      case 'less_than':
        return (actualValue as number) < (filterValue as number);
      case 'greater_than_or_equal':
        return (actualValue as number) >= (filterValue as number);
      case 'less_than_or_equal':
        return (actualValue as number) <= (filterValue as number);

      // Date comparisons
      case 'before':
        return this.compareDates(actualValue, filterValue) < 0;
      case 'after':
        return this.compareDates(actualValue, filterValue) > 0;
      case 'on_or_before':
        return this.compareDates(actualValue, filterValue) <= 0;
      case 'on_or_after':
        return this.compareDates(actualValue, filterValue) >= 0;

      // Select/Multi-select
      case 'is':
        return this.areEqual(actualValue, filterValue);
      case 'is_not':
        return !this.areEqual(actualValue, filterValue);
      case 'includes':
        return this.arrayIncludes(actualValue, filterValue);
      case 'does_not_include':
        return !this.arrayIncludes(actualValue, filterValue);

      default:
        return true;
    }
  }

  /**
   * Apply sorts to pages
   */
  sortPages(pages: Page[], sorts: ViewSort[]): Page[] {
    if (sorts.length === 0) {
      // Default sort by created time descending
      sorts = [{ propertyId: 'created_time', direction: 'descending' }];
    }

    return [...pages].sort((a, b) => {
      for (const sort of sorts) {
        const comparison = this.comparePages(a, b, sort);
        if (comparison !== 0) {
          return sort.direction === 'ascending' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Compare two pages by a sort criteria
   */
  private comparePages(a: Page, b: Page, sort: ViewSort): number {
    const propDef = this.database.properties.find(p => p.id === sort.propertyId);
    
    // Handle system properties
    if (sort.propertyId === 'created_time') {
      return a.createdAt - b.createdAt;
    }
    if (sort.propertyId === 'last_edited_time') {
      return a.updatedAt - b.updatedAt;
    }
    if (sort.propertyId === 'title') {
      const titleA = this.getPageTitle(a);
      const titleB = this.getPageTitle(b);
      return titleA.localeCompare(titleB);
    }

    if (!propDef) return 0;

    const valueA = a.propertyValues[sort.propertyId]?.value ?? null;
    const valueB = b.propertyValues[sort.propertyId]?.value ?? null;

    return this.compareValues(valueA, valueB, propDef.type);
  }

  /**
   * Compare two values based on their type
   */
  private compareValues(a: unknown, b: unknown, type: PropertyType): number {
    // Handle nulls
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;

    switch (type) {
      case 'title':
      case 'rich_text':
      case 'url':
      case 'email':
      case 'phone_number':
        return String(a).localeCompare(String(b));

      case 'number':
        return (a as number) - (b as number);

      case 'date':
        return new Date(a as string).getTime() - new Date(b as string).getTime();

      case 'checkbox':
        return (a as boolean) === (b as boolean) ? 0 : a ? -1 : 1;

      case 'select':
        // Sort by option order
        return String(a).localeCompare(String(b));

      case 'multi_select':
        // Sort by count then by first value
        const countA = (a as string[]).length;
        const countB = (b as string[]).length;
        if (countA !== countB) return countA - countB;
        return this.compareValues((a as string[])[0], (b as string[])[0], 'select');

      default:
        return String(a).localeCompare(String(b));
    }
  }

  /**
   * Group pages by a property value (for board view)
   */
  groupPages(pages: Page[], groupByPropertyId: string): Map<string, Page[]> {
    const groups = new Map<string, Page[]>();
    const propertyDef = this.database.properties.find(p => p.id === groupByPropertyId);

    for (const page of pages) {
      const value = page.propertyValues[groupByPropertyId]?.value;
      const key = this.valueToGroupKey(value, propertyDef?.type);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(page);
    }

    return groups;
  }

  /**
   * Paginate results
   */
  paginate(pages: Page[], offset: number, limit: number): Page[] {
    return pages.slice(offset, offset + limit);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private areEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private stringContains(actual: unknown, filterValue: unknown): boolean {
    const str = String(actual ?? '').toLowerCase();
    const search = String(filterValue ?? '').toLowerCase();
    return str.includes(search);
  }

  private stringStartsWith(actual: unknown, filterValue: unknown): boolean {
    const str = String(actual ?? '').toLowerCase();
    const search = String(filterValue ?? '').toLowerCase();
    return str.startsWith(search);
  }

  private stringEndsWith(actual: unknown, filterValue: unknown): boolean {
    const str = String(actual ?? '').toLowerCase();
    const search = String(filterValue ?? '').toLowerCase();
    return str.endsWith(search);
  }

  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private compareDates(actual: unknown, filterValue: unknown): number {
    const dateA = new Date(actual as string).getTime();
    const dateB = new Date(filterValue as string).getTime();
    return dateA - dateB;
  }

  private arrayIncludes(actual: unknown, filterValue: unknown): boolean {
    if (!Array.isArray(actual)) return false;
    return actual.some(item => this.areEqual(item, filterValue));
  }

  private getPageTitle(page: Page): string {
    // Get title from title property
    const titleProp = this.database.properties.find(p => p.type === 'title');
    if (titleProp) {
      return String(page.propertyValues[titleProp.id]?.value ?? 'Untitled');
    }
    return 'Untitled';
  }

  private valueToGroupKey(value: unknown, type?: PropertyType): string {
    if (value === null || value === undefined) return 'Uncategorized';
    
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Uncategorized';
      return String(value[0]);
    }
    
    return String(value);
  }
}

/**
 * Computed Property Engine
 * Handles formula evaluation and rollup calculations
 */
export class ComputedPropertyEngine {
  private pages: Map<string, Page>;
  private databases: Map<string, Database>;

  constructor(pages: Page[], databases: Database[]) {
    this.pages = new Map(pages.map(p => [p.id, p]));
    this.databases = new Map(databases.map(d => [d.id, d]));
  }

  /**
   * Evaluate a formula expression
   */
  evaluateFormula(formula: string, page: Page): unknown {
    try {
      // Create formula context
      const context = this.createFormulaContext(page);
      
      // Simple expression evaluator (in production, use a proper parser)
      const fn = new Function(...Object.keys(context), `return ${formula}`);
      return fn(...Object.values(context));
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return null;
    }
  }

  /**
   * Calculate a rollup value
   */
  calculateRollup(
    page: Page,
    relationPropertyId: string,
    rollupPropertyId: string,
    fn: RollupFunction
  ): unknown {
    // Get related page IDs
    const relatedIds = page.propertyValues[relationPropertyId]?.value as string[] | undefined;
    if (!relatedIds || relatedIds.length === 0) {
      return this.getEmptyRollupValue(fn);
    }

    // Get values from related pages
    const values = relatedIds
      .map(id => this.pages.get(id))
      .filter((p): p is Page => p !== undefined)
      .map(p => p.propertyValues[rollupPropertyId]?.value)
      .filter(v => v !== undefined && v !== null);

    return this.aggregateValues(values, fn);
  }

  /**
   * Create context object for formula evaluation
   */
  private createFormulaContext(page: Page): Record<string, unknown> {
    const context: Record<string, unknown> = {
      // Built-in functions
      now: () => new Date(),
      today: () => new Date().toISOString().split('T')[0],
      
      // Date functions
      dateBetween: (start: string, end: string, unit: string) => {
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const diff = e - s;
        
        switch (unit.toLowerCase()) {
          case 'days': return Math.floor(diff / (1000 * 60 * 60 * 24));
          case 'hours': return Math.floor(diff / (1000 * 60 * 60));
          case 'minutes': return Math.floor(diff / (1000 * 60));
          default: return diff;
        }
      },
      
      dateAdd: (date: string, amount: number, unit: string) => {
        const d = new Date(date);
        switch (unit.toLowerCase()) {
          case 'days': d.setDate(d.getDate() + amount); break;
          case 'months': d.setMonth(d.getMonth() + amount); break;
          case 'years': d.setFullYear(d.getFullYear() + amount); break;
        }
        return d.toISOString();
      },
      
      formatDate: (date: string, format: string) => {
        const d = new Date(date);
        // Simple format implementation
        return d.toLocaleDateString();
      },
      
      // String functions
      concat: (...args: string[]) => args.join(''),
      contains: (str: string, search: string) => str.includes(search),
      empty: (val: unknown) => !val || (Array.isArray(val) && val.length === 0),
      length: (val: string | unknown[]) => val?.length ?? 0,
      replace: (str: string, search: string, replace: string) => 
        str.replace(new RegExp(search, 'g'), replace),
      slice: (str: string, start: number, end?: number) => str.slice(start, end),
      
      // Math functions
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      max: Math.max,
      min: Math.min,
      round: Math.round,
      sqrt: Math.sqrt,
    };

    // Add property accessors
    for (const [propId, propValue] of Object.entries(page.propertyValues)) {
      const cleanName = propId.replace(/[^a-zA-Z0-9_]/g, '_');
      context[`prop_${cleanName}`] = propValue.value;
    }

    return context;
  }

  /**
   * Aggregate values using a rollup function
   */
  private aggregateValues(values: unknown[], fn: RollupFunction): unknown {
    if (values.length === 0) {
      return this.getEmptyRollupValue(fn);
    }

    switch (fn) {
      case 'count':
      case 'count_values':
        return values.length;

      case 'count_unique_values':
        return new Set(values.map(v => JSON.stringify(v))).size;

      case 'empty':
        return values.filter(v => v === null || v === undefined || v === '').length;

      case 'not_empty':
        return values.filter(v => v !== null && v !== undefined && v !== '').length;

      case 'sum':
        return (values as number[]).reduce((a, b) => (a || 0) + (b || 0), 0);

      case 'average': {
        const nums = values.filter(v => typeof v === 'number') as number[];
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      }

      case 'median': {
        const nums = [...(values as number[])].sort((a, b) => a - b);
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }

      case 'min':
        return Math.min(...(values as number[]));

      case 'max':
        return Math.max(...(values as number[]));

      case 'range': {
        const nums = values as number[];
        return Math.max(...nums) - Math.min(...nums);
      }

      case 'earliest_date':
        return new Date(Math.min(...(values as string[]).map(d => new Date(d).getTime()))).toISOString();

      case 'latest_date':
        return new Date(Math.max(...(values as string[]).map(d => new Date(d).getTime()))).toISOString();

      case 'checked':
        return (values as boolean[]).filter(v => v).length;

      case 'unchecked':
        return (values as boolean[]).filter(v => !v).length;

      case 'join':
      case 'concatenate':
        return values.join(', ');

      case 'show_original':
      default:
        return values;
    }
  }

  private getEmptyRollupValue(fn: RollupFunction): unknown {
    switch (fn) {
      case 'count':
      case 'count_values':
      case 'count_unique_values':
      case 'empty':
      case 'not_empty':
      case 'checked':
      case 'unchecked':
        return 0;
      case 'sum':
      case 'average':
      case 'median':
        return 0;
      case 'join':
      case 'concatenate':
        return '';
      default:
        return null;
    }
  }
}
