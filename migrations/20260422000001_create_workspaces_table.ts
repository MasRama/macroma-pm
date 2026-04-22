import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspaces', function (table) {
    table.uuid('id').primary().notNullable()
    table.string('name', 255).notNullable()
    table.text('description').nullable()
    table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    table.bigInteger('created_at').notNullable()
    table.bigInteger('updated_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('workspaces')
}
