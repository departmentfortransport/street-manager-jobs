import 'reflect-metadata'
import { injectable, inject } from 'inversify'
import TYPES from '../types'
import Logger from '../../common/utils/logger'
import Job1Dao from '../daos/job1Dao'

@injectable()
export default class Job1Service {

  public constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.Job1Dao) private dao: Job1Dao,
    @inject(TYPES.JOB_1_INT_FIELD) private JOB_1_INT_FIELD: number,
    @inject(TYPES.JOB_1_STR_FIELD) private JOB_1_STR_FIELD: string) {}

  public async someJob1Function(job1Id: number): Promise<void> {
    this.logger.log(`Jimmys winning matches [${job1Id}]`)

    await this.dao.getJob1DataModel()

    this.logger.log(`Jimmys winning games`)

    this.logger.log(`${this.JOB_1_INT_FIELD}`)
    this.logger.log(this.JOB_1_STR_FIELD)
  }
}
