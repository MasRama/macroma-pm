import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', function (table) {
    table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('SET NULL').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', function (table) {
    table.dropColumn('workspace_id')
  })
}
