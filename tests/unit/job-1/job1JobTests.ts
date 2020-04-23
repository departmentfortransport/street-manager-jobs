import 'mocha'
import { assert } from 'chai'
import { mock, instance, verify } from 'ts-mockito'
import Job1Job from '../../../src/job-1/job'
import Job1Service from '../../../src/job-1/services/job1Service'

describe('Job1Job', () => {

  let job: Job1Job

  let service: Job1Service

  before(() => {
    service = mock(Job1Service)

    job = new Job1Job(instance(service))
  })

  describe('run', () => {
    const JOB_1_ID = 123

    it('should execute some job 1 specific function', async () => {
      await job.run(JOB_1_ID)

      verify(service.someJob1Function(JOB_1_ID)).once()

      assert.isTrue(true)
    })
  })
})
