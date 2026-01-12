const express = require('express');
const bodyParser = require('body-parser');
const reservationRoutes = require('./routes/reservation');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors'); // <-- import cors

const app = express();
app.use(bodyParser.json());

// ✅ CORS
app.use(cors({
    origin: 'http://localhost:4200', // <-- Angular frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Reservation Microservice',
            version: '1.0.0'
        },
        servers: [{ url: 'http://localhost:3000/api' }]
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', reservationRoutes);

app.listen(3000, () => {
    console.log('Reservation microservice running on port 3000');
});
