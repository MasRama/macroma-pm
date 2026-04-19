import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_members', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
    table.string('role', 50).notNullable().defaultTo('member')
    table.bigInteger('created_at').notNullable()
    table.unique(['project_id', 'user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_members')
}
