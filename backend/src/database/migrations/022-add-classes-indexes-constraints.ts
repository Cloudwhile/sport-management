import { QueryTypes } from "sequelize";
import type { MigrationFn } from "umzug";
import type { MigrationContext } from "../umzug.js";

const INDEXES = {
  cohort: "classes_cohort_idx",
  uniqueClassName: "classes_cohort_class_name_unique",
};

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { queryInterface } = params.context;

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

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS ${INDEXES.cohort} ON classes (cohort)
  `);

  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '${INDEXES.uniqueClassName}'
          AND conrelid = 'classes'::regclass
      ) THEN
        ALTER TABLE classes
          ADD CONSTRAINT ${INDEXES.uniqueClassName}
          UNIQUE (cohort, class_name);
      END IF;
    END $$;
  `);
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { queryInterface } = params.context;

  await queryInterface.sequelize.query(
    `ALTER TABLE classes DROP CONSTRAINT IF EXISTS ${INDEXES.uniqueClassName}`,
  );
  await queryInterface.sequelize.query(
    `DROP INDEX IF EXISTS ${INDEXES.cohort}`,
  );
};
