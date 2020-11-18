import * as Knex from 'knex'
import { inject, injectable } from 'inversify'
import { RefInspectionCategory, RefSampleInspectionStatus, SampleInspection } from 'street-manager-data'
import TYPES from '../types'

@injectable()
export default class SampleInspectionDao {

  private readonly SAMPLE_INSPECTION_TABLE = 'sample_inspection'

  private readonly ELIGIBLE_A_WORKS_SELECT = [
    'work.work_id',
    'work.work_reference_number',
    'work.promoter_organisation_id',
    'sample_inspection_to_generate.sample_inspection_target_id',
    'sample_inspection_to_generate.category_a_to_generate',
    'work.work_end_date',
    this.knex.raw('ROW_NUMBER() OVER(PARTITION BY work.promoter_organisation_id) AS row_num')
  ]

  private readonly ELIGIBLE_B_WORKS_SELECT = [
    'work.work_id',
    'work.work_reference_number',
    'work.promoter_organisation_id',
    'sample_inspection_to_generate.sample_inspection_target_id',
    'sample_inspection_to_generate.category_b_to_generate',
    'reinstatement.reinstatement_date',
    this.knex.raw('DENSE_RANK() OVER(PARTITION BY work.promoter_organisation_id ORDER BY work.work_id) AS row_num')
  ]

  private readonly ELIGIBLE_C_WORKS_SELECT = [
    'work.work_id',
    'work.work_reference_number',
    'work.promoter_organisation_id',
    'sample_inspection_to_generate.sample_inspection_target_id',
    'sample_inspection_to_generate.category_c_to_generate',
    'reinstatement.end_date',
    this.knex.raw('DENSE_RANK() OVER(PARTITION BY work.promoter_organisation_id ORDER BY work.work_id) AS row_num')
  ]

  public constructor(@inject(TYPES.Knex) private knex: Knex) {}

  public async insert(trx: Knex.Transaction, sampleInspections: SampleInspection[]): Promise<number[]> {
    return await this.knex(this.SAMPLE_INSPECTION_TABLE).insert(sampleInspections).transacting(trx)
  }

  public async createNumberToGenerateTempTable(trx: Knex.Transaction, organisationId: number): Promise<void> {
    return await this.knex.raw(`CREATE TEMP TABLE sample_inspection_to_generate ON COMMIT DROP AS
      SELECT
        sample_inspection_target.sample_inspection_target_id,
        sample_inspection_target.promoter_organisation_id,
        cap_category_a - (COUNT(sample_inspection.sample_inspection_id) FILTER (WHERE inspection_category_id=${RefInspectionCategory.a} AND sample_inspection_status_id=${RefSampleInspectionStatus.issued})) AS category_a_to_generate,
        cap_category_b - (COUNT(sample_inspection.sample_inspection_id) FILTER (WHERE inspection_category_id=${RefInspectionCategory.b} AND sample_inspection_status_id=${RefSampleInspectionStatus.issued})) AS category_b_to_generate,
        cap_category_c - (COUNT(sample_inspection.sample_inspection_id) FILTER (WHERE inspection_category_id=${RefInspectionCategory.c} AND sample_inspection_status_id=${RefSampleInspectionStatus.issued})) AS category_c_to_generate
      FROM sample_inspection
      RIGHT JOIN sample_inspection_target ON sample_inspection_target.sample_inspection_target_id = sample_inspection.sample_inspection_target_id
      WHERE sample_inspection_target.ha_organisation_id = ${organisationId}
      AND sample_inspection_target.is_active_target = true
      GROUP BY sample_inspection_target.sample_inspection_target_id, sample_inspection_target.promoter_organisation_id;`
    ).transacting(trx)
  }

  public async generateCategoryASampleInspections(trx: Knex.Transaction, organisationId: number): Promise<SampleInspection[]> {
    return await this.knex.select(
          this.knex.raw(`eligible_works.work_reference_number || '-SI-A' AS sample_inspection_reference_number`),
          'eligible_works.sample_inspection_target_id',
          'eligible_works.work_id',
          'eligible_works.promoter_organisation_id',
          'eligible_works.work_end_date AS expiry_date',
          this.knex.raw(`${RefInspectionCategory.a} AS inspection_category_id`),
          this.knex.raw(`${RefSampleInspectionStatus.issued} AS sample_inspection_status_id`)
      )
      .from(this.getCategoryAEligibleWorks(organisationId))
      .whereRaw(`eligible_works.row_num <= eligible_works.category_a_to_generate`)
      .transacting(trx)
  }

