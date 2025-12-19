const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       properties:
 *         idReservation:
 *           type: integer
 *         client_id:
 *           type: integer
 *         chambre_id:
 *           type: integer
 *         dateDebut:
 *           type: string
 *           format: date
 *         dateFin:
 *           type: string
 *           format: date
 *         statut:
 *           type: string
 *         nombrePersonnes:
 *           type: integer
 *         typeChambre:
 *           type: string
 *         photoActeMariage:
 *           type: string
 *         totalPrix:
 *           type: number
 */

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations
 *     responses:
 *       200:
 *         description: List of reservations
 */
router.get('/reservations', reservationController.getAll);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservation detail
 */
router.get('/reservations/:id', reservationController.getById);

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       200:
 *         description: Reservation created
 */
router.post('/reservations', reservationController.create);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Update a reservation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       200:
 *         description: Reservation updated
 */
router.put('/reservations/:id', reservationController.update);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Delete a reservation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservation deleted
 */
router.delete('/reservations/:id', reservationController.delete);

/**
 * @swagger
 * /reservations/{id}/annuler:
 *   put:
 *     summary: Annuler une reservation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservation annulée
 */
router.put('/reservations/:id/annuler', reservationController.annuler);

module.exports = router;
