import 'reflect-metadata'
import * as Knex from 'knex'
import { JOB_1_ID } from './config'
import iocContainer from './ioc'
import TYPES from './types'
import Job1Job from './job'

const job1Id: number = Number(JOB_1_ID)

process.on('SIGTERM', async () => await destroyKnex())

run()

async function run(): Promise<void> {
  try {
    await iocContainer.get<Job1Job>(TYPES.Job1Job).run(job1Id)
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
