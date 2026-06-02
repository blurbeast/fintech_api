import express from 'express';
import 'express-async-errors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import { errorHandler } from './shared/middlewares/errorHandler';
import './config/walletWorker';
import './config/outboxPoller';

const app = express();
app.use(express.json());

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fintech Wallet API',
      version: '1.0.0',
      description: 'A module-based fintech wallet API',
    },
    servers: [
      {
        url: `http://${env.IP_ADDRESS}:${env.PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});
app.use(errorHandler);

app.listen(Number(env.PORT), env.IP_ADDRESS, () => {
  console.log(`Server is running on http://${env.IP_ADDRESS}:${env.PORT}`);
  console.log(`Swagger docs available at http://${env.IP_ADDRESS}:${env.PORT}/api-docs`);
});

export default app;
