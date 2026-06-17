import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FURPMS API',
      version: '2.0.0',
      description:
        'FPT University Research Project Management System — REST API Documentation',
      contact: {
        name: 'FURPMS Team',
        email: 'admin@furpms.edu.vn',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 5068}`,
        description: process.env.NODE_ENV === 'production' ? 'Production (Railway)' : 'Development',
      },
      {
        url: 'https://furpms-api-production.up.railway.app',
        description: 'Production (Railway)',
      },
      {
        url: 'http://localhost:5068',
        description: 'Local Development',
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
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { nullable: true },
            errors: { nullable: true },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
            errors: { nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis:
    process.env.NODE_ENV === 'production'
      ? ['./dist/modules/**/routes/*.js']
      : ['./src/modules/**/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FURPMS API Documentation',
    }),
  );
  app.get('/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
