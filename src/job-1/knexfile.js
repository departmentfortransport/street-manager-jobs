import { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSL, PGMINPOOLSIZE, PGMAXPOOLSIZE } from './config'

const knexConfig = {
  client: 'pg',
  connection: {
    host: PGHOST,
    port: Number(PGPORT),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: Boolean(PGSSL)
  },
  pool: {
    min: Number(PGMINPOOLSIZE),
    max: Number(PGMAXPOOLSIZE)
  }
}

if (Boolean(PGSSL)) {
  knexConfig.development.connection.ssl = {
    rejectUnauthorized: false
  }
}

module.exports = knexConfig
