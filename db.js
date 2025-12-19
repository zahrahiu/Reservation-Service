const mysql = require('mysql2');

// connexion بدون database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

// connect
connection.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL server");

    // 1️⃣ create database if not exists
    connection.query(
        'CREATE DATABASE IF NOT EXISTS hotel_reservation',
        (err) => {
            if (err) throw err;
            console.log("Database ready");

            // 2️⃣ use database
            connection.changeUser({ database: 'hotel_reservation' }, err => {
                if (err) throw err;

                // 3️⃣ create table
                createTables();
            });
        }
    );
});

// function create tables
function createTables() {
    const reservationTable = `
        CREATE TABLE IF NOT EXISTS reservations (
            idReservation INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT NOT NULL,
            chambre_id INT NOT NULL,
            dateDebut DATE NOT NULL,
            dateFin DATE NOT NULL,
            statut VARCHAR(50),
            nombrePersonnes INT,
            typeChambre VARCHAR(50),
            photoActeMariage VARCHAR(255)
        )
    `;

    connection.query(reservationTable, err => {
        if (err) throw err;
        console.log("Table reservations ready");
    });
}

module.exports = connection;
