import 'mocha'
import { assert } from 'chai'
import * as moment from 'moment'
import { Dictionary, groupBy, indexBy } from 'underscore'
import { AsyncJob, AsyncJobTypeEnum, RefAsyncJobStatus, Work, SampleInspection, RefInspectionCategory, RefWorkStatus, RefReinstatementType, SampleInspectionTarget, Reinstatement, RefReinstatementStatus } from 'street-manager-data'
import { job, knex, postgis, smokePlannerOrganisationId, haOrganisationId, c2cPlannerOrganisationId, dorsetHAOrganisationId } from './setup'
import { generateAsyncJob } from '../../fixtures/asyncJobFixtures'
import { insertJobs, getJob, deleteJobs } from '../helpers/asyncJobHelper'
import { insertSampleInspectionTarget, deleteSampleInspectionTarget } from '../helpers/sampleInspectionTargetHelper'
import { generateSampleInspectionTarget } from '../../fixtures/sampleInspectionTargetFixtures'
import { insertWork, generateIntegrationTestWork, deleteWork } from '../helpers/workHelper'
import { getSampleInspections, insertSampleInspection, deleteSampleInspectionByTarget } from '../helpers/sampleInspectionHelper'
import { generateSampleInspection } from '../../fixtures/sampleInspectionFixtures'
import { generateReinspection } from '../../fixtures/reinspectionFixtures'
import { insertReinspection, deleteReinspection } from '../helpers/reinspectionHelper'
import { insertSite, deleteSite } from '../helpers/siteHelper'
import { generateSite } from '../../fixtures/siteFixtures'
import { insertReinstatement, deleteReinstatement } from '../helpers/reinstatementHelper'
import { generateReinstatement } from '../../fixtures/reinstatementFixtures'

