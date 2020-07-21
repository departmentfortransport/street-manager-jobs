import 'reflect-metadata'
import { injectable, inject } from 'inversify'
import TYPES from '../types'
import AsyncJobDao from '../daos/asyncJobDao'
import { RefAsyncJobStatus } from 'street-manager-data'
import { AsyncJobUpdateData } from '../models/AsyncJob'

@injectable()
export default class AsyncJobService {

  public constructor(
    @inject(TYPES.AsyncJobDao) private dao: AsyncJobDao
  ) {}

  public async getJobOrganisation(jobId: number): Promise<number> {
    const job = await this.dao.getJob(jobId)
    return job.organisation_id
  }

  public async markAsInProgress(jobId: number): Promise<void> {
    const updateData: AsyncJobUpdateData = { async_job_status_id: RefAsyncJobStatus.in_progress }
    await this.dao.updateJob(jobId, updateData)
  }

  public async markAsFailed(jobId: number): Promise<void> {
    const updateData: AsyncJobUpdateData = { async_job_status_id: RefAsyncJobStatus.failed }
    await this.dao.updateJob(jobId, updateData)
  }

  public async markAsComplete(jobId: number): Promise<void> {
    const updateData: AsyncJobUpdateData = {
      async_job_status_id: RefAsyncJobStatus.complete,
      date_completed: new Date()
    }

    await this.dao.updateJob(jobId, updateData)
  }
}
