module.exports = {
  // App
  GENERATE_SAMPLE_INSPECTIONS_JOB_ID: process.env.GENERATE_SAMPLE_INSPECTIONS_JOB_ID,

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