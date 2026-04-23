import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_messages', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE').notNullable()
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    table.text('message').notNullable()
    table.bigInteger('created_at').notNullable()
    table.bigInteger('updated_at').notNullable()

    table.index(['workspace_id', 'created_at'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('workspace_messages')
}
