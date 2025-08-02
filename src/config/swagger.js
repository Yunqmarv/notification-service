const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

class SwaggerService {
    constructor() {
        this.swaggerSpec = null;
        this.setupSwagger();
    }

    setupSwagger() {
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'Notification Microservice API',
                    version: '1.0.0',
                    description: 'Enterprise-grade notification microservice with MongoDB, Redis, and comprehensive analytics',
                    contact: {
                        name: 'API Support',
                        email: 'support@yourapp.com'
                    }
                },
                servers: [
                    {
                        url: process.env.API_URL || 'http://localhost:3000',
                        description: 'Development server'
                    }
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT'
                        },
                        apiKeyAuth: {
                            type: 'apiKey',
                            in: 'header',
                            name: 'x-api-key',
                            description: 'API key for system/admin authentication'
                        }
                    }
                },
                security: [
                    {
                        bearerAuth: []
                    }
                ]
            },
            apis: [
                './src/routes/*.js',
                './src/models/*.js'
            ]
        };

        this.swaggerSpec = swaggerJSDoc(options);
    }

    setup(app) {
        // Serve swagger docs
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerSpec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Notification API Documentation'
        }));

        // Serve swagger spec as JSON
        app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(this.swaggerSpec);
        });
    }

    getSpec() {
        return this.swaggerSpec;
    }
}

module.exports = new SwaggerService();
