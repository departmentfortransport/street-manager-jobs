import COMMON_TYPES from '../common/types'

const TYPES = {
  ...COMMON_TYPES,

  // Database
  Knex: Symbol.for('Knex'),
  Postgis: Symbol.for('Postgis'),

  // Job
  GenerateSampleInspectionsJob: Symbol.for('GenerateSampleInspectionsJob'),

  // DAOs
  AsyncJobDao: Symbol.for('AsyncJobDao'),

  // Services
  GenerateSampleInspectionsService: Symbol.for('GenerateSampleInspectionsService'),
  AsyncJobService: Symbol.for('AsyncJobService')
}

export default TYPES