describe('Generate Sample Inspections Job', () => {
  const JOB_ID = 123
  const CATEGORY_A_ID = 1
  const CATEGORY_B_ID = 2
  const CATEGORY_C_ID = 3

  const SEVEN_MONTHS_AGO: Date = new Date(moment().subtract(7, 'months').toISOString())
  const TWO_MONTHS_AGO: Date = new Date(moment().subtract(2, 'months').toISOString())
  const ONE_WEEK_AGO: Date = new Date(moment().subtract(1, 'week').toISOString())
  const ONE_DAY_AGO: Date = new Date(moment().subtract(1, 'day').toISOString())
  const ONE_MONTH_FROM_NOW: Date = new Date(moment().add(1, 'month').toISOString())
  const TWO_MONTHS_FROM_NOW: Date = new Date(moment().add(2, 'months').toISOString())
  const TWO_MONTHS_AND_TWO_WEEKS_FROM_NOW: Date = new Date(moment().add(2, 'months').add(2, 'weeks').toISOString())
  const FOUR_MONTHS_FROM_NOW: Date = new Date(moment().add(4, 'months').toISOString())

  const TARGET_REF_NUM_PREFIX = 'SMPL-HAID-'
  const TARGET_REF_NUM_PREFIX_OTHER_HA = 'SMPL-HA2ID-'

  const WORK_1_WRN = `WRN-1-${Date.now()}`
  const WORK_2_WRN = `WRN-2-${Date.now()}`
  const WORK_3_WRN = `WRN-3-${Date.now()}`
  const WORK_4_WRN = `WRN-4-${Date.now()}`

  const CATEGORY_A_WRN = `WRN-A-${Date.now()}`
  const CATEGORY_A_WRN_WITH_SCHEDULED_INSPECTION = `WRN-A-S-${Date.now()}`
  const CATEGORY_A_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION = `WRN-SMPL-A-${Date.now()}`
  const CATEGORY_A_WRN_PLANNED = `WRN-PLANNED-${Date.now()}`
  const CATEGORY_A_WRN_OTHER_HA = `WRN-OTHER-HA-${Date.now()}`
  const CATEGORY_A_WRN_OTHER_PROMOTER = `WRN-A-PROM-${Date.now()}`
  const CATEGORY_A_WRN_NO_END_DATE = `WRN-A-END-${Date.now()}`

  const CATEGORY_B_WRN = `WRN-B-${Date.now()}`
  const CATEGORY_B_WRN_WITH_SCHEDULED_INSPECTION = `WRN-B-S-${Date.now()}`
  const CATEGORY_B_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION = `WRN-B-SI-A-${Date.now()}`
  const CATEGORY_B_WRN_WITH_CATEGORY_B_SAMPLE_INSPECTION = `WRN-B-SI-B-${Date.now()}`
  const CATEGORY_B_WRN_WITH_NO_REINSTATEMENT = `WRN-B-R-${Date.now()}`
  const CATEGORY_B_WRN_WITH_OLD_REINSTATEMENT = `WRN-B-OR-${Date.now()}`
  const CATEGORY_B_WRN_WITH_NON_EXCAVATION_REINSTATEMENT = `WRN-B-ER-${Date.now()}`
  const CATEGORY_B_WRN_OTHER_HA = `WRN-B-HA-${Date.now()}`
  const CATEGORY_B_WRN_OTHER_PROMOTER = `WRN-B-PROM-${Date.now()}`
  const CATEGORY_B_WRN_MULTIPLE_SITES = `WRN-B-SITES-${Date.now()}`

  const CATEGORY_C_WRN = `WRN-C-${Date.now()}`
  const CATEGORY_C_WRN_WITH_SCHEDULED_INSPECTION = `WRN-C-S-${Date.now()}`
  const CATEGORY_C_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION = `WRN-C-SI-A-${Date.now()}`
  const CATEGORY_C_WRN_WITH_CATEGORY_C_SAMPLE_INSPECTION = `WRN-C-SI-C-${Date.now()}`
  const CATEGORY_C_WRN_WITH_NO_REINSTATEMENT = `WRN-C-R-${Date.now()}`
  const CATEGORY_C_WRN_WITH_REINSTATEMENT_END_FOUR_MONTHS = `WRN-C-R4-${Date.now()}`
  const CATEGORY_C_WRN_WITH_REINSTATEMENT_END_PAST = `WRN-C-R1-${Date.now()}`
  const CATEGORY_C_WRN_WITH_NON_EXCAVATION_REINSTATEMENT = `WRN-C-ER-${Date.now()}`
  const CATEGORY_C_WRN_OTHER_HA = `WRN-C-HA-${Date.now()}`
  const CATEGORY_C_WRN_OTHER_PROMOTER = `WRN-C-PROM-${Date.now()}`
  const CATEGORY_C_WRN_MULTIPLE_SITES = `WRN-C-SITES-${Date.now()}`
  const CATEGORY_C_WITH_INTERIM_REINSTATEMENT = `WRN-C-IR-${Date.now()}`

  let activeSampleInspectionTarget: SampleInspectionTarget
  let activeSampleInspectionTargetIds: number[]
  let inactiveSampleInspectionTargetIds: number[]
  let generatedSampleInspections: SampleInspection[]

  let workIds: number[]
  let siteIds: number[]
  let reinstatementIds: number[]

  let work1: Work
  let work2: Work
  let work3: Work
  let work4: Work

  let categoryAWorkIds: number[]
  let categoryBWorkIds: number[]
  let categoryCWorkIds: number[]

  let workCategoryA: Work
  let workAWithScheduledInspection: Work
  let workAWithCategoryASampleInspection: Work
  let workAPlanned: Work
  let workAOtherHA: Work
  let workAOtherPromoter: Work
  let workANoEndDate: Work

  let workCategoryB: Work
  let workBWithScheduledInspection: Work
  let workBWithCategoryASampleInspection: Work
  let workBWithCategoryBSampleInspection: Work
  let workBWithNoReinstatement: Work
  let workBWithReinstatementMoreThanSixMonthsAgo: Work
  let workBWithNonExcavationReinstatement: Work
  let workBOtherHA: Work
  let workBOtherPromoter: Work
  let workBWithMultipleSites: Work

  let reinstatementCategoryB: Reinstatement
  let reinstatementCategoryBWithCategoryASampleInspection: Reinstatement
  let reinstatementCategoryBOtherPromoter: Reinstatement
  let reinstatementCategoryBMoreRecent: Reinstatement
  let reinstatementCategoryBMostRecentButInactive: Reinstatement

  let categoryBSiteIds: number[]
  let categoryBReinstatementIds: number[]

  let workCategoryC: Work
  let workCWithScheduledInspection: Work
  let workCWithCategoryASampleInspection: Work
  let workCWithCategoryCSampleInspection: Work
  let workCWithNoReinstatement: Work
  let workCWithReinstatementEndMoreThanThreeMonths: Work
  let workCWithReinstatementEndInPast: Work
  let workCWithNonExcavationReinstatement: Work
  let workCOtherHA: Work
  let workCOtherPromoter: Work
  let workCWithMultipleSites: Work
  let workCWithInterimReinstatement: Work

  let reinstatementCategoryC: Reinstatement
  let reinstatementCategoryCWithCategoryASampleInspection: Reinstatement
  let reinstatementCategoryCOtherPromoter: Reinstatement
  let reinstatementCategoryCMoreRecent: Reinstatement
  let reinstatementCategoryCMostRecentButInactive: Reinstatement
  let reinstatementCategoryCMostRecentButInterim: Reinstatement

  let categoryCSiteIds: number[]
  let categoryCReinstatementIds: number[]

  before(async () => {
    await insertJobs(knex, generateAsyncJob(JOB_ID, AsyncJobTypeEnum.GENERATE_SAMPLE_INSPECTION, haOrganisationId))

    inactiveSampleInspectionTargetIds = await insertSampleInspectionTarget(
      knex,
      { ...generateSampleInspectionTarget(TARGET_REF_NUM_PREFIX + '01', haOrganisationId, smokePlannerOrganisationId), is_active_target: false }
    )

    activeSampleInspectionTarget = generateSampleInspectionTarget(TARGET_REF_NUM_PREFIX + '02', haOrganisationId, smokePlannerOrganisationId)

    activeSampleInspectionTargetIds = await insertSampleInspectionTarget(
      knex,
      activeSampleInspectionTarget,
      generateSampleInspectionTarget(TARGET_REF_NUM_PREFIX + '03', haOrganisationId, c2cPlannerOrganisationId),
      generateSampleInspectionTarget(TARGET_REF_NUM_PREFIX_OTHER_HA + '04', dorsetHAOrganisationId, smokePlannerOrganisationId)
    )
  })

  async function runJobAndGetGeneratedSampleInspections(inspectionCatgeoryIds: number[], sampleInspectionTargetIds = activeSampleInspectionTargetIds): Promise<Dictionary<SampleInspection>> {
    await job.run(JOB_ID)

    generatedSampleInspections = await getSampleInspections(knex, sampleInspectionTargetIds, inspectionCatgeoryIds)

    return indexBy(generatedSampleInspections, 'work_id')
  }

  it('should mark job as completed successfully even if no works are eligible and no sample inspections generated', async () => {
    const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID, CATEGORY_B_ID, CATEGORY_C_ID])

    assert.isEmpty(sampleInspections)

    const asyncJob: AsyncJob = await getJob(knex, JOB_ID)
    assert.equal(asyncJob.async_job_status_id, RefAsyncJobStatus.complete)
    assert.isDefined(asyncJob.date_completed)
  })

  describe('should generate sample inspections', () => {

    before(async () => {
      work1 = generateIntegrationTestWork(WORK_1_WRN, RefWorkStatus.in_progress)
      work2 = generateIntegrationTestWork(WORK_2_WRN)
      work3 = generateIntegrationTestWork(WORK_3_WRN)
      work4 = generateIntegrationTestWork(WORK_4_WRN, RefWorkStatus.in_progress)

      workIds = await insertWork(
        knex,
        postgis,
        work1,
        work2,
        work3,
        work4
      )

      siteIds = await insertSite(
        knex,
        generateSite(workIds[1]),
        generateSite(workIds[2]),
        generateSite(workIds[3])
      )

      reinstatementIds = await insertReinstatement(
        knex, postgis,
        generateReinstatement(siteIds[0], TWO_MONTHS_AGO, FOUR_MONTHS_FROM_NOW),
        generateReinstatement(siteIds[1], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(siteIds[2], TWO_MONTHS_AGO, TWO_MONTHS_FROM_NOW)
      )
    })

    it('for works from category A, B and C', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID, CATEGORY_B_ID, CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[workIds[0]], WORK_1_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, workIds[0], work1.promoter_organisation_id, work1.work_end_date)
      assertSampleInspection(sampleInspections[workIds[1]], WORK_2_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, workIds[1], work2.promoter_organisation_id, addSixMonthsToDate(TWO_MONTHS_AGO))
      assertSampleInspection(sampleInspections[workIds[2]], WORK_3_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, workIds[2], work3.promoter_organisation_id, TWO_MONTHS_FROM_NOW)
    })

    it('for category A, B and C for one work if it is valid for all and is needed to reach the targets', async () => {
      await job.run(JOB_ID)
      generatedSampleInspections = await getSampleInspections(knex, activeSampleInspectionTargetIds, [CATEGORY_A_ID, CATEGORY_B_ID, CATEGORY_C_ID])

      const sampleInspections: Dictionary<SampleInspection[]> = groupBy(generatedSampleInspections, 'work_id')

      assertSampleInspection(sampleInspections[workIds[3]][0], WORK_4_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, workIds[3], work4.promoter_organisation_id, work4.work_end_date)
      assertSampleInspection(sampleInspections[workIds[3]][1], WORK_4_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, workIds[3], work4.promoter_organisation_id, addSixMonthsToDate(TWO_MONTHS_AGO))
      assertSampleInspection(sampleInspections[workIds[3]][2], WORK_4_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, workIds[3], work4.promoter_organisation_id, TWO_MONTHS_FROM_NOW)
    })

    after(async () => {
      await deleteReinstatement(knex, ...reinstatementIds)
      await deleteSite(knex, ...siteIds)
      await deleteWork(knex, ...workIds)
    })
  })

  describe('should generate category A sample inspections', () => {

    before(async () => {
      workCategoryA = generateIntegrationTestWork(CATEGORY_A_WRN, RefWorkStatus.in_progress)
      workAWithScheduledInspection = generateIntegrationTestWork(CATEGORY_A_WRN_WITH_SCHEDULED_INSPECTION, RefWorkStatus.in_progress)
      workAWithCategoryASampleInspection = generateIntegrationTestWork(CATEGORY_A_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION, RefWorkStatus.in_progress)
      workAPlanned = generateIntegrationTestWork(CATEGORY_A_WRN_PLANNED)
      workAOtherHA = generateIntegrationTestWork(CATEGORY_A_WRN_OTHER_HA, RefWorkStatus.in_progress, smokePlannerOrganisationId, dorsetHAOrganisationId)
      workAOtherPromoter = generateIntegrationTestWork(CATEGORY_A_WRN_OTHER_PROMOTER, RefWorkStatus.in_progress, c2cPlannerOrganisationId, haOrganisationId)
      workANoEndDate = { ...generateIntegrationTestWork(CATEGORY_A_WRN_NO_END_DATE, RefWorkStatus.in_progress, c2cPlannerOrganisationId, haOrganisationId), work_end_date: null }

      categoryAWorkIds = await insertWork(
        knex,
        postgis,
        workCategoryA,
        workAWithScheduledInspection,
        workAWithCategoryASampleInspection,
        workAPlanned,
        workAOtherHA,
        workAOtherPromoter,
        workANoEndDate
      )

      await insertReinspection(
        knex,
        generateReinspection(categoryAWorkIds[1], CATEGORY_A_WRN_WITH_SCHEDULED_INSPECTION)
      )
    })

    it('for works that do not have scheduled inspections', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID])

      assertSampleInspection(sampleInspections[categoryAWorkIds[0]], CATEGORY_A_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, categoryAWorkIds[0], workCategoryA.promoter_organisation_id, workCategoryA.work_end_date)

      assert.isUndefined(sampleInspections[categoryAWorkIds[1]])
    })

    it('for works that do not already have a category A sample inspection', async () => {
      await insertSampleInspection(
        knex,
        generateSampleInspection(categoryAWorkIds[2] + 'SI-A', categoryAWorkIds[2], inactiveSampleInspectionTargetIds[0])
      )

      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID])

      assertSampleInspection(sampleInspections[categoryAWorkIds[0]], CATEGORY_A_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, categoryAWorkIds[0], workCategoryA.promoter_organisation_id, workCategoryA.work_end_date)

      assert.isUndefined(sampleInspections[categoryAWorkIds[2]])
    })

    it('for works that are active / in progress', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID])

      assertSampleInspection(sampleInspections[categoryAWorkIds[0]], CATEGORY_A_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, categoryAWorkIds[0], workCategoryA.promoter_organisation_id, workCategoryA.work_end_date)

      assert.isUndefined(sampleInspections[categoryAWorkIds[3]])
    })

    it('for the HA org in the job details only', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID])

      assertSampleInspection(sampleInspections[categoryAWorkIds[0]], CATEGORY_A_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, categoryAWorkIds[0], workCategoryA.promoter_organisation_id, workCategoryA.work_end_date)

      assert.isUndefined(sampleInspections[categoryAWorkIds[4]])
    })

    it('for each promoter target for the HA', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID])

      assertSampleInspection(sampleInspections[categoryAWorkIds[0]], CATEGORY_A_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, categoryAWorkIds[0], workCategoryA.promoter_organisation_id, workCategoryA.work_end_date)
      assertSampleInspection(sampleInspections[categoryAWorkIds[5]], CATEGORY_A_WRN_OTHER_PROMOTER + '-SI-A', activeSampleInspectionTargetIds[1], RefInspectionCategory.a, categoryAWorkIds[5], workAOtherPromoter.promoter_organisation_id, workAOtherPromoter.work_end_date)
    })

    it('for works that have a work end date', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID])

      assertSampleInspection(sampleInspections[categoryAWorkIds[0]], CATEGORY_A_WRN + '-SI-A', activeSampleInspectionTargetIds[0], RefInspectionCategory.a, categoryAWorkIds[0], workCategoryA.promoter_organisation_id, workCategoryA.work_end_date)

      assert.isUndefined(sampleInspections[categoryAWorkIds[6]])
    })

    it('for the cap amount defined in the target', async () => {
      await insertSampleInspection(
        knex,
        { ...generateSampleInspection(categoryAWorkIds[0] + 'SI-A'), work_id: categoryAWorkIds[0], sample_inspection_target_id: activeSampleInspectionTargetIds[0] }
      )

      const moreWorkIds: number[] = await insertWork(
        knex, postgis,
        generateIntegrationTestWork(CATEGORY_A_WRN + '1', RefWorkStatus.in_progress),
        generateIntegrationTestWork(CATEGORY_A_WRN + '2', RefWorkStatus.in_progress),
        generateIntegrationTestWork(CATEGORY_A_WRN + '3', RefWorkStatus.in_progress),
        generateIntegrationTestWork(CATEGORY_A_WRN + '4', RefWorkStatus.in_progress),
        generateIntegrationTestWork(CATEGORY_A_WRN + '5', RefWorkStatus.in_progress)
      )
      categoryAWorkIds.push(...moreWorkIds)

      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_A_ID], [activeSampleInspectionTargetIds[0]])

      assert.equal(Object.keys(sampleInspections).length, activeSampleInspectionTarget.cap_category_a)
    })

    after(async () => {
      await deleteReinspection(knex, CATEGORY_A_WRN_WITH_SCHEDULED_INSPECTION)
      await deleteWork(knex, ...categoryAWorkIds)
    })
  })

  describe('should generate category B sample inspections', () => {

    before(async () => {
      workCategoryB = generateIntegrationTestWork(CATEGORY_B_WRN)
      workBWithScheduledInspection = generateIntegrationTestWork(CATEGORY_B_WRN_WITH_SCHEDULED_INSPECTION)
      workBWithCategoryASampleInspection = generateIntegrationTestWork(CATEGORY_B_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION)
      workBWithCategoryBSampleInspection = generateIntegrationTestWork(CATEGORY_B_WRN_WITH_CATEGORY_B_SAMPLE_INSPECTION)
      workBWithNoReinstatement = generateIntegrationTestWork(CATEGORY_B_WRN_WITH_NO_REINSTATEMENT)
      workBWithReinstatementMoreThanSixMonthsAgo = generateIntegrationTestWork(CATEGORY_B_WRN_WITH_OLD_REINSTATEMENT)
      workBWithNonExcavationReinstatement = generateIntegrationTestWork(CATEGORY_B_WRN_WITH_NON_EXCAVATION_REINSTATEMENT)
      workBOtherHA = generateIntegrationTestWork(CATEGORY_B_WRN_OTHER_HA, RefWorkStatus.planned, smokePlannerOrganisationId, dorsetHAOrganisationId)
      workBOtherPromoter = generateIntegrationTestWork(CATEGORY_B_WRN_OTHER_PROMOTER, RefWorkStatus.planned, c2cPlannerOrganisationId, haOrganisationId)
      workBWithMultipleSites = generateIntegrationTestWork(CATEGORY_B_WRN_MULTIPLE_SITES)

      categoryBWorkIds = await insertWork(
        knex,
        postgis,
        workCategoryB,
        workBWithScheduledInspection,
        workBWithCategoryASampleInspection,
        workBWithCategoryBSampleInspection,
        workBWithNoReinstatement,
        workBWithReinstatementMoreThanSixMonthsAgo,
        workBWithNonExcavationReinstatement,
        workBOtherHA,
        workBOtherPromoter,
        workBWithMultipleSites
      )

      categoryBSiteIds = await insertSite(
        knex,
        generateSite(categoryBWorkIds[0]),
        generateSite(categoryBWorkIds[0]),
        generateSite(categoryBWorkIds[1]),
        generateSite(categoryBWorkIds[2]),
        generateSite(categoryBWorkIds[3]),
        generateSite(categoryBWorkIds[5]),
        { ...generateSite(categoryBWorkIds[6]), reinstatement_type_id: RefReinstatementType.bar_holes },
        generateSite(categoryBWorkIds[7]),
        generateSite(categoryBWorkIds[8]),
        generateSite(categoryBWorkIds[9]),
        generateSite(categoryBWorkIds[9]),
        generateSite(categoryBWorkIds[9])
      )

      reinstatementCategoryB = generateReinstatement(categoryBSiteIds[0], TWO_MONTHS_AGO)
      reinstatementCategoryBWithCategoryASampleInspection = generateReinstatement(categoryBSiteIds[2], TWO_MONTHS_AGO)
      reinstatementCategoryBOtherPromoter = generateReinstatement(categoryBSiteIds[8], TWO_MONTHS_AGO)
      reinstatementCategoryBMoreRecent = generateReinstatement(categoryBSiteIds[10], ONE_WEEK_AGO)
      reinstatementCategoryBMostRecentButInactive = { ...generateReinstatement(categoryBSiteIds[9], ONE_DAY_AGO), is_active_reinstatement: false }

      categoryBReinstatementIds = await insertReinstatement(
        knex, postgis,
        reinstatementCategoryB,
        generateReinstatement(categoryBSiteIds[1], TWO_MONTHS_AGO),
        reinstatementCategoryBWithCategoryASampleInspection,
        generateReinstatement(categoryBSiteIds[3], TWO_MONTHS_AGO),
        generateReinstatement(categoryBSiteIds[4], TWO_MONTHS_AGO),
        generateReinstatement(categoryBSiteIds[5], SEVEN_MONTHS_AGO),
        generateReinstatement(categoryBSiteIds[6], TWO_MONTHS_AGO),
        generateReinstatement(categoryBSiteIds[7], TWO_MONTHS_AGO),
        reinstatementCategoryBOtherPromoter,
        generateReinstatement(categoryBSiteIds[9], SEVEN_MONTHS_AGO),
        reinstatementCategoryBMoreRecent,
        generateReinstatement(categoryBSiteIds[9], TWO_MONTHS_AGO),
        reinstatementCategoryBMostRecentButInactive
      )

      await insertReinspection(
        knex,
        generateReinspection(categoryBWorkIds[1], CATEGORY_B_WRN_WITH_SCHEDULED_INSPECTION)
      )
    })

    it('for works that do not have scheduled inspections', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))

      assert.isUndefined(sampleInspections[categoryBWorkIds[1]])
    })

    it('for works that do not already have a category B sample inspection', async () => {
      await insertSampleInspection(
        knex,
        generateSampleInspection(categoryBWorkIds[2] + '-SI-B', categoryBWorkIds[2], inactiveSampleInspectionTargetIds[0]),
        { ...generateSampleInspection(categoryBWorkIds[3] + '-SI-B', categoryBWorkIds[3], inactiveSampleInspectionTargetIds[0]), inspection_category_id: RefInspectionCategory.b }
      )

      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))
      assertSampleInspection(sampleInspections[categoryBWorkIds[2]], CATEGORY_B_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[2], workBWithCategoryASampleInspection.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryBWithCategoryASampleInspection.reinstatement_date))

      assert.isUndefined(sampleInspections[categoryBWorkIds[3]])
    })

    it('for works that have reinstatements carried out less than 6 months ago (one per work)', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))

      assert.isUndefined(sampleInspections[categoryBWorkIds[4]])
      assert.isUndefined(sampleInspections[categoryBWorkIds[5]])
    })

    it('for works that have excavation reinstatements', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))

      assert.isUndefined(sampleInspections[categoryBWorkIds[6]])
    })

    it('for the HA org in the job details only', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))

      assert.isUndefined(sampleInspections[categoryBWorkIds[7]])
    })

    it('for each promoter target for the HA', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))
      assertSampleInspection(sampleInspections[categoryBWorkIds[8]], CATEGORY_B_WRN_OTHER_PROMOTER + '-SI-B', activeSampleInspectionTargetIds[1], RefInspectionCategory.b, categoryBWorkIds[8], workBOtherPromoter.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryBOtherPromoter.reinstatement_date))
    })

    it('for the cap amount defined in the target', async () => {
      await insertSampleInspection(
        knex,
        { ...generateSampleInspection(categoryBWorkIds[0] + '-SI-B'), work_id: categoryBWorkIds[0], sample_inspection_target_id: activeSampleInspectionTargetIds[0], inspection_category_id: RefInspectionCategory.b }
      )

      const moreValidCategoryBWorkIds = await insertWork(
        knex, postgis,
        generateIntegrationTestWork(CATEGORY_B_WRN + '1', RefWorkStatus.planned),
        generateIntegrationTestWork(CATEGORY_B_WRN + '2', RefWorkStatus.planned),
        generateIntegrationTestWork(CATEGORY_B_WRN + '3', RefWorkStatus.planned),
        generateIntegrationTestWork(CATEGORY_B_WRN + '4', RefWorkStatus.planned)
      )
      categoryBWorkIds.push(...moreValidCategoryBWorkIds)

      const moreSiteIds: number[] = await insertSite(
        knex,
        generateSite(moreValidCategoryBWorkIds[0]),
        generateSite(moreValidCategoryBWorkIds[1]),
        generateSite(moreValidCategoryBWorkIds[2]),
        generateSite(moreValidCategoryBWorkIds[3])
      )
      categoryBSiteIds.push(...moreSiteIds)

      const moreReinstatementIds: number[] = await insertReinstatement(
        knex, postgis,
        generateReinstatement(moreSiteIds[0], TWO_MONTHS_AGO),
        generateReinstatement(moreSiteIds[1], TWO_MONTHS_AGO),
        generateReinstatement(moreSiteIds[2], TWO_MONTHS_AGO),
        generateReinstatement(moreSiteIds[3], TWO_MONTHS_AGO)
      )
      categoryBReinstatementIds.push(...moreReinstatementIds)

      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID], [activeSampleInspectionTargetIds[0]])

      assert.equal(Object.keys(sampleInspections).length, activeSampleInspectionTarget.cap_category_b)
    })

    it('with expiry date as the most recent active reinstatement_date for eligible works', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_B_ID])

      assertSampleInspection(sampleInspections[categoryBWorkIds[0]], CATEGORY_B_WRN + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[0], workCategoryB.promoter_organisation_id, addSixMonthsToDate(reinstatementCategoryB.reinstatement_date))
      assertSampleInspection(sampleInspections[categoryBWorkIds[9]], CATEGORY_B_WRN_MULTIPLE_SITES + '-SI-B', activeSampleInspectionTargetIds[0], RefInspectionCategory.b, categoryBWorkIds[9], workBWithMultipleSites.promoter_organisation_id, addSixMonthsToDate(ONE_WEEK_AGO))
    })

    after(async () => {
      await deleteReinspection(knex, CATEGORY_B_WRN_WITH_SCHEDULED_INSPECTION)
      await deleteReinstatement(knex, ...categoryBReinstatementIds)
      await deleteSite(knex, ...categoryBSiteIds)
      await deleteWork(knex, ...categoryBWorkIds)
    })
  })

  describe('should generate category C sample inspections', () => {

    before(async () => {
      workCategoryC = generateIntegrationTestWork(CATEGORY_C_WRN)
      workCWithScheduledInspection = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_SCHEDULED_INSPECTION)
      workCWithCategoryASampleInspection = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION)
      workCWithCategoryCSampleInspection = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_CATEGORY_C_SAMPLE_INSPECTION)
      workCWithNoReinstatement = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_NO_REINSTATEMENT)
      workCWithReinstatementEndMoreThanThreeMonths = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_REINSTATEMENT_END_FOUR_MONTHS)
      workCWithReinstatementEndInPast = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_REINSTATEMENT_END_PAST)
      workCWithNonExcavationReinstatement = generateIntegrationTestWork(CATEGORY_C_WRN_WITH_NON_EXCAVATION_REINSTATEMENT)
      workCOtherHA = generateIntegrationTestWork(CATEGORY_C_WRN_OTHER_HA, RefWorkStatus.planned, smokePlannerOrganisationId, dorsetHAOrganisationId)
      workCOtherPromoter = generateIntegrationTestWork(CATEGORY_C_WRN_OTHER_PROMOTER, RefWorkStatus.planned, c2cPlannerOrganisationId, haOrganisationId)
      workCWithMultipleSites = generateIntegrationTestWork(CATEGORY_C_WRN_MULTIPLE_SITES)
      workCWithInterimReinstatement = generateIntegrationTestWork(CATEGORY_C_WITH_INTERIM_REINSTATEMENT)

      categoryCWorkIds = await insertWork(
        knex, postgis,
        workCategoryC,
        workCWithScheduledInspection,
        workCWithCategoryASampleInspection,
        workCWithCategoryCSampleInspection,
        workCWithNoReinstatement,
        workCWithReinstatementEndMoreThanThreeMonths,
        workCWithReinstatementEndInPast,
        workCWithNonExcavationReinstatement,
        workCOtherHA,
        workCOtherPromoter,
        workCWithMultipleSites,
        workCWithInterimReinstatement
      )

      categoryCSiteIds = await insertSite(
        knex,
        generateSite(categoryCWorkIds[0]),
        generateSite(categoryCWorkIds[0]),
        generateSite(categoryCWorkIds[1]),
        generateSite(categoryCWorkIds[2]),
        generateSite(categoryCWorkIds[3]),
        generateSite(categoryCWorkIds[5]),
        generateSite(categoryCWorkIds[6]),
        { ...generateSite(categoryCWorkIds[7]), reinstatement_type_id: RefReinstatementType.bar_holes },
        generateSite(categoryCWorkIds[8]),
        generateSite(categoryCWorkIds[9]),
        generateSite(categoryCWorkIds[10]),
        generateSite(categoryCWorkIds[10]),
        generateSite(categoryCWorkIds[11])
      )

      reinstatementCategoryC = generateReinstatement(categoryCSiteIds[0], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW)
      reinstatementCategoryCWithCategoryASampleInspection = generateReinstatement(categoryCSiteIds[3], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW)
      reinstatementCategoryCOtherPromoter = generateReinstatement(categoryCSiteIds[9], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW)
      reinstatementCategoryCMoreRecent = generateReinstatement(categoryCSiteIds[11], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW)
      reinstatementCategoryCMostRecentButInactive = { ...generateReinstatement(categoryCSiteIds[11], SEVEN_MONTHS_AGO, TWO_MONTHS_AND_TWO_WEEKS_FROM_NOW), is_active_reinstatement: false }
      reinstatementCategoryCMostRecentButInterim = { ...generateReinstatement(categoryCSiteIds[11], SEVEN_MONTHS_AGO, TWO_MONTHS_AND_TWO_WEEKS_FROM_NOW), is_active_reinstatement: false, reinstatement_status_id: RefReinstatementStatus.interim }

      categoryCReinstatementIds = await insertReinstatement(
        knex, postgis,
        reinstatementCategoryC,
        generateReinstatement(categoryCSiteIds[1], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(categoryCSiteIds[2], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        reinstatementCategoryCWithCategoryASampleInspection,
        generateReinstatement(categoryCSiteIds[4], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(categoryCSiteIds[5], SEVEN_MONTHS_AGO, FOUR_MONTHS_FROM_NOW),
        generateReinstatement(categoryCSiteIds[6], SEVEN_MONTHS_AGO, ONE_DAY_AGO),
        generateReinstatement(categoryCSiteIds[7], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(categoryCSiteIds[8], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        reinstatementCategoryCOtherPromoter,
        generateReinstatement(categoryCSiteIds[10], SEVEN_MONTHS_AGO, ONE_MONTH_FROM_NOW),
        reinstatementCategoryCMoreRecent,
        generateReinstatement(categoryCSiteIds[11], SEVEN_MONTHS_AGO, ONE_MONTH_FROM_NOW),
        reinstatementCategoryCMostRecentButInactive,
        reinstatementCategoryCMostRecentButInterim,
        { ...generateReinstatement(categoryCSiteIds[12], SEVEN_MONTHS_AGO, ONE_MONTH_FROM_NOW), reinstatement_status_id: RefReinstatementStatus.interim }
      )

      await insertReinspection(
        knex,
        generateReinspection(categoryCWorkIds[1], CATEGORY_C_WRN_WITH_SCHEDULED_INSPECTION)
      )
    })

    it('for works that do not have scheduled inspections', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)

      assert.isUndefined(sampleInspections[categoryCWorkIds[1]])
    })

    it('for works that do not already have a category C sample inspection', async () => {
      await insertSampleInspection(
        knex,
        generateSampleInspection(categoryCWorkIds[2] + 'SI-C', categoryCWorkIds[2], inactiveSampleInspectionTargetIds[0]),
        { ...generateSampleInspection(categoryCWorkIds[3] + 'SI-C', categoryCWorkIds[3], inactiveSampleInspectionTargetIds[0]), inspection_category_id: RefInspectionCategory.c }
      )

      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)
      assertSampleInspection(sampleInspections[categoryCWorkIds[2]], CATEGORY_C_WRN_WITH_CATEGORY_A_SAMPLE_INSPECTION + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[2], workCWithCategoryASampleInspection.promoter_organisation_id, reinstatementCategoryCWithCategoryASampleInspection.end_date)

      assert.isUndefined(sampleInspections[categoryCWorkIds[3]])
    })

    it('for works that have reinstatements with an end date in the next three months (one per work)', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)

      assert.isUndefined(sampleInspections[categoryCWorkIds[4]])
      assert.isUndefined(sampleInspections[categoryCWorkIds[5]])
      assert.isUndefined(sampleInspections[categoryCWorkIds[6]])
    })

    it('for works that have excavation reinstatements', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)

      assert.isUndefined(sampleInspections[categoryCWorkIds[7]])
    })

    it('for the HA org in the job details only', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)

      assert.isUndefined(sampleInspections[categoryCWorkIds[8]])
    })

    it('for each promoter target for the HA', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)
      assertSampleInspection(sampleInspections[categoryCWorkIds[9]], CATEGORY_C_WRN_OTHER_PROMOTER + '-SI-C', activeSampleInspectionTargetIds[1], RefInspectionCategory.c, categoryCWorkIds[9], workCOtherPromoter.promoter_organisation_id, reinstatementCategoryCOtherPromoter.end_date)
    })

    it('should generate the correct number of sample inspections for the target', async () => {
      await insertSampleInspection(
        knex,
        { ...generateSampleInspection(categoryCWorkIds[0] + '-SI-C'), work_id: categoryCWorkIds[0], sample_inspection_target_id: activeSampleInspectionTargetIds[0], inspection_category_id: RefInspectionCategory.c }
      )

      const moreValidCategoryCWorkIds = await insertWork(
        knex, postgis,
        generateIntegrationTestWork(CATEGORY_C_WRN + '1'),
        generateIntegrationTestWork(CATEGORY_C_WRN + '2'),
        generateIntegrationTestWork(CATEGORY_C_WRN + '3'),
        generateIntegrationTestWork(CATEGORY_C_WRN + '4'),
        generateIntegrationTestWork(CATEGORY_C_WRN + '5')
      )
      categoryCWorkIds.push(...moreValidCategoryCWorkIds)

      const moreSiteIds: number[] = await insertSite(
        knex,
        generateSite(moreValidCategoryCWorkIds[0]),
        generateSite(moreValidCategoryCWorkIds[1]),
        generateSite(moreValidCategoryCWorkIds[2]),
        generateSite(moreValidCategoryCWorkIds[3]),
        generateSite(moreValidCategoryCWorkIds[4])
      )
      categoryCSiteIds.push(...moreSiteIds)

      const moreReinstatementIds: number[] = await insertReinstatement(
        knex, postgis,
        generateReinstatement(moreSiteIds[0], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(moreSiteIds[1], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(moreSiteIds[2], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(moreSiteIds[3], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW),
        generateReinstatement(moreSiteIds[4], SEVEN_MONTHS_AGO, TWO_MONTHS_FROM_NOW)
      )
      categoryCReinstatementIds.push(...moreReinstatementIds)

      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID], [activeSampleInspectionTargetIds[0]])

      assert.equal(Object.keys(sampleInspections).length, activeSampleInspectionTarget.cap_category_c)
    })

    it('with expiry date as the most recent active reinstatment end_date for eligible works', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)
      assertSampleInspection(sampleInspections[categoryCWorkIds[10]], CATEGORY_C_WRN_MULTIPLE_SITES + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[10], workCWithMultipleSites.promoter_organisation_id, reinstatementCategoryCMoreRecent.end_date)
    })

    it('for works that have permanent reinstatements', async () => {
      const sampleInspections: Dictionary<SampleInspection> = await runJobAndGetGeneratedSampleInspections([CATEGORY_C_ID])

      assertSampleInspection(sampleInspections[categoryCWorkIds[0]], CATEGORY_C_WRN + '-SI-C', activeSampleInspectionTargetIds[0], RefInspectionCategory.c, categoryCWorkIds[0], workCategoryC.promoter_organisation_id, reinstatementCategoryC.end_date)

      assert.isUndefined(sampleInspections[categoryCWorkIds[11]])
    })

    after(async () => {
      await deleteReinspection(knex, CATEGORY_C_WRN_WITH_SCHEDULED_INSPECTION)
      await deleteReinstatement(knex, ...categoryCReinstatementIds)
      await deleteSite(knex, ...categoryCSiteIds)
      await deleteWork(knex, ...categoryCWorkIds)
    })
  })

  afterEach(async () => {
    await deleteSampleInspectionByTarget(knex, ...activeSampleInspectionTargetIds, ...inactiveSampleInspectionTargetIds)
  })

  after(async () => {
    await deleteSampleInspectionTarget(knex, TARGET_REF_NUM_PREFIX + '01', TARGET_REF_NUM_PREFIX + '02', TARGET_REF_NUM_PREFIX + '03', TARGET_REF_NUM_PREFIX_OTHER_HA + '04')
    await deleteJobs(knex, JOB_ID)
  })

  function addSixMonthsToDate(date: Date): Date {
    return moment(date).add(6, 'months').toDate()
  }

  function assertSampleInspection(sampleInspection: SampleInspection, refNumber: string, targetId: number, inspectionCategory: number, workId: number, promoterOrgId: number, expiryDate: Date) {
    assert.equal(sampleInspection.sample_inspection_reference_number, refNumber)
    assert.equal(sampleInspection.sample_inspection_target_id, targetId)
    assert.equal(sampleInspection.inspection_category_id, inspectionCategory)
    assert.equal(sampleInspection.work_id, workId)
    assert.equal(sampleInspection.promoter_organisation_id, promoterOrgId)
    assert.deepEqual(moment(sampleInspection.expiry_date).startOf('day').toDate(), moment(expiryDate).startOf('day').toDate())
  }
})
