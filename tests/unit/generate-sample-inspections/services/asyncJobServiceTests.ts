import 'mocha'
import { assert } from 'chai'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { mock, instance, verify, anything, capture, when } from 'ts-mockito'
import { RefAsyncJobStatus, AsyncJob, AsyncJobTypeEnum } from 'street-manager-data'
import AsyncJobService from '../../../../src/generate-sample-inspections/services/asyncJobService'
import AsyncJobDao from '../../../../src/generate-sample-inspections/daos/asyncJobDao'
import { AsyncJobUpdateData } from '../../../../src/generate-sample-inspections/models/AsyncJob'
import { generateAsyncJob } from '../../../fixtures/asyncJobFixtures'

describe('AsyncJobService', () => {

  let service: AsyncJobService

  let dao: AsyncJobDao

  const JOB_ID = 123
  const JOB: AsyncJob = generateAsyncJob(JOB_ID, AsyncJobTypeEnum.GENERATE_SAMPLE_INSPECTION)

  beforeEach(() => {
    dao = mock(AsyncJobDao)

    service = new AsyncJobService(instance(dao))
  })

  describe('getJobOrganisation', () => {
    it('should return the organisation ID from the job', async () => {
      when(dao.getJob(JOB_ID)).thenResolve(JOB)

      const organisationID: number = await service.getJobOrganisation(JOB_ID)

      verify(dao.getJob(JOB_ID)).once()

      assert.equal(organisationID, JOB.organisation_id)
    })
  })

  describe('markAsInProgress', () => {
    it('should update the CSV record to in progress', async () => {
      await service.markAsInProgress(JOB_ID)

      verify(dao.updateJob(JOB_ID, anything())).once()

      const csvCaptor: ArgCaptor2<number, AsyncJobUpdateData> = capture<number, AsyncJobUpdateData>(dao.updateJob)
      const [ jobId, updateData ] = csvCaptor.last()

      assert.equal(jobId, JOB_ID)
      assert.equal(updateData.async_job_status_id, RefAsyncJobStatus.in_progress)
    })
  })

  describe('markAsComplete', () => {
    it('should update the CSV record to ready and also set the date completed', async () => {
      await service.markAsComplete(JOB_ID)

      verify(dao.updateJob(JOB_ID, anything())).once()

      const csvCaptor: ArgCaptor2<number, AsyncJobUpdateData> = capture<number, AsyncJobUpdateData>(dao.updateJob)
      const [ jobId, updateData ] = csvCaptor.last()

      assert.equal(jobId, JOB_ID)
      assert.equal(updateData.async_job_status_id, RefAsyncJobStatus.complete)
      assert.isDefined(updateData.date_completed)
    })
  })

  describe('markAsFailed', () => {
    it('should update the CSV record to fauled', async () => {
      await service.markAsFailed(JOB_ID)

      verify(dao.updateJob(JOB_ID, anything())).once()

      const csvCaptor: ArgCaptor2<number, AsyncJobUpdateData> = capture<number, AsyncJobUpdateData>(dao.updateJob)
      const [ jobId, updateData ] = csvCaptor.last()

      assert.equal(jobId, JOB_ID)
      assert.equal(updateData.async_job_status_id, RefAsyncJobStatus.failed)
    })
  })
})
