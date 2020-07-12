import { RefWorkStatus, Work } from 'street-manager-data'

export function generateWork(promoterOrgId = 3, haOrgId = 2, referenceNumber = `WRN${Date.now()}`, workStatusId = RefWorkStatus.planned): Work {
  return {
    work_reference_number: referenceNumber,
    workstream_id: 1,
    promoter_organisation_id: promoterOrgId,
    ha_organisation_id: haOrgId,
    street_name: 'some street',
    town: 'some town',
    area_name: 'some area',
    usrn: 1234,
    road_category: 1,
    works_coordinates: '{"type":"Point","coordinates":[85647.67,653421.03]}',
    date_created: new Date(),
    latest_works_location_description: 'some location description',
    work_status_id: workStatusId,
    inspection_units: 1,
    work_end_date: new Date()
  }
}
