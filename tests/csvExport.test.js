import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildApplicationsCsv,
  buildOpportunitiesCsv,
  escapeCsvCell,
} from '../src/application/csvExport.js'
import { createApplication, createOpportunity } from './helpers.js'

describe('csvExport', () => {
  it('quotes commas, quotes, and line breaks (RFC 4180)', () => {
    assert.equal(escapeCsvCell('a,b'), '"a,b"')
    assert.equal(escapeCsvCell('dijo "hola"'), '"dijo ""hola"""')
    assert.equal(escapeCsvCell('línea 1\nlínea 2'), '"línea 1\nlínea 2"')
    assert.equal(escapeCsvCell(null), '')
  })

  it('quotes semicolons and tabs so locales that split on ";" cannot start a formula cell', () => {
    assert.equal(escapeCsvCell('ACME;=1+1'), '"ACME;=1+1"')
    assert.equal(escapeCsvCell('a\tb'), '"a\tb"')
  })

  it('neutralizes spreadsheet formulas', () => {
    for (const value of ['=HYPERLINK("x")', '+1', '-1', '@SUM(A1)', '\tx', '\rx']) {
      assert.ok(escapeCsvCell(value).replace(/^"/, '').startsWith("'"), JSON.stringify(value))
    }
    assert.equal(escapeCsvCell('Normal'), 'Normal')
  })

  it('builds the opportunities sheet with Spanish labels and a UTF-8 BOM', () => {
    const csv = buildOpportunitiesCsv([
      createOpportunity({ company: 'Ácme, SA', modality: 'remote', status: 'saved', publishedAt: '2026-01-02' }),
    ])
    const [header, row] = csv.slice(1).trimEnd().split('\r\n')

    assert.ok(csv.startsWith('﻿'))
    assert.equal(header, 'Empresa,Puesto,Estado,Modalidad,Jornada,Ubicación,Fecha de publicación,Enlace,Fecha de alta')
    assert.ok(row.startsWith('"Ácme, SA",Desarrollador trainee,Guardada,Remota,,,2026-01-02,https://example.com/jobs/1,'))
  })

  it('builds the applications sheet joined with its opportunity', () => {
    const csv = buildApplicationsCsv(
      [createApplication({ status: 'interview', followUpAt: '2026-01-12', nextAction: '=cmd', notes: 'Nota' })],
      [createOpportunity()],
    )
    const row = csv.slice(1).trimEnd().split('\r\n')[1]

    assert.ok(row.startsWith('Acme,Desarrollador trainee,Entrevista,'))
    assert.ok(row.endsWith(",2026-01-12,'=cmd,Nota"))
  })
})
