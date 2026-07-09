import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admins = [
    {
      username: process.env.ADMIN1_USERNAME || 'nikolas',
      password: process.env.ADMIN1_PASSWORD || 'change-me-1',
      name: process.env.ADMIN1_NAME || 'Nikolas',
    },
    {
      username: process.env.ADMIN2_USERNAME || 'owner',
      password: process.env.ADMIN2_PASSWORD || 'change-me-2',
      name: process.env.ADMIN2_NAME || 'Owner',
    },
  ]

  for (const admin of admins) {
    const hashed = await bcrypt.hash(admin.password, 10)
    await prisma.user.upsert({
      where: { username: admin.username },
      update: {},
      create: { username: admin.username, password: hashed, name: admin.name },
    })
    console.log(`User ready: ${admin.username}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
