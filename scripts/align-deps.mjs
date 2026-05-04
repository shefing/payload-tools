import fs from 'fs'
import path from 'path'

const TARGET = '3.84.1'
const NEXT = '16.2.3'
const REACT = '19.1.0'

const payloadPkgs = [
  'payload',
  '@payloadcms/ui',
  '@payloadcms/next',
  '@payloadcms/richtext-lexical',
  '@payloadcms/translations',
  '@payloadcms/db-mongodb',
  '@payloadcms/db-postgres',
  '@payloadcms/db-sqlite',
]

// These should only be peerDeps, not devDeps (to avoid duplicate installs)
const peerOnlyPkgs = [
  '@payloadcms/ui',
  'react',
  'react-dom',
]

const packagesDir = path.resolve(process.cwd(), 'packages')
const packages = fs.readdirSync(packagesDir)

for (const pkg of packages) {
  const pkgJsonPath = path.join(packagesDir, pkg, 'package.json')
  if (!fs.existsSync(pkgJsonPath)) continue

  const p = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
  let changed = false

  // Update versions
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (!p[section]) continue
    for (const [k, v] of Object.entries(p[section])) {
      if (payloadPkgs.includes(k) && !v.startsWith('>=')) {
        p[section][k] = TARGET
        changed = true
      }
      if (k === 'next' && !v.startsWith('>=')) {
        p[section][k] = NEXT
        changed = true
      }
      if ((k === 'react' || k === 'react-dom') && !v.startsWith('>=')) {
        p[section][k] = REACT
        changed = true
      }
    }
  }

  // Remove from devDependencies if already in peerDependencies (avoid duplicate installs)
  if (p.devDependencies && p.peerDependencies) {
    for (const k of peerOnlyPkgs) {
      if (p.devDependencies[k] && p.peerDependencies[k]) {
        delete p.devDependencies[k]
        changed = true
      }
    }
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(p, null, 2) + '\n')
    console.log('Updated:', pkg)
  }
}

console.log('Done.')
