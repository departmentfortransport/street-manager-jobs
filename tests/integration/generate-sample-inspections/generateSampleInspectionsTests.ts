import 'mocha'
import { assert } from 'chai'
import { job } from './generateSampleInspectionsSetup'
import { AsyncJob, AsyncJobTypeEnum, RefAsyncJobStatus } from 'street-manager-data'
import { generateAsyncJob } from '../../fixtures/asyncJobFixtures'
import { insertJobs, getJob, deleteJobs } from '../../helpers/asyncJobHelpers'
import { knex } from '../../integration/generate-sample-inspections/generateSampleInspectionsSetup'

describe('Generate Sample Inspections Job', () => {
  const JOB_ID = 123

  before(async () => {
    const asyncJob: AsyncJob = generateAsyncJob(JOB_ID, AsyncJobTypeEnum.GENERATE_SAMPLE_INSPECTION)

    await insertJobs(knex, asyncJob)
  })

  it('should mark job as completed', async () => {
    await job.run(JOB_ID)

    const asyncJob: AsyncJob = await getJob(knex, JOB_ID)
    assert.equal(asyncJob.async_job_status_id, RefAsyncJobStatus.complete)
    assert.isDefined(asyncJob.date_completed)
  })

  after(async () => {
    await deleteJobs(knex, JOB_ID)
  })
})
