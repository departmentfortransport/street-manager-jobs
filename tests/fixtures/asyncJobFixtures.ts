import { AsyncJob, RefAsyncJobStatus, AsyncJobTypeEnum } from 'street-manager-data'

export function generateAsyncJob(jobId: number, type: AsyncJobTypeEnum, organisationId = 20, userId = 4): AsyncJob {
  return {
    async_job_id: jobId,
    date_created: new Date(),
    async_job_status_id: RefAsyncJobStatus.queued,
    user_id: userId,
    organisation_id: organisationId,
    async_job_type: type
  }
}
