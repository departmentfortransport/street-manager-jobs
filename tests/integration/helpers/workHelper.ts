import * as Knex from 'knex'
import { KnexPostgis } from 'knex-postgis'
import { Work, RefWorkStatus } from 'street-manager-data'
import { generateWork } from '../../fixtures/workFixtures'
import { haOrganisationId, smokePlannerOrganisationId } from '../generate-sample-inspections/setup'

export async function insertWork(knex: Knex, postgis: KnexPostgis, ...works: Work[]): Promise<number[]> {
  works.forEach(work => {
    const geomData = { works_coordinates: postgis.geomFromGeoJSON(work.works_coordinates) }
    Object.assign(work, geomData)
  })

  return await knex('work').insert(works).returning('work_id')
}

export async function deleteWork(knex: Knex, ...workIds: number[]): Promise<void> {
  return await knex('work').whereIn('work_id', workIds).del()
}

export function generateIntegrationTestWork(workRefNumber: string, workStatus?: RefWorkStatus, plannerOrgId = smokePlannerOrganisationId, haOrgId = haOrganisationId): Work {
  return generateWork(plannerOrgId, haOrgId, workRefNumber, workStatus)
}
