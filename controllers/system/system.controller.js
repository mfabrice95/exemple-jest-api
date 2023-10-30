const express = require('express')
const RESPONSE_CODES = require('../../constants/RESPONSE_CODES')
const RESPONSE_STATUS = require('../../constants/RESPONSE_STATUS')
const { query } = require('../../utils/db')

/**
 * Permet de recuperer tous les pays
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
const findAllCountries = async (req, res) => {
          try {
                    const countries = await query('SELECT COUNTRY_ID, CommonName, `ITU-T_Telephone_Code` FROM countries ORDER BY CommonName')
                    res.status(RESPONSE_CODES.OK).json({
                              statusCode: RESPONSE_CODES.OK,
                              httpStatus: RESPONSE_STATUS.OK,
                              message: "Liste de tous les pays",
                              result: countries
                    })
          } catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "Erreur interne du serveur, réessayer plus tard",
                    })
          }
}

const getProvinces = async (req, res) => {
          try {
                    const provinces = await query('SELECT * FROM syst_provinces ORDER BY PROVINCE_NAME')
                    res.status(200).json(provinces)
          } catch (error)  {
                    console.log(error)
                    res.status(500).send('Server error')
          }
}

const getCommunes = async (req, res) => {
          try {
                    const { provinceId } = req.params
                    const communes = await query('SELECT * FROM syst_communes WHERE PROVINCE_ID = ? ORDER BY COMMUNE_NAME', [provinceId])
                    res.status(200).json(communes)
          } catch (error)  {
                    console.log(error)
                    res.status(500).send('Server error')
          }
}

const getZones = async (req, res) => {
          try {
                    const { communeId } = req.params
                    const communes = await query('SELECT * FROM syst_zones WHERE COMMUNE_ID = ? ORDER BY ZONE_NAME', [communeId])
                    res.status(200).json(communes)
          } catch (error)  {
                    console.log(error)
                    res.status(500).send('Server error')
          }
}

const getCollines = async (req, res) => {
          try {
                    const { zoneId } = req.params
                    const collines = await query('SELECT * FROM syst_collines WHERE ZONE_ID = ? ORDER BY COLLINE_NAME', [zoneId])
                    res.status(200).json(collines)
          } catch (error)  {
                    console.log(error)
                    res.status(500).send('Server error')
          }
}
const getAvenues = async (req, res) => {
          try {
                    const { collineId } = req.params
                    const avenues = await query('SELECT * FROM syst_avenue WHERE COLLINE_ID = ? ORDER BY AVENUE_NAME', [collineId])
                    res.status(200).json(avenues)
          } catch (error)  {
                    console.log(error)
                    res.status(500).send('Server error')
          }
}


module.exports = {
          findAllCountries,
          getProvinces,
          getCommunes,
          getZones,
          getCollines,
          getAvenues
}