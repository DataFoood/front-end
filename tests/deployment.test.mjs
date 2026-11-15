import assert from 'node:assert/strict'
import { test } from 'node:test'
import config from '../next.config.js'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants.js'

test('deployment configuration', async (t) => {
  const original = process.env.NEXT_PUBLIC_API_URL
  t.after(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_API_URL
    else process.env.NEXT_PUBLIC_API_URL = original
  })

  await t.test('rejects missing, malformed, insecure and non-origin API URLs at build time', () => {
    delete process.env.NEXT_PUBLIC_API_URL
    assert.throws(() => config(PHASE_PRODUCTION_BUILD), /NEXT_PUBLIC_API_URL/)
    for (const value of ['', 'invalid', 'http://api.example.com', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://api.localhost', 'https://user:secret@api.example.com', 'https://api.example.com/api', 'https://api.example.com?key=secret', 'https://api.example.com#fragment']) {
      process.env.NEXT_PUBLIC_API_URL = value
      assert.throws(() => config(PHASE_PRODUCTION_BUILD), /NEXT_PUBLIC_API_URL/)
    }
  })

  await t.test('accepts HTTPS origins with or without a trailing slash', () => {
    for (const value of ['https://api.example.com', 'https://api.example.com/']) {
      process.env.NEXT_PUBLIC_API_URL = value
      assert.ok(config(PHASE_PRODUCTION_BUILD))
    }
  })

  await t.test('keeps local development and starting an existing build independent of the API build variable', () => {
    delete process.env.NEXT_PUBLIC_API_URL
    assert.ok(config(PHASE_DEVELOPMENT_SERVER))
    assert.ok(config(PHASE_PRODUCTION_SERVER))
  })

  await t.test('allows next typegen without deployment variables even though Next uses the build phase', () => {
    const command = process.argv[2]
    try {
      delete process.env.NEXT_PUBLIC_API_URL
      process.argv[2] = 'typegen'
      assert.ok(config(PHASE_PRODUCTION_BUILD))
    } finally {
      if (command === undefined) process.argv.splice(2, 1)
      else process.argv[2] = command
    }
  })

  await t.test('allows geolocation for this site while keeping camera and microphone disabled', async () => {
    const headers = await config(PHASE_DEVELOPMENT_SERVER).headers()
    const policy = headers[0].headers.find(header => header.key === 'Permissions-Policy')
    assert.equal(policy.value, 'camera=(), microphone=(), geolocation=(self)')
  })
})
