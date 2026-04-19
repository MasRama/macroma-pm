import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_batches', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    table.integer('major').notNullable().defaultTo(0)
    table.integer('minor').notNullable().defaultTo(1)
    table.string('label', 255).nullable()
    table.boolean('is_active').notNullable().defaultTo(false)
    table.bigInteger('created_at').notNullable()
    table.bigInteger('updated_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_batches')
}
