import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname
const logoDirectory = join(root, 'public', 'client-logos')
const expectedClients = [
  'Waffle Castle',
  'Tealogy',
  'Suto Cafe',
  'Chicka Litti',
  'Mr. Sandwich',
  'Chai Bunk',
  'Dakshinam',
  'Gopure Natural',
  'Chai City',
]

const expectedLogoFiles = new Set([
  'waffle-castle.png',
  'tealogy.png',
  'suto-cafe.png',
  'chicka-litti.png',
  'mr-sandwich.png',
  'chai-bunk.png',
  'dakshinam.png',
  'gopure-natural.jpg',
  'chai-city.png',
])

test('homepage client portfolio contains exactly the nine requested official-brand cards', () => {
  const logoFiles = readdirSync(logoDirectory).sort()
  assert.deepEqual(logoFiles, [...expectedLogoFiles].sort())

  for (const file of logoFiles) {
    const bytes = readFileSync(join(logoDirectory, file))
    assert.ok(bytes.length > 0, `${file} should not be empty`)
  }

  const clientSource = readFileSync(join(root, 'lib/client-logos.ts'), 'utf8')
  for (const client of expectedClients) {
    assert.match(clientSource, new RegExp(client.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  const portfolio = readFileSync(join(root, 'components/client-portfolio.tsx'), 'utf8')
  assert.match(portfolio, /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5/)
  assert.match(portfolio, /object-contain/)
  assert.doesNotMatch(portfolio, /View More Clients/)
  assert.doesNotMatch(portfolio, /will be updated soon/i)
  assert.doesNotMatch(portfolio, /client\.description/)
  assert.doesNotMatch(portfolio, /Visit Website/)
})

test('homepage uses the static official logo catalogue and the complete header brand name', () => {
  const page = readFileSync(join(root, 'app/page.tsx'), 'utf8')
  const header = readFileSync(join(root, 'components/site-header.tsx'), 'utf8')

  assert.match(page, /clientLogos/)
  assert.match(header, /Shubh Consultancy Services/)
  assert.match(header, /src="\/icon\.svg"/)
})
