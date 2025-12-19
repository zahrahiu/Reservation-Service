const express = require('express');
const router = express.Router();
const controller = require('../controllers/reservationController');

router.get('/reservations', controller.getAll);
router.get('/reservations/:id', controller.getById);
router.post('/reservations', controller.create);
router.put('/reservations/:id', controller.update);
router.delete('/reservations/:id', controller.delete);
router.put('/reservations/:id/annuler', controller.annuler);

module.exports = router;
