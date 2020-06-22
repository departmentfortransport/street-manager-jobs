import 'mocha'
import { assert } from 'chai'
import { mock, instance, verify } from 'ts-mockito'
import GenerateSampleInspectionsJob from '../../../src/generate-sample-inspections/job'
import GenerateSampleInspectionsService from '../../../src/generate-sample-inspections/services/generateSampleInspectionService'

describe('GenerateSampleInspectionsJob', () => {

  let job: GenerateSampleInspectionsJob

  let service: GenerateSampleInspectionsService

  before(() => {
    service = mock(GenerateSampleInspectionsService)

    job = new GenerateSampleInspectionsJob(instance(service))
  })

  describe('run', () => {
    const JOB_1_ID = 123

    it('should execute some job 1 specific function', async () => {
      await job.run(JOB_1_ID)

      verify(service.generateSampleInspections(JOB_1_ID)).once()

      assert.isTrue(true)
    })
  })
})
