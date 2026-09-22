import 'server-only'

import { prisma } from '@/lib/prisma'

export type LeadInput = {
  name: string
  mobile: string
  whatsapp?: string
  email?: string
  businessName?: string
  businessType?: string
  service?: string
  category?: string
  state?: string
  city?: string
  message?: string
  landingPage?: string
  source?: string
  medium?: string
  campaign?: string
}

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export function validateLeadInput(input: unknown): LeadInput | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  const lead: LeadInput = {
    name: clean(value.name, 120), mobile: clean(value.mobile, 40), whatsapp: clean(value.whatsapp, 40), email: clean(value.email, 180), businessName: clean(value.businessName, 180), businessType: clean(value.businessType, 120), service: clean(value.service, 120), category: clean(value.category, 120), state: clean(value.state, 120), city: clean(value.city, 120), message: clean(value.message, 2000), landingPage: clean(value.landingPage, 500), source: clean(value.source, 120), medium: clean(value.medium, 120), campaign: clean(value.campaign, 120),
  }
  if (!lead.name || !/^[+\d][\d\s().-]{6,38}$/.test(lead.mobile)) return null
  if (lead.email && !/^\S+@\S+\.\S+$/.test(lead.email)) return null
  return lead
}

export async function createLead(input: LeadInput) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required before leads can be stored.')
  return prisma.lead.create({ data: input })
}

export async function listLeads() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required before leads can be viewed.')
  return prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
}
