import { Reinspection, RefInspectionCategory, RefInspectionType } from 'street-manager-data'

export function generateReinspection(workId = 1, workReferenceNumber = '123'): Reinspection {
  return {
    reinspection_date_time: new Date(),
    reinspection_date: new Date(),
    date_created: new Date(),
    date_modified: new Date(),
    work_reference_number: workReferenceNumber,
    inspection_category_id: RefInspectionCategory.a,
    inspection_type_id: RefInspectionType.live_site,
    work_id: workId,
    works_location_description: 'some location'
  }
}
