const express = require('express');
const bodyParser = require('body-parser');
const reservationRoutes = require('./routes/reservation');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(bodyParser.json());

// Swagger configuration
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Reservation Microservice API",
            version: "1.0.0",
            description: "API pour gérer les réservations d'hôtel, avec toutes les fonctions spéciales",
        },
        servers: [
            { url: "http://localhost:3000/api" }
        ]
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', reservationRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Reservation microservice running on port ${PORT}`);
});
