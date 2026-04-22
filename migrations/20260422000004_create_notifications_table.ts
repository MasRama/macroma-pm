import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    table.string('type', 100).notNullable()
    table.text('data').notNullable()
    table.boolean('is_read').notNullable().defaultTo(false)
    table.bigInteger('created_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications')
}
