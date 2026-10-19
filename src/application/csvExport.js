import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  MODALITIES,
  OPPORTUNITY_STATUSES,
} from '../constants/domainOptions.js'
import { toLocalDateString } from '../utils/date.js'

// Byte order mark so spreadsheet programs such as Excel detect UTF-8 and show accents.
const UTF8_BOM = '﻿'

// A cell that starts with one of these characters can be interpreted as a formula by
// spreadsheet programs (CSV injection), so it is prefixed with an apostrophe.
const FORMULA_TRIGGER_PATTERN = /^[=+\-@\t\r]/

function getLabel(options, value) {
  return Object.values(options).find((option) => option.value === value)?.label ?? ''
}

export function escapeCsvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  const safeText = FORMULA_TRIGGER_PATTERN.test(text) ? `'${text}` : text

  // Semicolons and tabs are quoted too: spreadsheet programs in Spanish locales split
  // CSV files on ';', which would otherwise let a value start a new, formula-like cell.
  return /[",;\t\r\n]/.test(safeText) ? `"${safeText.replaceAll('"', '""')}"` : safeText
}

export function toCsv(rows) {
  return UTF8_BOM + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n'
}

export function buildOpportunitiesCsv(opportunities, sources = []) {
  const sourceNamesById = new Map(sources.map((source) => [source.id, source.companyName]))

  return toCsv([
    ['Empresa', 'Puesto', 'Estado', 'Modalidad', 'Jornada', 'Ubicación', 'Fecha de publicación', 'Enlace', 'Fecha de alta', 'Fuente'],
    ...opportunities.map((opportunity) => [
      opportunity.company,
      opportunity.title,
      getLabel(OPPORTUNITY_STATUSES, opportunity.status),
      getLabel(MODALITIES, opportunity.modality),
      getLabel(EMPLOYMENT_TYPES, opportunity.employmentType),
      opportunity.location,
      opportunity.publishedAt ?? '',
      opportunity.url,
      toLocalDateString(opportunity.createdAt) ?? '',
      sourceNamesById.get(opportunity.sourceId) ?? '',
    ]),
  ])
}

export function buildApplicationsCsv(applications, opportunities) {
  const opportunitiesById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]))

  return toCsv([
    ['Empresa', 'Puesto', 'Estado', 'Fecha de postulación', 'Próximo seguimiento', 'Próxima acción', 'Notas'],
    ...applications.map((application) => {
      const opportunity = opportunitiesById.get(application.opportunityId)

      return [
        opportunity?.company ?? '',
        opportunity?.title ?? '',
        getLabel(APPLICATION_STATUSES, application.status),
        toLocalDateString(application.appliedAt) ?? '',
        application.followUpAt ?? '',
        application.nextAction,
        application.notes,
      ]
    }),
  ])
}
