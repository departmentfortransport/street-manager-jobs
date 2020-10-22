import 'reflect-metadata'
import * as Knex from 'knex'
import { GENERATE_SAMPLE_INSPECTIONS_JOB_ID } from './config'
import iocContainer from './ioc'
import TYPES from './types'
import GenerateSampleInspectionsJob from './job'

const jobId: number = Number(GENERATE_SAMPLE_INSPECTIONS_JOB_ID)

process.on('SIGTERM', async () => await destroyKnex())

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at: ', promise, `\nReason: ${reason}`)
})

run()

async function run(): Promise<void> {
  try {
    await iocContainer.get<GenerateSampleInspectionsJob>(TYPES.GenerateSampleInspectionsJob).run(jobId)
    await destroyKnex()
  } catch (err) {
    console.error(err)
    await destroyKnex()
    process.exit(1)
  }
}

function destroyKnex(): Promise<void> {
  return iocContainer.get<Knex>(TYPES.Knex).destroy()
}
