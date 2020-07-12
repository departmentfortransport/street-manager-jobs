import * as Knex from 'knex'
import { SampleInspectionTarget } from 'street-manager-data'

export async function insertSampleInspectionTarget(knex: Knex, ...sampleInspectionTarget: SampleInspectionTarget[]): Promise<number[]> {
  return await knex('sample_inspection_target')
    .insert(sampleInspectionTarget).returning('sample_inspection_target_id')
}

export async function deleteSampleInspectionTarget(knex: Knex, ...sampleInspectionTargetReference: string[]): Promise<void> {
  return await knex('sample_inspection_target')
    .whereIn('sample_inspection_target_reference_number', sampleInspectionTargetReference)
    .del()
}
