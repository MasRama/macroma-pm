import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_version_counters', function (table) {
    table.uuid('project_id').primary()
      .references('id').inTable('projects').onDelete('CASCADE').notNullable()
    // Global patch counter per project: starts at 0, increments on each task move
    table.integer('patch_counter').notNullable().defaultTo(0)
    table.bigInteger('updated_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_version_counters')
}
