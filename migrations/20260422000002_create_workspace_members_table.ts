import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_members', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE').notNullable()
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    table.string('role', 50).notNullable().defaultTo('member')
    table.bigInteger('created_at').notNullable()
    table.unique(['workspace_id', 'user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('workspace_members')
}
