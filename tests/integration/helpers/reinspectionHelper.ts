import * as Knex from 'knex'
import { Reinspection } from 'street-manager-data'

export async function insertReinspection(knex: Knex, ...reinspections: Reinspection[]): Promise<number[]> {
  return await knex('reinspection').insert(reinspections, 'reinspection_id')
}

export async function deleteReinspection(knex: Knex, ...workRefs: string[]): Promise<void> {
  await knex('reinspection').whereIn('work_reference_number', workRefs).del()
}
