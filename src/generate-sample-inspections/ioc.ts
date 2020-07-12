import 'reflect-metadata'
import { Container } from 'inversify'
import * as Knex from 'knex'
import * as postgis from 'knex-postgis'
import * as knexConfig from './knexfile'
import TYPES from './types'
import GenerateSampleInspectionsJob from './job'
import AsyncJobDao from './daos/asyncJobDao'
import GenerateSampleInspectionsService from './services/generateSampleInspectionsService'
import Logger from '../common/utils/logger'
import AsyncJobService from './services/asyncJobService'
import SampleInspectionDao from './daos/sampleInspectionDao'

const iocContainer = new Container()

// Database
const knex: Knex = Knex(knexConfig)

iocContainer.bind<Knex>(TYPES.Knex).toConstantValue(knex)
iocContainer.bind<postgis.KnexPostgis>(TYPES.Postgis).toConstantValue(postgis(knex))

// Job
iocContainer.bind<GenerateSampleInspectionsJob>(TYPES.GenerateSampleInspectionsJob).to(GenerateSampleInspectionsJob)

// DAOs
iocContainer.bind<AsyncJobDao>(TYPES.AsyncJobDao).to(AsyncJobDao).inSingletonScope()
iocContainer.bind<SampleInspectionDao>(TYPES.SampleInspectionDao).to(SampleInspectionDao).inSingletonScope()

// Services
iocContainer.bind<GenerateSampleInspectionsService>(TYPES.GenerateSampleInspectionsService).to(GenerateSampleInspectionsService)
iocContainer.bind<AsyncJobService>(TYPES.AsyncJobService).to(AsyncJobService)
iocContainer.bind<Logger>(TYPES.Logger).to(Logger)

export default iocContainer
