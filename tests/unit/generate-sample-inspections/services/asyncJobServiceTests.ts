import 'mocha'
import { assert } from 'chai'
import { mock, instance, verify, anything, capture } from 'ts-mockito'
import { RefAsyncJobStatus } from 'street-manager-data'
import AsyncJobService from '../../../../src/generate-sample-inspections/services/asyncJobService'
import AsyncJobDao from '../../../../src/generate-sample-inspections/daos/asyncJobDao'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { AsyncJobUpdateData } from '../../../../src/generate-sample-inspections/models/AsyncJob'

describe('AsyncJobService', () => {

  let service: AsyncJobService

  let dao: AsyncJobDao

  const JOB_ID = 123

  beforeEach(() => {
    dao = mock(AsyncJobDao)

    service = new AsyncJobService(instance(dao))
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

  describe('markAsReady', () => {
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
