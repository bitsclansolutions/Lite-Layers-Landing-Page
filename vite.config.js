import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local into process.env so API handlers can read it
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(__dir, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const key = t.slice(0, i).trim()
      const val = t.slice(i + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* no .env.local in CI — fine */ }
}

// Cache handlers so Firebase Admin only initialises once
const handlerCache = new Map()

// Add Express-style helpers that the API handlers expect
function shimRes(res) {
  res.status = (code) => { res.statusCode = code; return res }
  res.json   = (data) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    }
    return res
  }
  res.send = (data) => {
    if (!res.headersSent) {
      if (data && typeof data === 'object') {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } else {
        res.end(String(data ?? ''))
      }
    }
    return res
  }
  return res
}

function apiDevPlugin() {
  loadEnvLocal()
  return {
    name: 'api-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const route = req.url.split('?')[0]               // e.g. /api/admin-get-stats
        const file  = resolve(__dir, `.${route}.js`)

        // Read body (needed for POST handlers)
        const body = await new Promise(r => {
          const chunks = []
          req.on('data', c => chunks.push(c))
          req.on('end', () => r(Buffer.concat(chunks).toString()))
        })
        if (body) {
          try { req.body = JSON.parse(body) } catch { req.body = body }
        }

        shimRes(res)

        try {
          if (!handlerCache.has(route)) {
            const mod = await import(pathToFileURL(file).href)
            handlerCache.set(route, mod.default)
          }
          await handlerCache.get(route)(req, res)
        } catch (e) {
          console.error(`[api] ${route}:`, e.message)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
})
