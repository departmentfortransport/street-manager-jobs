import * as Knex from 'knex'
import { KnexPostgis } from 'knex-postgis'
import { Reinstatement } from 'street-manager-data'

export async function insertReinstatement(knex: Knex, postgis: KnexPostgis, ...reinstatements: Reinstatement[]): Promise<number[]> {
  reinstatements.forEach(reinstatement => {
    const geomData = { reinstatement_coordinates: postgis.geomFromGeoJSON(reinstatement.reinstatement_coordinates)}
    Object.assign(reinstatement, geomData)
  })

  return await knex('reinstatement').insert(reinstatements, 'reinstatement_id')
}

export async function deleteReinstatement(knex: Knex, ...reinstatementIds: number[]): Promise<void> {
  await knex('reinstatement').whereIn('reinstatement_id', reinstatementIds).del()
}
