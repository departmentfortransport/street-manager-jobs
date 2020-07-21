import 'reflect-metadata'
import * as Knex from 'knex'
import { injectable, inject } from 'inversify'
import TYPES from '../types'
import Logger from '../../common/utils/logger'
import { TransactionService } from '../../common/services/transactionService'
import SampleInspectionDao from '../daos/sampleInspectionDao'
import AsyncJobService from './asyncJobService'

@injectable()
export default class GenerateSampleInspectionsService extends TransactionService {

  public constructor(
    @inject(TYPES.Knex) knex: Knex,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.AsyncJobService) private asyncJobService: AsyncJobService,
    @inject(TYPES.SampleInspectionDao) private sampleInspectionDao: SampleInspectionDao
  ) {
    super(knex)
  }

  public async generateSampleInspections(jobId: number): Promise<void> {
    this.logger.log(`Starting sample inspection generation for job id: ${jobId}`)

    const trx: Knex.Transaction = await super.startTransaction()

    try {
      const organisationId: number = await this.asyncJobService.getJobOrganisation(jobId)

      await this.sampleInspectionDao.createNumberToGenerateTempTable(trx, organisationId)

      const [categoryA, categoryB, categoryC] = await Promise.all([
        this.sampleInspectionDao.generateCategoryASampleInspections(trx, organisationId),
        this.sampleInspectionDao.generateCategoryBSampleInspections(trx, organisationId),
        this.sampleInspectionDao.generateCategoryCSampleInspections(trx, organisationId)
      ])

      await this.sampleInspectionDao.insert(trx, categoryA.concat(categoryB, categoryC))

      await super.finishTransaction(trx)

      this.logger.log(`Finished sample inspection generation for job id: ${jobId}`)
    } catch (error) {
      await super.rollbackTransaction(trx, error)
      return Promise.reject(error)
    }
  }
}
