import 'mocha'
import * as Knex from 'knex'
import { KnexPostgis } from 'knex-postgis'
import iocContainer from '../../../src/generate-sample-inspections/ioc'
import TYPES from '../../../src/generate-sample-inspections/types'
import GenerateSampleInspectionsJob from '../../../src/generate-sample-inspections/job'
import { getOrganisationByOrganisationReference } from '../helpers/organisationHelper'
import { SMOKE_TEST_PROMOTER_ORG_REF, ROCHDALE_HA_ORF_REF, C2C_PROMOTER_ORG_REF, DORSET_HA_ORF_REF } from '../../fixtures/organisationFixtures'

export const knex: Knex = iocContainer.get<Knex>(TYPES.Knex)
export const postgis: KnexPostgis = iocContainer.get<KnexPostgis>(TYPES.Postgis)

export const job: GenerateSampleInspectionsJob = iocContainer.get<GenerateSampleInspectionsJob>(TYPES.GenerateSampleInspectionsJob)

export let smokePlannerOrganisationId: number
export let c2cPlannerOrganisationId: number
export let haOrganisationId: number
export let dorsetHAOrganisationId: number

before(async () => {
  smokePlannerOrganisationId = (await getOrganisationByOrganisationReference(knex, SMOKE_TEST_PROMOTER_ORG_REF)).organisation_id
  c2cPlannerOrganisationId = (await getOrganisationByOrganisationReference(knex, C2C_PROMOTER_ORG_REF)).organisation_id
  haOrganisationId = (await getOrganisationByOrganisationReference(knex, ROCHDALE_HA_ORF_REF)).organisation_id
  dorsetHAOrganisationId = (await getOrganisationByOrganisationReference(knex, DORSET_HA_ORF_REF)).organisation_id
})
