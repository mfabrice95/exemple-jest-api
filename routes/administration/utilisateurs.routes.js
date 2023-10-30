const express = require('express')
const utilisateurs_controller = require('../../controllers/administration/utilisateurs.controller')
const utilisateurs_routes = express.Router()

utilisateurs_routes.post("/", utilisateurs_controller.cretaeUser)
utilisateurs_routes.get("/", utilisateurs_controller.findAll)
utilisateurs_routes.get("/:id", utilisateurs_controller.findUtilisateur)
utilisateurs_routes.post("/detele_utilisateurs", utilisateurs_controller.deleteItems)

module.exports = utilisateurs_routes