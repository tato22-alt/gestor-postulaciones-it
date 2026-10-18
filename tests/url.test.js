import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isValidHttpUrl, normalizeHttpUrl } from '../src/utils/url.js'

describe('isValidHttpUrl', () => {
  it('accepts http and https URLs', () => {
    assert.equal(isValidHttpUrl('http://example.com'), true)
    assert.equal(isValidHttpUrl('https://example.com/jobs?id=1'), true)
    assert.equal(isValidHttpUrl('  https://example.com  '), true)
  })

  it('rejects unsafe or unsupported schemes', () => {
    for (const value of [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      ' javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://example.com',
      'mailto:someone@example.com',
      'vbscript:msgbox(1)',
    ]) {
      assert.equal(isValidHttpUrl(value), false, value)
    }
  })

  it('rejects malformed and non-string values', () => {
    for (const value of ['', 'example.com', 'https://', null, undefined, 42, {}]) {
      assert.equal(isValidHttpUrl(value), false, String(value))
    }
  })
})

describe('normalizeHttpUrl', () => {
  it('trims and canonicalizes the URL', () => {
    assert.equal(normalizeHttpUrl('  HTTPS://Example.COM  '), 'https://example.com/')
  })
})
