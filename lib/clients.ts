import 'server-only'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { prisma } from '@/lib/prisma'

export type ClientRecord = {
  id: string
  name: string
  logo: string
  logoAlt: string
  description: string
  websiteUrl: string
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const settingKey = 'public-clients'
const storeFile = path.join(process.cwd(), '.local', 'clients.json')

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const normalizeText = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : ''

export function validateExternalUrl(value: string, required = false) {
  if (!value) return required ? 'A secure external URL is required.' : null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return 'Website URLs must use HTTPS.'
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return 'Local URLs are not allowed.'
    return null
  } catch {
    return 'Enter a valid HTTPS URL.'
  }
}

function validLogoUrl(value: string) {
  if (value.startsWith('/')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeClient(value: unknown, index: number): ClientRecord | null {
  if (!isObject(value)) return null
  const name = normalizeText(value.name, 160)
  const logo = normalizeText(value.logo, 1000)
  if (!name || !logo || !validLogoUrl(logo)) return null
  const websiteUrl = normalizeText(value.websiteUrl, 1000)
  if (validateExternalUrl(websiteUrl)) return null
  const now = new Date().toISOString()
  return {
    id: normalizeText(value.id, 100) || crypto.randomUUID(),
    name,
    logo,
    logoAlt: normalizeText(value.logoAlt, 240) || `${name} logo`,
    description: normalizeText(value.description, 1000),
    websiteUrl,
    enabled: value.enabled !== false,
    sortOrder: Number.isFinite(Number(value.sortOrder)) ? Number(value.sortOrder) : index,
    createdAt: normalizeText(value.createdAt, 40) || now,
    updatedAt: normalizeText(value.updatedAt, 40) || now,
  }
}

function normalizeClients(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(normalizeClient).filter((client): client is ClientRecord => Boolean(client)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

async function readLocal() {
  try {
    return normalizeClients(JSON.parse(await readFile(storeFile, 'utf8')))
  } catch {
    return []
  }
}

async function writeLocal(clients: ClientRecord[]) {
  await mkdir(path.dirname(storeFile), { recursive: true })
  await writeFile(storeFile, JSON.stringify(clients, null, 2), 'utf8')
}

export async function listClients() {
  if (process.env.DATABASE_URL) {
    const setting = await prisma.globalSetting.findUnique({ where: { key: settingKey } })
    return normalizeClients(setting?.value)
  }
  if (process.env.NODE_ENV !== 'development') return []
  return readLocal()
}

export async function listEnabledClients() {
  return (await listClients()).filter((client) => client.enabled)
}

export async function saveClients(clients: unknown) {
  const normalized = normalizeClients(clients)
  if (process.env.DATABASE_URL) {
    return prisma.globalSetting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: normalized as never },
      update: { value: normalized as never },
    }).then(() => normalized)
  }
  if (process.env.NODE_ENV !== 'development') throw new Error('DATABASE_URL is required for client persistence.')
  await writeLocal(normalized)
  return normalized
}

export async function createClient(input: Partial<ClientRecord>) {
  const clients = await listClients()
  const now = new Date().toISOString()
  const next = normalizeClient({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now, sortOrder: clients.length }, clients.length)
  if (!next) throw new Error('Name and logo are required, and website URL must use HTTPS.')
  return saveClients([...clients, next])
}
