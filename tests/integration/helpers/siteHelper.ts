import { Site } from 'street-manager-data'
import * as Knex from 'knex'

export async function insertSite(knex: Knex, ...sites: Site[]): Promise<number[]> {
  return await knex('site').insert(sites, 'site_id')
}

export async function deleteSite(knex: Knex, ...siteIds: number[]): Promise<void> {
  return await knex('site').whereIn('site_id', siteIds).del()
}
