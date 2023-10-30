const express = require('express')
const countries_routes = require('./countries.routes')
const { generateMrz, getProvinces, getCommunes, getCollines, getZones, getAvenues } = require('../../controllers/system/system.controller')
const systemRouter = express.Router()

systemRouter.use('/countries', countries_routes)
systemRouter.get('/provinces', getProvinces)
systemRouter.get('/communes/:provinceId', getCommunes)
systemRouter.get('/zones/:communeId', getZones)
systemRouter.get('/collines/:zoneId', getCollines)
systemRouter.get('/avenues/:collineId', getAvenues)

module.exports = systemRouter