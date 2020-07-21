import { RefReinstatementStatus, Reinstatement } from 'street-manager-data'

export function generateReinstatement(siteId = 123, reinstatementDate = new Date(), endDate = new Date(), permitId?: number): Reinstatement {
  return {
    permit_id: permitId,
    site_id: siteId,
    reinstatement_status_id: RefReinstatementStatus.permanent,
    reinstatement_date: reinstatementDate,
    depth: 1.1,
    length: 1.1,
    width: 1.1,
    reinstatement_coordinates: { type: 'Point', coordinates: [85647.67, 653421.03] },
    location_description: 'some description',
    end_date: endDate,
    date_created: new Date(),
    date_modified: new Date(),
    reinstatement_evidence: false,
    is_active_reinstatement: true,
    works_location_description: 'some location'
  }
}
