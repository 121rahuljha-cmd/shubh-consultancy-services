import { createInterface } from 'node:readline/promises'
import { randomBytes, scryptSync } from 'node:crypto'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. No admin was created.')
  process.exit(1)
}

const prompt = createInterface({ input: process.stdin, output: process.stdout })
const username = (await prompt.question('Admin username: ')).trim()
const password = await prompt.question('Admin password: ', { hideEchoBack: true })
const confirmation = await prompt.question('Confirm password: ', { hideEchoBack: true })
prompt.close()

if (!username || password.length < 12 || password !== confirmation) {
  console.error('Admin was not created. Use a matching password of at least 12 characters.')
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const prisma = new PrismaClient()
try {
  await prisma.adminUser.create({ data: { username, passwordHash, role: 'ADMIN' } })
  console.log('Admin created.')
} catch (error) {
  console.error(error?.code === 'P2002' ? 'Admin was not created: username already exists.' : 'Admin was not created.')
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
