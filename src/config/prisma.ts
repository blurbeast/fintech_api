import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { env } from './env';

const connectionString = process.env.DATABASE_URL;

// initialize pool
const pool = new Pool({ 
  connectionString,
  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
});

// initialize adapter
const adapter = new PrismaPg(pool);

// set up client with adapter
export const prisma = new PrismaClient({ adapter });
