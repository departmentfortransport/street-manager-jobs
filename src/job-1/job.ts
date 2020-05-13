import 'reflect-metadata'
import { injectable, inject } from 'inversify'
import TYPES from './types'
import Job1Service from './services/job1Service'

@injectable()
export default class Job1Job {

  public constructor(@inject(TYPES.Job1Service) private service: Job1Service) {}

  public async run(job1Id: number): Promise<void> {
    await this.service.someJob1Function(job1Id)
  }
}
