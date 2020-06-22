import { RefAsyncJobStatus } from 'street-manager-data'

export interface AsyncJobUpdateData {
  async_job_status_id?: RefAsyncJobStatus
  date_completed?: Date
}
