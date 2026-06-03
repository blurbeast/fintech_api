import 'reflect-metadata';
import express from 'express';
import 'express-async-errors';
import { env } from './config/env';
import apiRoutes from './routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './shared/middlewares/errorHandler';
import { prisma } from './config/prisma';
import { bullmqConnection } from './config/bullmq';

async function bootstrap() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Successfully connected to the Database');

    await bullmqConnection.ping();
    console.log('Successfully connected to Redis');

    require('./config/walletWorker');
    require('./config/transactionWorker');
    require('./config/outboxPoller');

    const app = express();
    app.use(express.json());

    // swagger setup
    setupSwagger(app);

    app.use('/api', apiRoutes);

    app.get('/health', (req, res) => {
      res.json({ status: 'OK' });
    });
    
    app.use(errorHandler);

    app.listen(Number(env.PORT), env.IP_ADDRESS, () => {
      console.log(`Server is running on http://${env.IP_ADDRESS}:${env.PORT}`);
      console.log(`Swagger docs available at http://${env.IP_ADDRESS}:${env.PORT}/api-docs`);
    });

  } catch (error) {
    console.error('Failed to start server due to infrastructure connection error:', error);
    process.exit(1);
  }
}

bootstrap();
