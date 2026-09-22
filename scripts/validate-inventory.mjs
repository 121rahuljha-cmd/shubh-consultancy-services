import fs from 'node:fs'

const inventory = JSON.parse(fs.readFileSync(new URL('../service-unified-inventory.json', import.meta.url)))
const records = inventory.records
const fields = ['id', 'canonicalTitle', 'slug', 'category', 'subcategory', 'matchType', 'status']
const missing = records.flatMap((record) => fields.filter((field) => !record[field]).map((field) => `${record.id}: ${field}`))
const slugs = records.map((record) => record.slug)
const duplicateSlugs = [...new Set(slugs.filter((slug, index) => slugs.indexOf(slug) !== index))]
const invalidStatus = records.filter((record) => record.status !== 'existing_shubh' && record.status !== 'planned')
const invalidSources = records.filter((record) => (record.corpbizUrl && !record.corpbizUrl.startsWith('https://corpbiz.io/')) || (record.indiafilingsUrl && !record.indiafilingsUrl.startsWith('https://www.indiafilings.com/')))
if (missing.length || duplicateSlugs.length || invalidStatus.length || invalidSources.length) {
  console.error(JSON.stringify({ missing, duplicateSlugs, invalidStatus: invalidStatus.map((record) => record.id), invalidSources: invalidSources.map((record) => record.id) }, null, 2))
  process.exit(1)
}
console.log(JSON.stringify({ records: records.length, categories: inventory.categories.length, planned: records.filter((record) => record.status === 'planned').length, existingShubh: records.filter((record) => record.status === 'existing_shubh').length, sourceCorpbiz: records.filter((record) => record.corpbizUrl).length, sourceIndiaFilings: records.filter((record) => record.indiafilingsUrl).length }, null, 2))
