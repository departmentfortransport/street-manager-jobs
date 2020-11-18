import * as Knex from 'knex'
import { RefSampleInspectionStatus, SampleInspection } from 'street-manager-data'

export async function getSampleInspections(knex: Knex, targetIds: number[], category: number[]): Promise<SampleInspection[]> {
  return await knex('sample_inspection')
    .whereIn('sample_inspection_target_id', targetIds)
    .whereIn('inspection_category_id', category)
}

export async function getSampleInspectionsByStatus(knex: Knex, targetIds: number[], category: number[], status: RefSampleInspectionStatus[]): Promise<SampleInspection[]> {
  return await knex('sample_inspection')
    .whereIn('sample_inspection_target_id', targetIds)
    .whereIn('inspection_category_id', category)
    .whereIn('sample_inspection_status_id', status)
}

export async function insertSampleInspection(knex: Knex, ...sampleInspection: SampleInspection[]): Promise<number[]> {
  return await knex('sample_inspection')
    .insert(sampleInspection).returning('sample_inspection_id')
}

export async function deleteSampleInspection(knex: Knex, ...sampleInspectionReferenceNumber: string[]): Promise<void> {
  return await knex('sample_inspection')
    .whereIn('sample_inspection_reference_number', sampleInspectionReferenceNumber)
    .del()
}

export async function deleteSampleInspectionByTarget(knex: Knex, ...targetIds: number[]): Promise<void> {
  return await knex('sample_inspection')
    .whereIn('sample_inspection_target_id', targetIds)
    .del()
}
