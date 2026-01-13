const db = require("../db");
const Reservation = require("../models/reservationModel");
const axios = require("axios");

/**
 * GET ALL RESERVATIONS
 */
exports.getAll = async (req, res) => {
    db.query("SELECT * FROM reservations", async (err, results) => {
        if (err) return res.status(500).json(err);

        try {
            const reservations = await Promise.all(results.map(async r => {
                // 🏨 get room
                let chambre = {};
                try {
                    const chambreRes = await axios.get(`http://localhost:8093/rooms/${r.chambre_id}`, {
                        headers: { Authorization: req.headers.authorization }
                    });
                    chambre = chambreRes.data;
                } catch (err) {
                    console.warn("Room service error:", err.message);
                }

                // 👤 get client
                let client = {};
                try {
                    const clientRes = await axios.get(`http://localhost:8088/clients/${r.client_id}`, {
                        headers: { Authorization: req.headers.authorization }
                    });
                    client = clientRes.data;
                } catch (err) {
                    console.warn("Client service error:", err.message);
                }

                return {
                    ...r,
                    client,
                    chambre,
                };
            }));

            res.json({
                requestedBy: req.user?.email,
                roles: req.user?.roles,
                reservations
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur fetching reservations", error: error.message });
        }
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


exports.update = async (req, res) => {
    const { id } = req.params;

    try {
        // 1️⃣ Get existing reservation
        const [rows] = await db.promise().query(
            "SELECT * FROM reservations WHERE idReservation=?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        const reservation = rows[0];

        // 2️⃣ Prepare updated data (partial update)
        const updatedData = {
            client_id: req.body.client_id !== undefined ? req.body.client_id : reservation.client_id,
            chambre_id: req.body.chambre_id !== undefined ? req.body.chambre_id : reservation.chambre_id,
            dateDebut: req.body.dateDebut !== undefined ? req.body.dateDebut : reservation.dateDebut,
            dateFin: req.body.dateFin !== undefined ? req.body.dateFin : reservation.dateFin,
            statut: req.body.statut !== undefined ? req.body.statut : reservation.statut,
            nombrePersonnes: req.body.nombrePersonnes !== undefined ? req.body.nombrePersonnes : reservation.nombrePersonnes,
            typeChambre: req.body.typeChambre !== undefined ? req.body.typeChambre : reservation.typeChambre,
            photoActeMariage: req.body.photoActeMariage !== undefined ? req.body.photoActeMariage : reservation.photoActeMariage
        };

        // 3️⃣ Update DB
        await db.promise().query(
            `UPDATE reservations SET
                client_id=?, chambre_id=?, dateDebut=?, dateFin=?, statut=?,
                nombrePersonnes=?, typeChambre=?, photoActeMariage=?
             WHERE idReservation=?`,
            [
                updatedData.client_id,
                updatedData.chambre_id,
                updatedData.dateDebut,
                updatedData.dateFin,
                updatedData.statut,
                updatedData.nombrePersonnes,
                updatedData.typeChambre,
                updatedData.photoActeMariage,
                id
            ]
        );

        res.json({
            message: "Reservation updated",
            updatedBy: req.user.email,
            reservation: updatedData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message });
    }
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
 * GET RESERVATIONS BY CLIENT
 */
exports.getByClient = async (req, res) => {
    try {
        console.log("User from JWT:", req.user); // check userId w roles
        const clientId = parseInt(req.user.userId);
        console.log("Client ID from JWT:", clientId);

        const [rows] = await db.promise().query(
            "SELECT idReservation, chambre_id, client_id, dateDebut, dateFin, statut, totalPrix FROM reservations WHERE client_id = ? ORDER BY dateDebut DESC",
            [clientId]
        );
        console.log("Rows fetched from DB:", rows);

        if (rows.length === 0) {
            return res.status(200).json({ message: "Aucune réservation trouvée", reservations: [] });
        }

        const reservations = await Promise.all(rows.map(async r => {
            let chambre = {};
            let client = {};

            try {
                const chambreRes = await axios.get(`http://localhost:8093/rooms/${r.chambre_id}`, {
                    headers: { Authorization: req.headers.authorization }
                });
                chambre = chambreRes.data;
            } catch (err) {
                console.warn("Erreur chambre:", err.message);
            }
            return { ...r, chambre };
        }));

        res.json({ clientId, reservations });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur interne", error: error.message });
    }
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

