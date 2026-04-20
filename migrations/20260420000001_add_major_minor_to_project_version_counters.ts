import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('project_version_counters', function (table) {
    table.integer('major').notNullable().defaultTo(0).after('patch_counter');
    table.integer('minor').notNullable().defaultTo(0).after('major');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('project_version_counters', function (table) {
    table.dropColumn('major');
    table.dropColumn('minor');
  });
}
