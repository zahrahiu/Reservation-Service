class Reservation {
    constructor({
                    idReservation,
                    client_id,
                    chambre_id,
                    dateDebut,
                    dateFin,
                    statut,
                    nombrePersonnes,
                    typeChambre,
                    photoActeMariage
                }) {
        this.idReservation = idReservation;
        this.client_id = client_id;
        this.chambre_id = chambre_id;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.statut = statut;
        this.nombrePersonnes = nombrePersonnes;
        this.typeChambre = typeChambre;
        this.photoActeMariage = photoActeMariage;
    }
}

module.exports = Reservation;
