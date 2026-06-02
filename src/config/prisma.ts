import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { env } from './env';

const connectionString = env.DATABASE_URL;

// Initialize pg pool
const pool = new Pool({ connectionString });

// Initialize Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma client with adapter
export const prisma = new PrismaClient({ adapter });
