import { Site, RefReinstatementType } from 'street-manager-data'

export function generateSite(workId: number, type = RefReinstatementType.excavation, siteNumber?: number): Site {
  return {
    site_number: siteNumber,
    work_id: workId,
    reinstatement_type_id: type
  }
}
