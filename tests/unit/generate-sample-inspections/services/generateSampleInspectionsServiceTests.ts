import 'mocha'
import { assert } from 'chai'
import * as sinon from 'sinon'
import { ArgCaptor2 } from 'ts-mockito/lib/capture/ArgCaptor'
import { mock, instance, when, anything, verify, capture } from 'ts-mockito'
import { RefInspectionCategory, SampleInspection } from 'street-manager-data'
import Logger from '../../../../src/common/utils/logger'
import SampleInspectionDao from '../../../../src/generate-sample-inspections/daos/sampleInspectionDao'
import AsyncJobService from '../../../../src/generate-sample-inspections/services/asyncJobService'
import GenerateSampleInspectionsService from '../../../../src/generate-sample-inspections/services/generateSampleInspectionsService'
import { KNEX, TRX } from '../../../fixtures/knexFixtures'
import { generateSampleInspection } from '../../../fixtures/sampleInspectionFixtures'

describe('GenerateSampleInspectionsService', () => {

  let service: GenerateSampleInspectionsService

  let logger: Logger
  let sampleInspectionDao: SampleInspectionDao
  let asyncJobService: AsyncJobService

  const JOB_ID = 123
  const ORGANISATION_ID = 456
  const CATEGORY_A_SAMPLE_INSPECTION = generateSampleInspection()
  const CATEGORY_B_SAMPLE_INSPECTION = { ...generateSampleInspection(), inspection_category_id: RefInspectionCategory.b }
  const CATEGORY_C_SAMPLE_INSPECTION = { ...generateSampleInspection(), inspection_category_id: RefInspectionCategory.c }

  beforeEach(() => {
    logger = mock(Logger)
    asyncJobService = mock(AsyncJobService)
    sampleInspectionDao = mock(SampleInspectionDao)

    service = new GenerateSampleInspectionsService(
      KNEX,
      instance(logger),
      instance(asyncJobService),
      instance(sampleInspectionDao)
    )

    when(asyncJobService.getJobOrganisation(JOB_ID)).thenResolve(ORGANISATION_ID)
    when(sampleInspectionDao.createNumberToGenerateTempTable(TRX, ORGANISATION_ID)).thenResolve(null)
    when(sampleInspectionDao.generateCategoryASampleInspections(TRX, ORGANISATION_ID)).thenResolve([CATEGORY_A_SAMPLE_INSPECTION])
    when(sampleInspectionDao.generateCategoryBSampleInspections(TRX, ORGANISATION_ID)).thenResolve([CATEGORY_B_SAMPLE_INSPECTION])
    when(sampleInspectionDao.generateCategoryCSampleInspections(TRX, ORGANISATION_ID)).thenResolve([CATEGORY_C_SAMPLE_INSPECTION])
    when(sampleInspectionDao.insert(TRX, anything())).thenResolve(null)
  })

  describe('generateSampleInspections', () => {
    it('should create the temp table with number of sample inspections to generate for the job organisation', async () => {
      await service.generateSampleInspections(JOB_ID)

      verify(sampleInspectionDao.createNumberToGenerateTempTable(TRX, ORGANISATION_ID)).called()
    })

    it('should create sample inspections for Category A, Category B and Category C works', async () => {
      await service.generateSampleInspections(JOB_ID)

      verify(sampleInspectionDao.generateCategoryASampleInspections(TRX, ORGANISATION_ID)).called()
      verify(sampleInspectionDao.generateCategoryBSampleInspections(TRX, ORGANISATION_ID)).called()
      verify(sampleInspectionDao.generateCategoryCSampleInspections(TRX, ORGANISATION_ID)).called()
    })

    it('should insert all generated sample inspections to the DB', async () => {
      await service.generateSampleInspections(JOB_ID)

      verify(sampleInspectionDao.insert(TRX, anything())).called()

      const captor: ArgCaptor2<any, SampleInspection[]> = capture<any, SampleInspection[]>(sampleInspectionDao.insert)
      const [ trx, sampleInspections ] = captor.last()

      assert.deepEqual(sampleInspections, [CATEGORY_A_SAMPLE_INSPECTION, CATEGORY_B_SAMPLE_INSPECTION, CATEGORY_C_SAMPLE_INSPECTION])
      assert.isDefined(trx)
    })

    it('should rollback the transaction if there is an error', async () => {
      when(sampleInspectionDao.insert(TRX, anything())).thenReject(new Error())

      try {
        await service.generateSampleInspections(JOB_ID)
      } catch (error) {
        sinon.assert.calledOnce(TRX.rollback)
      }
    })
  })
})
