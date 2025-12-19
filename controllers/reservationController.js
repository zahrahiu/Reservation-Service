const db = require('../db');

// GET all
exports.getAll = (req, res) => {
    db.query('SELECT * FROM reservations', (err, results) => {
        if(err) return res.status(500).json(err);
        res.json(results);
    });
};

// GET by id
exports.getById = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM reservations WHERE idReservation = ?', [id], (err, results) => {
        if(err) return res.status(500).json(err);
        if(results.length === 0) return res.status(404).json({ message: "Reservation not found" });
        const reservation = results[0];
        reservation.totalPrix = totalPrix(reservation); // calcul totalPrix
        res.json(reservation);
    });
};

// POST create
exports.create = (req, res) => {
    if(!verifierConditions(req.body)) return res.status(400).json({ message: "Reservation invalide" });

    const { client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage } = req.body;
    db.query(
        'INSERT INTO reservations (client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage],
        (err, results) => {
            if(err) return res.status(500).json(err);
            const reservation = { idReservation: results.insertId, ...req.body };
            reservation.totalPrix = totalPrix(reservation);
            res.json({ message: 'Reservation created', reservation });
        }
    );
};

// PUT update
exports.update = (req, res) => {
    const { id } = req.params;
    const { client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage } = req.body;
    db.query(
        'UPDATE reservations SET client_id=?, chambre_id=?, dateDebut=?, dateFin=?, statut=?, nombrePersonnes=?, typeChambre=?, photoActeMariage=? WHERE idReservation=?',
        [client_id, chambre_id, dateDebut, dateFin, statut, nombrePersonnes, typeChambre, photoActeMariage, id],
        (err) => {
            if(err) return res.status(500).json(err);
            res.json({ message: 'Reservation updated' });
        }
    );
};

// DELETE
exports.delete = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM reservations WHERE idReservation=?', [id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ message: 'Reservation deleted' });
    });
};

// ANNULER
exports.annuler = (req, res) => {
    const { id } = req.params;
    db.query('UPDATE reservations SET statut = ? WHERE idReservation=?', ['annulée', id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ message: 'Reservation annulée' });
    });
};

// FONCTIONS internes
function totalPrix(reservation) {
    let prixParNuit = 0;
    switch(reservation.typeChambre) {
        case 'Suite': prixParNuit = 500; break;
        case 'Deluxe': prixParNuit = 400; break;
        case 'Standard': prixParNuit = 300; break;
        default: prixParNuit = 200;
    }
    const debut = new Date(reservation.dateDebut);
    const fin = new Date(reservation.dateFin);
    const nbNuits = (fin - debut)/(1000*60*60*24);
    return nbNuits * prixParNuit * reservation.nombrePersonnes;
}

function verifierConditions(reservation) {
    const today = new Date();
    const debut = new Date(reservation.dateDebut);
    const fin = new Date(reservation.dateFin);
    if(debut < today) return false;
    if(fin <= debut) return false;
    if(reservation.nombrePersonnes > 4) return false; // exemple capacité max
    return true;
}
