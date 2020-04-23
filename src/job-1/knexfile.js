import { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSL, PGMINPOOLSIZE, PGMAXPOOLSIZE } from './config'

export default {
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