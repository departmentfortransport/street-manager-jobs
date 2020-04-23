import COMMON_TYPES from '../common/types'

const TYPES = {
  ...COMMON_TYPES,

  // Database
  Knex: Symbol.for('Knex'),
  Postgis: Symbol.for('Postgis'),

  // Job
  Job1Job: Symbol.for('Job1Job'),

  // Config
  JOB_1_INT_FIELD: Symbol.for('JOB_1_INT_FIELD'),
  JOB_1_STR_FIELD: Symbol.for('JOB_1_STR_FIELD'),

  // DAOs
  Job1Dao: Symbol.for('Job1Dao'),

  // Services
  Job1Service: Symbol.for('Job1Service')
}

export default TYPES
