import 'mocha'
import { mock, instance, verify, when } from 'ts-mockito'
import GenerateSampleInspectionsService from '../../../../src/generate-sample-inspections/services/generateSampleInspectionService'
import Logger from '../../../../src/common/utils/logger'
import AsyncJobService from '../../../../src/generate-sample-inspections/services/asyncJobService'

describe('GenerateSampleInspectionsService', () => {

  let service: GenerateSampleInspectionsService

  let logger: Logger
  let asyncJobService: AsyncJobService

  beforeEach(() => {
    logger = mock(Logger)
    asyncJobService = mock(AsyncJobService)

    service = new GenerateSampleInspectionsService(
      instance(logger),
      instance(asyncJobService)
    )
  })

  describe('generateSampleInspections', () => {
    const JOB_1_ID = 123

    it('should update the job status and log progress', async () => {
      await service.generateSampleInspections(JOB_1_ID)

      verify(logger.log('Starting sample inspection generation for job id: 123')).once()

      verify(asyncJobService.markAsInProgress(JOB_1_ID)).called()
      verify(asyncJobService.markAsComplete(JOB_1_ID)).called()

      verify(logger.log('Finished sample inspection generation for job id: 123')).once()
    })

    it('should update the job to failed if an error occurrs', async () => {
      const error: Error = new Error()
      when(asyncJobService.markAsInProgress(JOB_1_ID)).thenThrow(error)

      try {
        await service.generateSampleInspections(JOB_1_ID)
      } catch (error) {
        verify(asyncJobService.markAsFailed(JOB_1_ID)).called()
        verify(logger.error('Something went wrong generating sample inspections for job id: 123', error)).once()
      }
    })
  })
})
