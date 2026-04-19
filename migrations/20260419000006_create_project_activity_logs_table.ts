import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_activity_logs', function (table) {
    table.uuid('id').primary().notNullable()
    table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()
    table.string('event_type', 100).notNullable()
    // event_type values:
    //   project.created | task.created | task.moved | task.log_added
    //   batch.created   | batch.activated
    table.text('description').notNullable()
    table.uuid('actor_id').references('id').inTable('users').onDelete('SET NULL').nullable()
    table.uuid('task_id').references('id').inTable('tasks').onDelete('SET NULL').nullable()
    table.uuid('batch_id').references('id').inTable('project_batches').onDelete('SET NULL').nullable()
    table.json('meta').nullable()
    table.bigInteger('created_at').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_activity_logs')
}
