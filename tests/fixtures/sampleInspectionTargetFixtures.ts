import { SampleInspectionTarget } from 'street-manager-data'

export function generateSampleInspectionTarget(sampleInspectionTargetRefNum = 'SMPL-HA-01', haOrganisationId = 2, promoterOrganisationId = 3): SampleInspectionTarget {
  return {
    sample_inspection_target_reference_number: sampleInspectionTargetRefNum,
    promoter_organisation_id: promoterOrganisationId,
    ha_organisation_id: haOrganisationId,
    agreed_category_a: 1,
    agreed_category_b: 2,
    agreed_category_c: 3,
    cap_category_a: 3,
    cap_category_b: 4,
    cap_category_c: 5,
    passed_category_a: 0,
    passed_category_b: 0,
    passed_category_c: 0,
    failed_high_category_a: 0,
    failed_high_category_b: 0,
    failed_high_category_c: 0,
    failed_low_category_a: 0,
    failed_low_category_b: 0,
    failed_low_category_c: 0,
    unable_to_complete_category_a: 0,
    unable_to_complete_category_b: 0,
    unable_to_complete_category_c: 0,
    is_active_target: true
  }
}
