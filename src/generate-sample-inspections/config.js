module.exports = {
  // App
  GENERATE_SAMPLE_INSPECTIONS_JOB_ID: process.env.GENERATE_SAMPLE_INSPECTIONS_JOB_ID,

  // DB
  PGHOST: process.env.PGHOST,
  PGPORT: process.env.PGPORT,
  PGDATABASE: process.env.PGDATABASE,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGMINPOOLSIZE: process.env.PGMINPOOLSIZE || 5,
  PGSSL: (process.env.PGSSL === true || process.env.PGSSL === 'true') || false,
  PGMAXPOOLSIZE: process.env.PGMAXPOOLSIZE || 10
}