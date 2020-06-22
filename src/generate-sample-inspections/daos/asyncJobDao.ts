import * as Knex from 'knex'
import { inject, injectable } from 'inversify'
import { AsyncJob } from 'street-manager-data'
import TYPES from '../types'
import { AsyncJobUpdateData } from '../models/AsyncJob'

@injectable()
export default class AsyncJobDao {

  private readonly TABLE: string = 'async_job'
  private readonly COLUMNS: string[] = [
    'async_job.async_job_id',
    'async_job.date_created',
    'async_job.date_completed',
    'async_job.async_job_status_id',
    'async_job.user_id',
    'async_job.organisation_id',
    'async_job.async_job_type'
  ]

  public constructor(@inject(TYPES.Knex) private knex: Knex) {}

  public async getJob(jobId: number): Promise<AsyncJob> {
    return await this.knex(this.TABLE)
      .columns(this.COLUMNS)
      .select()
      .where('async_job_id', jobId)
      .first()
  }

  public async updateJob(jobId: number, updateData: AsyncJobUpdateData): Promise<void> {
    await this.knex(this.TABLE)
      .update(updateData)
      .where('async_job_id', jobId)
  }
}
