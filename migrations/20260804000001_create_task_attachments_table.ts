import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('task_attachments', function (table) {
    table.uuid('id').primary().notNullable();
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE').notNullable();
    table.string('url').notNullable();
    table.string('name').nullable();
    table.string('mime_type').nullable();
    table.integer('size').unsigned().nullable();
    table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL').nullable();
    table.bigInteger('created_at').notNullable();
    table.bigInteger('updated_at').notNullable();
    table.index(['task_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('task_attachments');
}
