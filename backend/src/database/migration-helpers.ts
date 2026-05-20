import {
  QueryTypes,
} from 'sequelize';
import type {
  ModelAttributeColumnOptions,
  ModelAttributes,
  QueryInterface,
  QueryInterfaceCreateTableOptions,
  QueryInterfaceOptions,
  TableName,
} from 'sequelize';
import type { MigrationContext } from './umzug.js';

const getTableName = (tableName: TableName) =>
  typeof tableName === 'string' ? tableName : tableName.tableName;

const quoteIdentifier = (identifier: string) =>
  `"${identifier.replace(/"/g, '""')}"`;

const quoteTable = (tableName: TableName) => {
  if (typeof tableName === 'string') {
    return tableName.split('.').map(quoteIdentifier).join('.');
  }

  const quotedName = quoteIdentifier(tableName.tableName);
  return tableName.schema
    ? `${quoteIdentifier(tableName.schema)}.${quotedName}`
    : quotedName;
};

export const tableExists = async (
  queryInterface: QueryInterface,
  tableName: TableName,
) => queryInterface.tableExists(tableName);

export const describeTableIfExists = async (
  queryInterface: QueryInterface,
  tableName: TableName,
) => {
  if (!(await tableExists(queryInterface, tableName))) {
    return null;
  }

  return queryInterface.describeTable(tableName);
};

export const columnExists = async (
  queryInterface: QueryInterface,
  tableName: TableName,
  columnName: string,
) => {
  const tableDescription = await describeTableIfExists(queryInterface, tableName);
  return Boolean(tableDescription?.[columnName]);
};

export const createTableIfMissing = async (
  queryInterface: QueryInterface,
  tableName: TableName,
  attributes: ModelAttributes,
  options?: QueryInterfaceCreateTableOptions,
) => {
  if (await tableExists(queryInterface, tableName)) {
    return false;
  }

  await queryInterface.createTable(tableName, attributes, options);
  return true;
};

export const dropTableIfExists = async (
  queryInterface: QueryInterface,
  tableName: TableName,
  options?: QueryInterfaceOptions,
) => {
  if (!(await tableExists(queryInterface, tableName))) {
    return false;
  }

  await queryInterface.dropTable(tableName, options);
  return true;
};

export const addColumnIfMissing = async (
  queryInterface: QueryInterface,
  tableName: TableName,
  columnName: string,
  attribute: ModelAttributeColumnOptions,
  options?: QueryInterfaceOptions,
) => {
  if (!(await tableExists(queryInterface, tableName))) {
    return false;
  }

  if (await columnExists(queryInterface, tableName, columnName)) {
    return false;
  }

  await queryInterface.addColumn(tableName, columnName, attribute, options);
  return true;
};

export const removeColumnIfExists = async (
  queryInterface: QueryInterface,
  tableName: TableName,
  columnName: string,
  options?: QueryInterfaceOptions,
) => {
  if (!(await columnExists(queryInterface, tableName, columnName))) {
    return false;
  }

  await queryInterface.removeColumn(tableName, columnName, options);
  return true;
};

export const createIndexIfColumnsExist = async (
  context: MigrationContext,
  tableName: TableName,
  indexName: string,
  columns: string[],
  unique = false,
) => {
  const tableDescription = await describeTableIfExists(
    context.queryInterface,
    tableName,
  );
  if (!tableDescription) {
    return false;
  }

  const missingColumn = columns.some((column) => !tableDescription[column]);
  if (missingColumn) {
    return false;
  }

  const quotedTableName = quoteTable(tableName);
  const quotedIndexName = quoteIdentifier(indexName);
  const quotedColumns = columns
    .map((column) => quoteIdentifier(column))
    .join(', ');
  const uniqueKeyword = unique ? 'UNIQUE ' : '';

  await context.sequelize.query(
    `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS ${quotedIndexName} ON ${quotedTableName} (${quotedColumns})`,
  );
  return true;
};

export const createUniqueConstraintIfColumnsExist = async (
  context: MigrationContext,
  tableName: TableName,
  constraintName: string,
  columns: string[],
) => {
  const tableDescription = await describeTableIfExists(
    context.queryInterface,
    tableName,
  );
  if (!tableDescription) {
    return false;
  }

  const missingColumn = columns.some((column) => !tableDescription[column]);
  if (missingColumn) {
    return false;
  }

  const rawTableName = getTableName(tableName);
  const quotedTableName = quoteTable(tableName);
  const quotedConstraintName = quoteIdentifier(constraintName);
  const quotedColumns = columns
    .map((column) => quoteIdentifier(column))
    .join(', ');
  const escapedConstraintName = context.sequelize.escape(constraintName);
  const escapedTableName = context.sequelize.escape(rawTableName);

  const existingConstraintRows = await context.sequelize.query(
    `
      SELECT 1
      FROM pg_constraint
      WHERE conname = ${escapedConstraintName}
        AND conrelid = to_regclass(${escapedTableName})
      LIMIT 1
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  if ((existingConstraintRows as unknown[]).length > 0) {
    return true;
  }

  try {
    await context.sequelize.query(
      `
        ALTER TABLE ${quotedTableName}
          ADD CONSTRAINT ${quotedConstraintName}
          UNIQUE (${quotedColumns})
      `,
    );
  } catch (error: any) {
    const errorCode = error?.original?.code ?? error?.parent?.code ?? error?.code;

    // Another process may create the same constraint between the existence check
    // and the ALTER TABLE. Treat duplicate-object as success.
    if (errorCode !== '42710') {
      throw error;
    }
  }

  return true;
};
