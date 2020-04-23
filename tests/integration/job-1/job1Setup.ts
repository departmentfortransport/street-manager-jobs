import 'mocha'
import * as Knex from 'knex'
import * as knexPostgis from 'knex-postgis'
import iocContainer from '../../../src/job-1/ioc'
import TYPES from '../../../src/job-1/types'
import Job1Job from '../../../src/job-1/job'

export const knex: Knex = iocContainer.get<Knex>(TYPES.Knex)
export const postgis: knexPostgis.KnexPostgis = iocContainer.get<knexPostgis.KnexPostgis>(TYPES.Postgis)

export const job: Job1Job = iocContainer.get<Job1Job>(TYPES.Job1Job)
