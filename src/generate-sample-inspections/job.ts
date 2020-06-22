import 'reflect-metadata'
import { injectable, inject } from 'inversify'
import TYPES from './types'
import GenerateSampleInspectionsService from './services/generateSampleInspectionService'

@injectable()
export default class GenerateSampleInspectionsJob {

  public constructor(@inject(TYPES.GenerateSampleInspectionsService) private service: GenerateSampleInspectionsService) {}

  public async run(jobId: number): Promise<void> {
    await this.service.generateSampleInspections(jobId)
  }
}
