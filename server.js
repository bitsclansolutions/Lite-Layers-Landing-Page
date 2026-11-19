import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use('/api',(req,_r,n)=>{console.log('REQ',req.method,req.url,'AUTH:',req.headers.authorization?'yes len '+req.headers.authorization.length:'NO');n()});
const apiDir = path.join(__dirname, 'api')

const files = fs.readdirSync(apiDir).filter((f) => f.endsWith('.js'))
for (const file of files) {
  const route = '/api/' + file.replace(/\.js$/, '')
  const { default: handler } = await import(pathToFileURL(path.join(apiDir, file)).href)
  if (!handler) { console.warn('No default export:', file); continue }
  if (file.toLowerCase().includes('webhook')) {
    app.all(route, express.raw({ type: '*/*' }), (req, res) => handler(req, res))
  } else {
    app.all(route, express.json(), (req, res) => handler(req, res))
  }
  console.log('Mounted', route)
}

const PORT = process.env.PORT || 3000
app.listen(PORT, '127.0.0.1', () => console.log(`API on :${PORT}`))
