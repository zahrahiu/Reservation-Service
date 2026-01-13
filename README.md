# 🏨 Reservation Service – Microservice
## 📌 Description

Ce microservice assure la gestion des réservations dans une application de gestion hôtelière basée sur une architecture microservices et la méthodologie Domain-Driven Design (DDD).  
Il permet de créer, consulter, modifier et supprimer des réservations, tout en assurant la cohérence métier (dates, nombre de personnes, type de chambre, etc.). 

# 🛠️ Technologies utilisées

- Node.js
- Express.js
- MySQL
- Swagger (swagger-ui-express, swagger-jsdoc)
- Nodemon
- Postman (tests des API)

# 🚀 Installation et configuration
## 1️⃣ Initialisation du projet Node.js
```bash
npm init -y
```

# 2️⃣ Installation des dépendances essentielles
```bash
npm install express mysql2 dotenv body-parser
```

### Rôle des dépendances :

- express : framework web pour Node.js permettant de créer des API REST.
- mysql2 : permet la connexion et l’exécution des requêtes MySQL.
- dotenv : gestion des variables d’environnement (configuration sensible).
- body-parser : permet de parser les requêtes JSON entrantes.

## 3️⃣ Installation de Nodemon (en mode développement)
```bash
npm install -g nodemon
```

### Nodemon permet de redémarrer automatiquement le serveur lors des modifications du code.
### axios == OpenFeign
```bash
npm install axios
## Installer les packages supplémentaires nécessaires pour JWT et sécurité
```bash
Installer les packages supplémentaires nécessaires pour JWT et sécurité
```
## 4️⃣ Lancement de l’application
```bash
npm start
```
<img width="945" height="409" alt="image" src="https://github.com/user-attachments/assets/3d94f544-f1c5-4820-a8bc-8e64599810bc" />


### Le microservice sera accessible à l’adresse suivante :
```bash
http://localhost:3000
```

# 📄 Documentation API avec Swagger
## 5️⃣ Installation de Swagger
```bash
npm install swagger-ui-express swagger-jsdoc
```

### Accès à la documentation Swagger :
```bash
http://localhost:3000/api-docs
```

<img width="1912" height="681" alt="image" src="https://github.com/user-attachments/assets/c09fba99-44ba-481f-957a-01ec1f77c004" />

### Swagger permet :

La documentation complète de l’API.  
Le test direct des endpoints (GET, POST, PUT, DELETE).  

## 📌 Description rapide

- index.js : lance le serveur et charge les routes + Swagger
- db.js : gère la connexion MySQL
- routes/ : définit les endpoints de l’API
- controllers/ : contient la logique des opérations CRUD
- models/ : représente la structure des données
- package.json : configuration et dépendances Node.js

  ## lancement de server
  ```bash
  nodemon index.js   
  ```
