const db = require("../db");
const Reservation = require("../models/reservationModel");
const axios = require("axios");

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
exports.getById = async (req, res) => {
    const { id } = req.params;

    db.query(
        "SELECT * FROM reservations WHERE idReservation = ?",
        [id],
        async (err, results) => {
            if (err) return res.status(500).json(err);

            if (results.length === 0) {
                return res.status(404).json({ message: "Reservation not found" });
            }

            const reservation = new Reservation(results[0]);

            try {
                // 🏨 Chambre (Flask)
                const chambreResponse = await axios.get(
                    `http://localhost:8093/rooms/${reservation.chambre_id}`,
                    {
                        headers: {
                            Authorization: req.headers.authorization
                        }
                    }
                );

                reservation.chambre = chambreResponse.data;

                // 👤 Client lié à la réservation (Auth / Client Service)
                const clientResponse = await axios.get(
                    `http://localhost:8088/clients/${reservation.client_id}`,
                    {
                        headers: {
                            Authorization: req.headers.authorization
                        }
                    }
                );

                reservation.client = clientResponse.data;

            } catch (error) {
                return res.status(500).json({
                    message: "Erreur lors de l’agrégation des données",
                    error: error.message
                });
            }

            reservation.totalPrix = totalPrix(reservation);

            res.json(reservation);
        }
    );
};



/**
 * CREATE RESERVATION

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
 */
exports.create = async (req, res) => {
    try {
        if (!verifierConditions(req.body)) {
            return res.status(400).json({ message: "Reservation invalide" });
        }

        const user = req.user;
        let clientId = user.userId;
        let statut = "pending";

        if (user.roles.includes("ADMIN")) {
            if (!req.body.client_id)
                return res.status(400).json({ message: "Admin doit fournir client_id" });
            clientId = req.body.client_id;
            statut = req.body.statut || "pending";
        }

        const { chambre_id, dateDebut, dateFin, nombrePersonnes, photoActeMariage } = req.body;

        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);

        // 🏨 Get room info
        const roomResponse = await axios.get(`http://localhost:8093/rooms/${chambre_id}`, {
            headers: { Authorization: req.headers.authorization }
        });

        const room = roomResponse.data;

        if (!room || !room.prix || !room.type) {
            return res.status(400).json({ message: "Chambre introuvable ou données manquantes" });
        }

        // 📝 Calculate totalPrix
        const nuits = (fin - debut) / (1000 * 60 * 60 * 24);
        const totalPrix = nuits * room.prix ;

        // 💾 Insert reservation (typeChambre from room)
        const [result] = await db.promise().query(
            `INSERT INTO reservations
             (client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage, totalPrix)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientId, chambre_id, debut, fin, statut, nombrePersonnes, room.type, photoActeMariage, totalPrix]
        );

        const reservation = new Reservation({
            idReservation: result.insertId,
            client_id: clientId,
            chambre_id,
            dateDebut: debut,
            dateFin: fin,
            statut,
            nombrePersonnes,
            typeChambre: room.type,
            photoActeMariage,
            totalPrix
        });

        res.status(201).json({
            message: "Reservation created",
            createdBy: user.email,
            reservation
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur interne", error: error.message });
    }
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
