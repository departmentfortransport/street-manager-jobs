import * as Knex from 'knex'
import { Organisation } from 'street-manager-data'

export async function getOrganisationByOrganisationReference(knex: Knex, organisationReference: string): Promise<Organisation> {
  return await knex('organisation').where('org_ref', organisationReference).first()
}
