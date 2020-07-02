import { AsyncJob } from 'street-manager-data'
import * as Knex from 'knex'

export async function insertJobs(knex: Knex, ...jobs: AsyncJob[]): Promise<number[]> {
  return await knex('async_job').insert(jobs).returning('async_job_id')
}

export async function getJob(knex: Knex, jobId: number): Promise<AsyncJob> {
  return await knex('async_job').select().where('async_job_id', jobId).first()
}

export async function deleteJobs(knex: Knex, ...jobIds: number[]): Promise<void> {
  await knex('async_job').delete().whereIn('async_job_id', jobIds)
}
