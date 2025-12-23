const db = require("../db");
const Reservation = require("../models/reservationModel");

/**
 * GET ALL RESERVATIONS
 */
exports.getAll = (req, res) => {
    db.query("SELECT * FROM reservations", (err, results) => {
        if (err) return res.status(500).json(err);

        res.json({
            requestedBy: req.user.email,
            roles: req.user.roles,
            reservations: results
        });
    });
};

/**
 * GET RESERVATION BY ID
 */
exports.getById = (req, res) => {
    const { id } = req.params;

    db.query(
        "SELECT * FROM reservations WHERE idReservation = ?",
        [id],
        (err, results) => {
            if (err) return res.status(500).json(err);

            if (results.length === 0) {
                return res.status(404).json({ message: "Reservation not found" });
            }

            const reservation = new Reservation(results[0]);
            reservation.totalPrix = totalPrix(reservation);

            res.json(reservation);
        }
    );
};

/**
 * CREATE RESERVATION
 */
exports.create = (req, res) => {
    if (!verifierConditions(req.body)) {
        return res.status(400).json({ message: "Reservation invalide" });
    }

    const {
        client_id,
        chambre_id,
        dateDebut,
        dateFin,
        statut,
        nombrePersonnes,
        typeChambre,
        photoActeMariage
    } = req.body;

    db.query(
        `INSERT INTO reservations
         (client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            client_id,
            chambre_id,
            dateDebut,
            dateFin,
            statut,
            nombrePersonnes,
            typeChambre,
            photoActeMariage
        ],
        (err, result) => {
            if (err) return res.status(500).json(err);

            const reservation = new Reservation({
                idReservation: result.insertId,
                ...req.body
            });

            reservation.totalPrix = totalPrix(reservation);

            res.status(201).json({
                message: "Reservation created",
                createdBy: req.user.email, // JWT
                reservation
            });
        }
    );
};

/**
 * UPDATE RESERVATION
 */
exports.update = (req, res) => {
    const { id } = req.params;

    db.query(
        `UPDATE reservations SET
                                 client_id=?, chambre_id=?, dateDebut=?, dateFin=?, statut=?,
                                 nombrePersonnes=?, typeChambre=?, photoActeMariage=?
         WHERE idReservation=?`,
        [
            req.body.client_id,
            req.body.chambre_id,
            req.body.dateDebut,
            req.body.dateFin,
            req.body.statut,
            req.body.nombrePersonnes,
            req.body.typeChambre,
            req.body.photoActeMariage,
            id
        ],
        err => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Reservation updated",
                updatedBy: req.user.email
            });
        }
    );
};

/**
 * DELETE RESERVATION
 */
exports.delete = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM reservations WHERE idReservation=?",
        [id],
        err => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Reservation deleted",
                deletedBy: req.user.email
            });
        }
    );
};

/**
 * ANNULER RESERVATION
 */
exports.annuler = (req, res) => {
    const { id } = req.params;

    db.query(
        "UPDATE reservations SET statut=? WHERE idReservation=?",
        ["annulée", id],
        err => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Reservation annulée",
                annulledBy: req.user.email
            });
        }
    );
};

/**
 * LOGIQUE METIER
 */

function totalPrix(reservation) {
    let prix = 200;
    if (reservation.typeChambre === "Suite") prix = 500;
    if (reservation.typeChambre === "Deluxe") prix = 400;
    if (reservation.typeChambre === "Standard") prix = 300;

    const debut = new Date(reservation.dateDebut);
    const fin = new Date(reservation.dateFin);
    const nuits = (fin - debut) / (1000 * 60 * 60 * 24);

    return nuits * prix * reservation.nombrePersonnes;
}

function verifierConditions(reservation) {
    const debut = new Date(reservation.dateDebut);
    const fin = new Date(reservation.dateFin);

    if (fin <= debut) return false;
    if (reservation.nombrePersonnes > 4) return false;

    return true;
}
