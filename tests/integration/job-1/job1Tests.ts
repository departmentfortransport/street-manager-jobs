import 'mocha'
import { assert } from 'chai'
import { job } from './job1Setup'

describe('Job 1 Tests', () => {

  const JOB_1_ID = 123

  before(async () => {
    // Setup some test data
  })

  it('should do something with Job 1', async () => {
    await job.run(JOB_1_ID)

    assert.isTrue(true)
  })

  after(async () => {
    // Delete some test data
  })
})
