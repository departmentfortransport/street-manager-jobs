import 'mocha'
import { mock, instance, verify, when } from 'ts-mockito'
import GenerateSampleInspectionsJob from '../../../src/generate-sample-inspections/job'
import GenerateSampleInspectionsService from '../../../src/generate-sample-inspections/services/generateSampleInspectionsService'
import AsyncJobService from '../../../src/generate-sample-inspections/services/asyncJobService'
import Logger from '../../../src/common/utils/logger'

describe('GenerateSampleInspectionsJob', () => {

  let job: GenerateSampleInspectionsJob

  let logger: Logger
  let sampleInspectionService: GenerateSampleInspectionsService
  let asyncJobService: AsyncJobService

  const JOB_ID = 123

  before(() => {
    logger = mock(Logger)
    sampleInspectionService = mock(GenerateSampleInspectionsService)
    asyncJobService = mock(asyncJobService)

    job = new GenerateSampleInspectionsJob(
      instance(logger),
      instance(sampleInspectionService),
      instance(asyncJobService)
    )
  })

  describe('run', () => {
    it('should mark the job as in progress', async () => {
      await job.run(JOB_ID)

      verify(asyncJobService.markAsInProgress(JOB_ID)).called()
    })

    it('should execute generate sample inspections', async () => {
      await job.run(JOB_ID)

      verify(sampleInspectionService.generateSampleInspections(JOB_ID)).called()
    })

    it('should mark the job as complete', async () => {
      await job.run(JOB_ID)

      verify(asyncJobService.markAsComplete(JOB_ID)).called()
    })

    it('should mark the job as failed if an error occurs', async () => {
      const error = new Error()
      when(sampleInspectionService.generateSampleInspections(JOB_ID)).thenThrow(error)

      try {
        await job.run(JOB_ID)
      } catch (error) {
        verify(asyncJobService.markAsFailed(JOB_ID)).once()
        verify(logger.error('Something went wrong generating sample inspections for job id: 123', error)).once()
      }
    })
  })
})
