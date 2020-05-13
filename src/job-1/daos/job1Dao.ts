import * as Knex from 'knex'
import { inject, injectable } from 'inversify'
import TYPES from '../types'

@injectable()
export default class Job1Dao {

  private TABLE = 'csv_export'
  private COLUMNS: string[] = [
    'csv_export.csv_export_id',
    'csv_export.filename',
    'csv_export.s3_key',
    'csv_export.date_created',
    'csv_export.date_completed',
    'csv_export.csv_export_status_id',
    'csv_export.user_id',
    'csv_export.organisation_reference',
    'csv_export.filters',
    'csv_export.csv_export_type'
  ]

  public constructor(@inject(TYPES.Knex) private knex: Knex) {}

  public async getJob1DataModel(): Promise<any> {
    return await this.knex(this.TABLE)
      .select(this.COLUMNS)
      .first()
  }
}
