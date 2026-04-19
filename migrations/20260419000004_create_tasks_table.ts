import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    table.uuid('batch_id').references('id').inTable('project_batches').onDelete('SET NULL').nullable()
    table.string('title', 500).notNullable()
    table.text('description').nullable()
    table.string('priority', 20).notNullable().defaultTo('medium')
    table.uuid('assignee_id').references('id').inTable('users').onDelete('SET NULL').nullable()
    table.string('column_id', 50).notNullable().defaultTo('ongoing')
    table.integer('sort_order').notNullable().defaultTo(0)
    table.integer('version_major').notNullable().defaultTo(0)
    table.integer('version_minor').notNullable().defaultTo(1)
    table.integer('version_patch').notNullable().defaultTo(0)
    table.bigInteger('created_at').notNullable()
    table.bigInteger('updated_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tasks')
}
