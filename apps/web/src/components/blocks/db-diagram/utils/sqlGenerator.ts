import type { DbSchema, TableDef, ColumnDef, ForeignKeyDef } from '@obnofi/types/db-diagram'

export function generateMySQLDDL(schema: DbSchema): string {
  if (!schema.tables || schema.tables.length === 0) {
    return ''
  }

  const statements: string[] = []

  for (const table of schema.tables) {
    const createTable = generateCreateTable(table)
    if (createTable) {
      statements.push(createTable)
    }
  }

  return statements.join('\n\n')
}

function generateCreateTable(table: TableDef): string | null {
  if (!table.name || !table.columns || table.columns.length === 0) {
    return null
  }

  const lines: string[] = []

  // Sort columns: PK first, then others in original order
  const sortedColumns = [...table.columns].sort((a, b) => {
    if (a.primaryKey && !b.primaryKey) return -1
    if (!a.primaryKey && b.primaryKey) return 1
    return 0
  })

  // Column definitions
  for (const col of sortedColumns) {
    lines.push(`  ${generateColumnDefinition(col)}`)
  }

  // Primary key constraint (for composite keys or explicit declaration)
  const pkColumns = table.columns.filter(c => c.primaryKey).map(c => c.name)
  if (pkColumns.length > 1) {
    lines.push(`  PRIMARY KEY (${pkColumns.join(', ')})`)
  } else if (pkColumns.length === 1) {
    // Single PK is already defined inline, but add explicit constraint for clarity
    const col = table.columns.find(c => c.primaryKey)
    if (col && !col.autoIncrement) {
      // Only add explicit if not auto_increment (which implies PK in MySQL)
      lines.push(`  PRIMARY KEY (${pkColumns[0]})`)
    }
  }

  // Unique constraints (for columns not marked inline)
  const uniqueColumns = table.columns.filter(c => c.unique && !c.primaryKey)
  for (const col of uniqueColumns) {
    lines.push(`  UNIQUE KEY (${escapeIdentifier(col.name)})`)
  }

  // Foreign keys
  for (const fk of table.foreignKeys || []) {
    lines.push(`  ${generateForeignKey(fk)}`)
  }

  let sql = `CREATE TABLE ${escapeIdentifier(table.name)} (\n${lines.join(',\n')}\n)`

  // Table comment
  if (table.comment) {
    sql += ` COMMENT='${escapeString(table.comment)}'`
  }

  sql += ';'

  return sql
}

function generateColumnDefinition(col: ColumnDef): string {
  const parts: string[] = [escapeIdentifier(col.name), col.type.toUpperCase()]

  // NULL / NOT NULL
  if (!col.nullable) {
    parts.push('NOT NULL')
  } else {
    parts.push('NULL')
  }

  // AUTO_INCREMENT
  if (col.autoIncrement) {
    parts.push('AUTO_INCREMENT')
  }

  // DEFAULT
  if (col.defaultValue !== undefined) {
    const defaultVal = formatDefaultValue(col.defaultValue, col.type)
    parts.push(`DEFAULT ${defaultVal}`)
  }

  // UNIQUE (inline)
  if (col.unique && !col.primaryKey) {
    parts.push('UNIQUE')
  }

  // COMMENT
  if (col.comment) {
    parts.push(`COMMENT '${escapeString(col.comment)}'`)
  }

  return parts.join(' ')
}

function generateForeignKey(fk: ForeignKeyDef): string {
  const parts: string[] = [
    'FOREIGN KEY',
    `(${escapeIdentifier(fk.columnName)})`,
    'REFERENCES',
    escapeIdentifier(fk.referencedTable),
    `(${escapeIdentifier(fk.referencedColumn)})`
  ]

  if (fk.onDelete) {
    parts.push(`ON DELETE ${fk.onDelete}`)
  }

  if (fk.onUpdate) {
    parts.push(`ON UPDATE ${fk.onUpdate}`)
  }

  return parts.join(' ')
}

function escapeIdentifier(name: string): string {
  // Escape backticks and wrap in backticks
  return `\`${name.replace(/`/g, '``')}\``
}

function escapeString(str: string): string {
  // Escape single quotes and backslashes
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function formatDefaultValue(value: string, dataType: string): string {
  const upperType = dataType.toUpperCase()
  const upperValue = value.toUpperCase()

  // Keywords that shouldn't be quoted
  const keywords = ['NULL', 'TRUE', 'FALSE', 'CURRENT_TIMESTAMP', 'NOW()', 'UUID()']
  
  if (keywords.includes(upperValue)) {
    return upperValue
  }

  // Numeric types
  const numericTypes = ['INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC']
  if (numericTypes.some(t => upperType.startsWith(t))) {
    // Check if it's a valid number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value
    }
  }

  // String types - quote the value
  return `'${escapeString(value)}'`
}
