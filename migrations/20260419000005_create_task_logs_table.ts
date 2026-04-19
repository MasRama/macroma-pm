import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('task_logs', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE').notNullable()
    table.string('version', 50).notNullable()
    table.string('column_from', 50).nullable()
    table.string('column_to', 50).notNullable()
    table.text('note').notNullable()
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL').nullable()
    table.bigInteger('created_at').notNullable()
    // NO updated_at — task_logs are immutable (append-only)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('task_logs')
}
