const express = require('express')
const system_controller = require('../../controllers/system/system.controller')
const countries_routes = express.Router()

countries_routes.get('/', system_controller.findAllCountries)

module.exports = countries_routes