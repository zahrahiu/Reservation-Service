const express = require("express");
const router = express.Router();
const controller = require("../controllers/reservationController");
const authMiddleware = require("../middlewares/auth");
const hasRole = require("../middlewares/hasRole");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Gestion des réservations
 */

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Récupérer toutes les réservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations
 */
router.get("/reservations", authMiddleware, controller.getAll);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Récupérer une réservation par ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 */
router.get("/reservations/:id", authMiddleware, controller.getById);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Créer une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    "/reservations",
    authMiddleware,
    hasRole("ADMIN"),
    controller.create
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Mettre à jour une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    "/reservations/:id",
    authMiddleware,
    hasRole("ADMIN"),
    controller.update
);

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Supprimer une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    "/reservations/:id",
    authMiddleware,
    hasRole("ADMIN"),
    controller.delete
);

/**
 * @swagger
 * /api/reservations/{id}/annuler:
 *   put:
 *     summary: Annuler une réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    "/reservations/:id/annuler",
    authMiddleware,
    controller.annuler
);

module.exports = router;
