import 'reflect-metadata'
import { injectable, inject } from 'inversify'
import Logger from '../common/utils/logger'
import TYPES from './types'
import GenerateSampleInspectionsService from './services/generateSampleInspectionsService'
import AsyncJobService from './services/asyncJobService'

@injectable()
export default class GenerateSampleInspectionsJob {

  public constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.GenerateSampleInspectionsService) private service: GenerateSampleInspectionsService,
    @inject(TYPES.AsyncJobService) private asyncJobService: AsyncJobService
  ) {}

  public async run(jobId: number): Promise<void> {
    try {
      await this.asyncJobService.markAsInProgress(jobId)

      await this.service.generateSampleInspections(jobId)

      await this.asyncJobService.markAsComplete(jobId)
    } catch (error) {
      this.logger.error(`Something went wrong generating sample inspections for job id: ${jobId}`, error)
      await this.asyncJobService.markAsFailed(jobId)
      return Promise.reject(error)
    }
  }
}
