module.exports = {
  // App
  JOB_1_ID: process.env.JOB_1_ID,
  JOB_1_INT_FIELD: process.env.JOB_1_INT_FIELD,
  JOB_1_STR_FIELD: process.env.JOB_1_STR_FIELD,

  // DB
  PGHOST: process.env.PGHOST || 'localhost',
  PGPORT: process.env.PGPORT || 5432,
  PGDATABASE: process.env.PGDATABASE || 'work',
  PGUSER: process.env.PGUSER || 'app',
  PGPASSWORD: process.env.PGPASSWORD || 'app',
  PGMINPOOLSIZE: process.env.PGMINPOOLSIZE || 5,
  PGSSL: (process.env.PGSSL === true || process.env.PGSSL === 'true') || false,
  PGMAXPOOLSIZE: process.env.PGMAXPOOLSIZE || 10
}