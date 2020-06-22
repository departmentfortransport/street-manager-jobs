import 'reflect-metadata'
import { injectable, inject } from 'inversify'
import TYPES from '../types'
import Logger from '../../common/utils/logger'
import AsyncJobService from '../services/asyncJobService'

@injectable()
export default class GenerateSampleInspectionsService {

  public constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.AsyncJobService) private asyncJobService: AsyncJobService) {}

  public async generateSampleInspections(jobId: number): Promise<void> {
    this.logger.log(`Starting sample inspection generation for job id: ${jobId}`)
    try {
      await this.asyncJobService.markAsInProgress(jobId)
      await this.asyncJobService.markAsComplete(jobId)
      this.logger.log(`Finished sample inspection generation for job id: ${jobId}`)
    } catch (error) {
      this.logger.error(`Something went wrong generating sample inspections for job id: ${jobId}`, error)
      await this.asyncJobService.markAsFailed(jobId)
    }
  }
}
