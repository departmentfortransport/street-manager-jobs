import 'reflect-metadata'
import { Container } from 'inversify'
import * as Knex from 'knex'
import * as postgis from 'knex-postgis'
import knexConfig from './knexfile'
import TYPES from './types'
import { JOB_1_INT_FIELD, JOB_1_STR_FIELD } from './config'
import Job1Job from './job'
import Job1Dao from './daos/job1Dao'
import Job1Service from './services/job1Service'
import Logger from '../common/utils/logger'

const iocContainer = new Container()

// Database
const knex: Knex = Knex(knexConfig)

iocContainer.bind<Knex>(TYPES.Knex).toConstantValue(knex)
iocContainer.bind<postgis.KnexPostgis>(TYPES.Postgis).toConstantValue(postgis(knex))

// Job
iocContainer.bind<Job1Job>(TYPES.Job1Job).to(Job1Job)

// Config
iocContainer.bind<number>(TYPES.JOB_1_INT_FIELD).toConstantValue(Number(JOB_1_INT_FIELD))
iocContainer.bind<string>(TYPES.JOB_1_STR_FIELD).toConstantValue(JOB_1_STR_FIELD)

// DAOs
iocContainer.bind<Job1Dao>(TYPES.Job1Dao).to(Job1Dao).inSingletonScope()

// Services
iocContainer.bind<Job1Service>(TYPES.Job1Service).to(Job1Service)
iocContainer.bind<Logger>(TYPES.Logger).to(Logger)

export default iocContainer
