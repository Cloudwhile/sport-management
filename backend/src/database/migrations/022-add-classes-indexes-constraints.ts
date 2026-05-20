import { QueryTypes } from "sequelize";
import type { MigrationFn } from "umzug";
import type { MigrationContext } from "../umzug.js";

const INDEXES = {
  cohort: "classes_cohort_idx",
  graduated: "classes_graduated_idx",
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

  await queryInterface.addIndex("classes", ["cohort"], {
    name: INDEXES.cohort,
  });

  await queryInterface.addIndex("classes", ["graduated"], {
    name: INDEXES.graduated,
  });

  await queryInterface.addConstraint("classes", {
    fields: ["cohort", "class_name"],
    type: "unique",
    name: INDEXES.uniqueClassName,
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { queryInterface } = params.context;

  await queryInterface.removeConstraint("classes", INDEXES.uniqueClassName);
  await queryInterface.removeIndex("classes", INDEXES.graduated);
  await queryInterface.removeIndex("classes", INDEXES.cohort);
};
