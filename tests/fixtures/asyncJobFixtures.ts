import { AsyncJob, RefAsyncJobStatus, AsyncJobTypeEnum } from 'street-manager-data'

export function generateAsyncJob(jobId: number, type: AsyncJobTypeEnum, userId = 4, organisationId = 20): AsyncJob {
  return {
    async_job_id: jobId,
    date_created: new Date(),
    async_job_status_id: RefAsyncJobStatus.queued,
    user_id: userId,
    organisation_id: organisationId,
    async_job_type: type
  }
}
