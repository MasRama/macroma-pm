import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_invitations', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE').notNullable()
    table.uuid('inviter_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    table.string('invitee_email', 255).notNullable()
    table.string('token', 64).notNullable().unique()
    table.string('status', 20).notNullable().defaultTo('pending')
    table.bigInteger('expires_at').notNullable()
    table.bigInteger('created_at').notNullable()
    table.bigInteger('updated_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('workspace_invitations')
}
