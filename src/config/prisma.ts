import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

// initialize pool
const pool = new Pool({ 
  connectionString,
  min: 20,
  max: 50,
});

// initialize adapter
const adapter = new PrismaPg(pool);

// set up client with adapter
export const prisma = new PrismaClient({ adapter });
