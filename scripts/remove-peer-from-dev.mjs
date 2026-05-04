import fs from 'fs'
import path from 'path'

const toRemove = [
  '@payloadcms/ui',
  '@payloadcms/next',
  '@payloadcms/richtext-lexical',
  '@payloadcms/translations',
  'payload',
  'react',
  'react-dom',
  'next',
]

const packagesDir = path.resolve(process.cwd(), 'packages')
const packages = fs.readdirSync(packagesDir)

for (const pkg of packages) {
  const pkgJsonPath = path.join(packagesDir, pkg, 'package.json')
  if (!fs.existsSync(pkgJsonPath)) continue

  const p = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
  let changed = false

  for (const k of toRemove) {
    if (p.devDependencies?.[k]) {
      delete p.devDependencies[k]
      changed = true
    }
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(p, null, 2) + '\n')
    console.log('Updated:', pkg)
  }
}

console.log('Done.')
