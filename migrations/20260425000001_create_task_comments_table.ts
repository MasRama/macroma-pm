import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('task_comments', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE').notNullable()
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL').nullable()
    table.text('content').notNullable()
    table.bigInteger('created_at').notNullable()
    table.bigInteger('updated_at').notNullable()
    table.index(['task_id', 'created_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('task_comments')
}
