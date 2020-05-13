import 'mocha'
import { mock, instance, verify, anything } from 'ts-mockito'
import Job1Service from '../../../../src/job-1/services/job1Service'
import Logger from '../../../../src/common/utils/logger'
import Job1Dao from '../../../../src/job-1/daos/job1Dao'

describe('Job1Service', () => {

  let service: Job1Service

  let logger: Logger
  let dao: Job1Dao

  const JOB_1_INT_FIELD = 456
  const JOB_1_STR_FIELD = 'some string'

  before(() => {
    logger = mock(Logger)
    dao = mock(Job1Dao)

    service = new Job1Service(
      instance(logger),
      instance(dao),
      JOB_1_INT_FIELD,
      JOB_1_STR_FIELD
    )
  })

  describe('someJob1Function', () => {
    const JOB_1_ID = 123

    it('should call the DAO and log some stuff', async () => {
      await service.someJob1Function(JOB_1_ID)

      verify(logger.log(anything())).times(4)

      verify(logger.log('Jimmys winning matches [123]')).once()
      verify(logger.log('Jimmys winning games')).once()
      verify(logger.log('456')).once()
      verify(logger.log(JOB_1_STR_FIELD)).once()
      verify(dao.getJob1DataModel()).called()
    })
  })
})
