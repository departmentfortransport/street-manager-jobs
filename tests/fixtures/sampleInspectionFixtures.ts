import { SampleInspection, RefInspectionCategory, RefSampleInspectionStatus } from 'street-manager-data'

export function generateSampleInspection(sampleInspectionReferenceNumber = 'SMPL-01', workId = 123, sampleInspectionTargetId = 1): SampleInspection {
  return {
    sample_inspection_reference_number: sampleInspectionReferenceNumber,
    sample_inspection_target_id: sampleInspectionTargetId,
    inspection_category_id: RefInspectionCategory.a,
    work_id: workId,
    promoter_organisation_id: 11,
    expiry_date: new Date(),
    sample_inspection_status_id: RefSampleInspectionStatus.issued
  }
}
