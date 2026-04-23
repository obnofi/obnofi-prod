import { Parser } from 'node-sql-parser'
import type { DbSchema, TableDef, ColumnDef, ForeignKeyDef } from '@obnofi/types/db-diagram'

const parser = new Parser()

export interface ParseResult {
  schema: DbSchema
  errors: string[]
}

export function parseMySQLDDL(sql: string): ParseResult {
  const errors: string[] = []
  const tables: TableDef[] = []

  if (!sql.trim()) {
    return { schema: { tables: [] }, errors: [] }
  }

  // Split SQL into individual statements
  const statements = splitStatements(sql)

  for (const stmt of statements) {
    if (!stmt.trim() || !stmt.trim().toUpperCase().startsWith('CREATE TABLE')) {
      continue
    }

    try {
      const ast = parser.astify(stmt, { database: 'mysql' })
      const astArray = Array.isArray(ast) ? ast : [ast]

      for (const singleAst of astArray) {
        if (singleAst?.type === 'create' && singleAst?.keyword === 'table') {
          const table = parseCreateTable(singleAst)
          if (table) {
            tables.push(table)
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error'
      errors.push(`Failed to parse statement: ${errorMsg}`)
      // Continue with other statements
    }
  }

  return { schema: { tables }, errors }
}

function splitStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let depth = 0

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1] || ''

    // Handle string literals
    if (!inString && (char === "'" || char === '"' || char === '`')) {
      inString = true
      stringChar = char
      current += char
      continue
    }

    if (inString) {
      current += char
      // Handle escaped characters
      if (char === '\\' && nextChar === stringChar) {
        current += nextChar
        i++
        continue
      }
      if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      continue
    }

    // Handle nested parentheses
    if (char === '(') {
      depth++
      current += char
      continue
    }

    if (char === ')') {
      depth--
      current += char
      continue
    }

    // Statement separator
    if (char === ';' && depth === 0) {
      if (current.trim()) {
        statements.push(current.trim())
      }
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}

function parseCreateTable(ast: any): TableDef | null {
  if (!ast.table || !ast.create_definitions) {
    return null
  }

  const tableName = extractTableName(ast.table)
  const comment = ast.table?.comment?.value || undefined

  const columns: ColumnDef[] = []
  const foreignKeys: ForeignKeyDef[] = []
  const primaryKeyColumns: string[] = []
  const uniqueColumns: Set<string> = new Set()

  // First pass: collect constraints and column definitions
  for (const def of ast.create_definitions) {
    if (!def) continue

    switch (def.resource) {
      case 'column':
        const col = parseColumnDefinition(def)
        if (col) {
          columns.push(col)
        }
        break

      case 'constraint': {
        const ct = (def.constraint_type ?? '').toLowerCase()
        if (ct === 'primary key' && def.definition) {
          const pkCols = extractConstraintColumns(def.definition)
          primaryKeyColumns.push(...pkCols)
        }
        if (ct.includes('unique') && def.definition) {
          const uniqueCols = extractConstraintColumns(def.definition)
          uniqueCols.forEach(col => uniqueColumns.add(col))
        }
        if (ct === 'foreign key' && def.definition) {
          const fk = parseForeignKey(def)
          if (fk) {
            foreignKeys.push(fk)
          }
        }
        break
      }
    }
  }

  // Second pass: apply constraints to columns
  for (const col of columns) {
    if (primaryKeyColumns.includes(col.name)) {
      col.primaryKey = true
    }
    if (uniqueColumns.has(col.name)) {
      col.unique = true
    }
  }

  return {
    name: tableName,
    columns,
    foreignKeys,
    comment
  }
}

function extractTableName(tableAst: any): string {
  // Handle array format from node-sql-parser
  if (Array.isArray(tableAst)) {
    if (tableAst.length > 0) {
      return extractTableName(tableAst[0])
    }
    return 'unknown'
  }
  
  if (typeof tableAst === 'string') {
    return tableAst
  }
  if (tableAst?.table) {
    return tableAst.table
  }
  if (tableAst?.name) {
    return tableAst.name
  }
  return 'unknown'
}

function parseColumnDefinition(def: any): ColumnDef | null {
  if (!def.column || !def.definition) {
    return null
  }

  const name = typeof def.column === 'string' ? def.column : def.column.column || def.column.name
  const dataType = parseDataType(def.definition)
  
  let nullable = true
  let autoIncrement = false
  let defaultValue: string | undefined
  let comment: string | undefined
  let unique = false
  let primaryKey = false

  // Check for auto_increment at top level
  if (def.auto_increment === 'auto_increment') {
    autoIncrement = true
  }

  // Check for primary_key at top level
  if (def.primary_key === 'primary key') {
    primaryKey = true
  }

  // Check for unique at top level
  if (def.unique === 'unique') {
    unique = true
  }

  // Check for nullable at top level
  if (def.nullable) {
    if (def.nullable.type === 'not null' || def.nullable.value === 'not null') {
      nullable = false
    } else if (def.nullable.type === 'null' || def.nullable.value === 'null') {
      nullable = true
    }
  }

  // Check for default_val at top level
  if (def.default_val) {
    defaultValue = extractDefaultValue(def.default_val.value)
  }

  // Parse column constraints (fallback)
  if (def.definition.constraints) {
    for (const constraint of def.definition.constraints) {
      if (!constraint) continue

      switch (constraint.type) {
        case 'not null':
        case 'not_null':
          nullable = false
          break
        case 'null':
          nullable = true
          break
        case 'auto_increment':
          autoIncrement = true
          break
        case 'unique':
          unique = true
          break
        case 'primary key':
        case 'primary_key':
          primaryKey = true
          break
        case 'default':
          defaultValue = extractDefaultValue(constraint.value)
          break
        case 'comment':
          comment = extractComment(constraint.value)
          break
      }
    }
  }

  return {
    name,
    type: dataType,
    nullable,
    primaryKey,
    unique,
    autoIncrement,
    defaultValue,
    comment
  }
}

function parseDataType(dataType: any): string {
  if (!dataType) return 'UNKNOWN'

  if (typeof dataType === 'string') {
    return dataType.toUpperCase()
  }

  const typeName = dataType.dataType || dataType.type || 'UNKNOWN'
  const length = dataType.length

  if (length !== undefined && length !== null) {
    if (Array.isArray(length)) {
      return `${typeName.toUpperCase()}(${length.join(',')})`
    }
    return `${typeName.toUpperCase()}(${length})`
  }

  return typeName.toUpperCase()
}

function extractDefaultValue(value: any): string | undefined {
  if (!value) return undefined

  if (typeof value === 'string') {
    return value
  }

  if (value.type === 'function') {
    const funcName = value.name?.name?.[0]?.value || value.name?.name || 'UNKNOWN'
    return funcName.toUpperCase()
  }

  if (value.value !== undefined) {
    return String(value.value)
  }

  return String(value)
}

function extractComment(value: any): string | undefined {
  if (!value) return undefined

  if (typeof value === 'string') {
    return value
  }

  if (value.value !== undefined) {
    return String(value.value)
  }

  return String(value)
}

function extractConstraintColumns(definition: any): string[] {
  if (!definition) return []

  if (Array.isArray(definition)) {
    return definition
      .map((col: any) => typeof col === 'string' ? col : col.column || col.name)
      .filter(Boolean)
  }

  if (typeof definition === 'string') {
    return [definition]
  }

  if (definition.column) {
    return [definition.column]
  }

  return []
}

function parseForeignKey(def: any): ForeignKeyDef | null {
  if (!def.definition || !def.reference_definition) {
    return null
  }

  const columns = extractConstraintColumns(def.definition)
  if (columns.length === 0) return null

  const ref = def.reference_definition

  // node-sql-parser returns ref.table as an array: [{ table: 'roles', ... }]
  let refTable: string | undefined
  if (Array.isArray(ref.table)) {
    refTable = ref.table[0]?.table
  } else if (typeof ref.table === 'string') {
    refTable = ref.table
  } else {
    refTable = ref.table?.name || ref.table?.table
  }

  const refColumns = extractConstraintColumns(ref.definition)

  if (!refTable || refColumns.length === 0) return null

  const fk: ForeignKeyDef = {
    columnName: columns[0],
    referencedTable: refTable,
    referencedColumn: refColumns[0]
  }

  // node-sql-parser returns ON DELETE/UPDATE as on_action array:
  // [{ type: 'on delete', value: { type: 'origin', value: 'cascade' } }]
  if (Array.isArray(ref.on_action)) {
    for (const action of ref.on_action) {
      const actionValue = String(action.value?.value ?? action.value ?? '')
      if (action.type === 'on delete') {
        fk.onDelete = normalizeOnAction(actionValue)
      } else if (action.type === 'on update') {
        fk.onUpdate = normalizeOnAction(actionValue)
      }
    }
  } else {
    // Fallback for alternative AST formats
    if (ref.on_delete) fk.onDelete = normalizeOnAction(ref.on_delete)
    if (ref.on_update) fk.onUpdate = normalizeOnAction(ref.on_update)
  }

  return fk
}

function normalizeOnAction(action: string): 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' {
  const normalized = action.toUpperCase().replace(/_/g, ' ')
  
  if (normalized === 'CASCADE') return 'CASCADE'
  if (normalized === 'SET NULL' || normalized === 'SETNULL') return 'SET NULL'
  if (normalized === 'RESTRICT') return 'RESTRICT'
  return 'NO ACTION'
}