  public async generateCategoryBSampleInspections(trx: Knex.Transaction, organisationId: number): Promise<SampleInspection[]> {
    return await this.knex.distinct(
        this.knex.raw(`eligible_works.work_reference_number || '-SI-B' AS sample_inspection_reference_number`),
        'eligible_works.sample_inspection_target_id',
        'eligible_works.work_id',
        'eligible_works.promoter_organisation_id',
        this.knex.raw(`MAX(eligible_works.reinstatement_date) + interval '6 months' AS expiry_date`),
        this.knex.raw(`${RefInspectionCategory.b} AS inspection_category_id`),
        this.knex.raw(`${RefSampleInspectionStatus.issued} AS sample_inspection_status_id`)
      )
      .from(this.getCategoryBEligibleWorks(organisationId))
      .whereRaw(`eligible_works.row_num <= eligible_works.category_b_to_generate`)
      .groupBy('sample_inspection_reference_number', 'sample_inspection_target_id', 'inspection_category_id', 'work_id', 'promoter_organisation_id')
      .transacting(trx)
  }

  public async generateCategoryCSampleInspections(trx: Knex.Transaction, organisationId: number): Promise<SampleInspection[]> {
    return await this.knex.distinct(
        this.knex.raw(`eligible_works.work_reference_number || '-SI-C' AS sample_inspection_reference_number`),
        'eligible_works.sample_inspection_target_id',
        'eligible_works.work_id',
        'eligible_works.promoter_organisation_id',
        this.knex.raw('MAX(eligible_works.end_date) AS expiry_date'),
        this.knex.raw(`${RefInspectionCategory.c} AS inspection_category_id`),
        this.knex.raw(`${RefSampleInspectionStatus.issued} AS sample_inspection_status_id`)
      )
      .from(this.getCategoryCEligibleWorks(organisationId))
      .whereRaw(`eligible_works.row_num <= eligible_works.category_c_to_generate`)
      .groupBy('sample_inspection_reference_number', 'sample_inspection_target_id', 'inspection_category_id', 'work_id', 'promoter_organisation_id')
      .transacting(trx)
  }

  private getCategoryAEligibleWorks(organisationId: number): Knex.QueryBuilder {
    return this.knex.select(this.ELIGIBLE_A_WORKS_SELECT)
      .from('work')
      .innerJoin('sample_inspection_to_generate', 'work.promoter_organisation_id', 'sample_inspection_to_generate.promoter_organisation_id')
      .leftJoin('sample_inspection', { 'sample_inspection.work_id': 'work.work_id', 'sample_inspection.inspection_category_id': 1 })
      .leftJoin('reinspection', 'work.work_id', 'reinspection.work_id')
      .where('work.work_status_id', 2)
      .andWhere('work.ha_organisation_id', organisationId)
      .whereNull('sample_inspection.sample_inspection_id')
      .whereNull('reinspection.reinspection_id')
      .whereNotNull('work.work_end_date')
      .as('eligible_works')
  }

  private getCategoryBEligibleWorks(organisationId: number): Knex.QueryBuilder {
    return this.knex.select(this.ELIGIBLE_B_WORKS_SELECT)
      .from('work')
      .innerJoin('sample_inspection_to_generate', 'work.promoter_organisation_id', 'sample_inspection_to_generate.promoter_organisation_id')
      .innerJoin('site', { 'site.work_id': 'work.work_id', 'site.reinstatement_type_id ': 1 })
      .innerJoin('reinstatement', 'reinstatement.site_id', 'site.site_id')
      .leftJoin('sample_inspection', { 'sample_inspection.work_id': 'work.work_id', 'sample_inspection.inspection_category_id': 2 })
      .leftJoin('reinspection', 'work.work_id', 'reinspection.work_id')
      .whereRaw(`reinstatement.reinstatement_date >= NOW() - INTERVAL '6 MONTHS'`)
      .andWhere('reinstatement.is_active_reinstatement', true)
      .andWhere('work.ha_organisation_id', organisationId)
      .whereNull('sample_inspection.sample_inspection_id')
      .whereNull('reinspection.reinspection_id')
      .as('eligible_works')
  }

  private getCategoryCEligibleWorks(organisationId: number): Knex.QueryBuilder {
    return this.knex.select(this.ELIGIBLE_C_WORKS_SELECT)
      .from('work')
      .innerJoin('sample_inspection_to_generate', 'work.promoter_organisation_id', 'sample_inspection_to_generate.promoter_organisation_id')
      .innerJoin('site', { 'site.work_id': 'work.work_id', 'site.reinstatement_type_id ': 1 })
      .innerJoin('reinstatement', 'reinstatement.site_id', 'site.site_id')
      .leftJoin('sample_inspection', { 'sample_inspection.work_id': 'work.work_id', 'sample_inspection.inspection_category_id': 3 })
      .leftJoin('reinspection', 'work.work_id', 'reinspection.work_id')
      .whereRaw('reinstatement.end_date >= NOW()')
      .whereRaw(`reinstatement.end_date <= NOW() + INTERVAL '3 MONTHS'`)
      .andWhere('reinstatement.is_active_reinstatement', true)
      .andWhere('reinstatement.reinstatement_status_id', 2)
      .andWhere('work.ha_organisation_id', organisationId)
      .whereNull('sample_inspection.sample_inspection_id')
      .whereNull('reinspection.reinspection_id')
      .as('eligible_works')
  }
}
