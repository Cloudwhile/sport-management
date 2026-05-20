import { QueryTypes } from "sequelize";
import type { MigrationFn } from "umzug";
import type { MigrationContext } from "../umzug.js";
import {
  createIndexIfColumnsExist,
  createUniqueConstraintIfColumnsExist,
  describeTableIfExists,
} from "../migration-helpers.js";

const INDEXES = {
  cohort: "classes_cohort_idx",
  uniqueClassName: "classes_cohort_class_name_unique",
};

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { queryInterface } = params.context;
  const tableDescription = await describeTableIfExists(queryInterface, "classes");

  if (!tableDescription?.cohort || !tableDescription.class_name) {
    return;
  }

  const duplicates = await queryInterface.sequelize.query(
    `
      SELECT cohort, class_name, COUNT(*)::int AS count
      FROM classes
      GROUP BY cohort, class_name
      HAVING COUNT(*) > 1
    `,
    { type: QueryTypes.SELECT },
  );

  if (duplicates.length > 0) {
    throw new Error("classes 表存在重复的 cohort/class_name，无法添加唯一约束");
  }

  await createIndexIfColumnsExist(
    params.context,
    "classes",
    INDEXES.cohort,
    ["cohort"],
  );

  await createUniqueConstraintIfColumnsExist(
    params.context,
    "classes",
    INDEXES.uniqueClassName,
    ["cohort", "class_name"],
  );
};

export const down: MigrationFn<MigrationContext> = async (_params) => {
  // No-op: these names may belong to constraints/indexes created by earlier migrations.
  // Dropping them here would make rollback destructive for existing databases.
};
