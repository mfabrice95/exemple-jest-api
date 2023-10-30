const express = require('express')
const auth_drivers_routes = require('./auth_drivers.routes')
const authRouter = express.Router()

authRouter.use('/drivers', auth_drivers_routes)

module.exports = authRouter