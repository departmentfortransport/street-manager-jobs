import 'mocha'
import * as Knex from 'knex'
import * as knexPostgis from 'knex-postgis'
import iocContainer from '../../../src/generate-sample-inspections/ioc'
import TYPES from '../../../src/generate-sample-inspections/types'
import GenerateSampleInspectionsJob from '../../../src/generate-sample-inspections/job'

export const knex: Knex = iocContainer.get<Knex>(TYPES.Knex)
export const postgis: knexPostgis.KnexPostgis = iocContainer.get<knexPostgis.KnexPostgis>(TYPES.Postgis)

export const job: GenerateSampleInspectionsJob = iocContainer.get<GenerateSampleInspectionsJob>(TYPES.GenerateSampleInspectionsJob)
