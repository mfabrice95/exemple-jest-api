const express = require("express")
const RESPONSE_CODES = require("../../constants/RESPONSE_CODES")
const RESPONSE_STATUS = require("../../constants/RESPONSE_STATUS")
const Validation = require("../../class/Validation")
const Utilisateur = require("../../models/Utitlisateur")
const UtilisateurUpload = require("../../class/uploads/UtilisateurUpload")
const IMAGES_DESTINATIONS = require("../../constants/IMAGES_DESTINATIONS")
const { Op } = require("sequelize")
const Syst_collines = require("../../models/Syst_collines")
const Syst_zones = require("../../models/Syst_zones")
const Syst_communes = require("../../models/Syst_communes")
const Syst_provinces = require("../../models/Syst_provinces")
/**
 * Permet de creer un utilisateur
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @author darcydev <darcy@mdiabox.bi>
 */
const cretaeUser = async (req, res) => {
          try {
                    const { nom, prenom, id_colline, date_naissance } = req.body
                    const files = req.files || {}
                    const { image } = files
                    const data = { ...req.body, ...req.files }
                    const validation = new Validation(data, {
                              nom: {
                                        required: true,
                                        length: [1, 255],
                                        alpha: true
                              },
                              prenom: {
                                        required: true,
                                        length: [1, 255],
                                        alpha: true
                              },
                              id_colline: {
                                        required: true,
                                        number: true,
                                        exists: "syst_collines,COLLINE_ID"
                              },
                              image: {
                                        required: true,
                                        image: 4000000
                              },
                              date_naissance: {
                                        required: true,
                                        date: true
                              }
                    })
                    await validation.run()
                    const isValid = await validation.isValidate()
                    if (!isValid) {
                              const errors = await validation.getErrors()
                              return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
                                        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
                                        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
                                        message: "Probleme de validation des donnees",
                                        result: errors
                              })
                    }
                    const utilisateurUpload = new UtilisateurUpload()
                    const { fileInfo } = await utilisateurUpload.upload(image, false)
                    const filename = `${req.protocol}://${req.get("host")}/${IMAGES_DESTINATIONS.utilisateurs}/${fileInfo.fileName}`
                    const user = await Utilisateur.create({
                              nom, prenom, id_colline, image: filename, date_naissance
                    })
                    res.status(RESPONSE_CODES.CREATED).json({
                              statusCode: RESPONSE_CODES.CREATED,
                              httpStatus: RESPONSE_STATUS.CREATED,
                              message: "L'utilisateur a ete cree avec succes",
                              result: user
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

/**
 * Permet de creer un utilisateur
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @author darcydev <darcy@mdiabox.bi>
 */
const findAll  = async (req, res) => {
          try {
                    const { rows = 10, first = 0, sortField, sortOrder, search } = req.query
                    // const utilisateurs = await Utilisateur.findAll({
                    //           limit,
                    //           offset,
                    //           attributes: ["nom"],
                    //           where: {
                    //                     nom: "darcy"
                    //           }
                    // })
                    const defaultSortField = "date_insertion"
                    const defaultSortDirection = "DESC"
                    const sortColumns = {
                              utilisateurs: {
                                        as: "utilisateurs",
                                        fields: {
                                                  date_naissance: 'date_naissance',
                                                  nom: 'nom',
                                                  prenom: 'prenom',
                                                  date_insertion: 'date_insertion',
                                        }
                              },
                              syst_provinces: {
                                        as: "province",
                                        fields: {
                                                  PROVINCE_NAME: 'PROVINCE_NAME'
                                        }
                              },
                              syst_communes: {
                                        as: "commune",
                                        fields: {
                                                  COMMUNE_NAME: 'COMMUNE_NAME'
                                        }
                              },
                              syst_zones: {
                                        as: "zone",
                                        fields: {
                                                  ZONE_NAME: 'ZONE_NAME'
                                        }
                              },
                              syst_collines: {
                                        as: "colline",
                                        fields: {
                                                  COLLINE_NAME: 'COLLINE_NAME'
                                        }
                              }
                    }

                    var orderColumn, orderDirection

                    // sorting
                    var sortModel
                    if(sortField) {
                              for(let key in sortColumns) {
                                        if(sortColumns[key].fields.hasOwnProperty(sortField)) {
                                                  sortModel = {
                                                            model: key,
                                                            as: sortColumns[key].as
                                                  }
                                                  orderColumn = sortColumns[key].fields[sortField]
                                                  break
                                        }
                              }
                    }
                    if(!orderColumn || !sortModel) {
                              orderColumn = sortColumns.utilisateurs.fields.date_insertion
                              sortModel = {
                                        model: 'utilisateurs',
                                        as: sortColumns.utilisateurs.as
                              }
                    }

                    // ordering
                    if(sortOrder == 1) {
                              orderDirection = 'ASC'
                    } else if(sortOrder == -1) {
                              orderDirection = 'DESC'
                    } else {
                              orderDirection = defaultSortDirection
                    }

                    // searching
                    const globalSearchColumns = [
                              "nom",
                              'prenom',
                              '$colline->zone->commune->province.PROVINCE_NAME$',
                              '$colline->zone->commune.COMMUNE_NAME$',
                              '$colline->zone.ZONE_NAME$',
                              '$colline.COLLINE_NAME$',
                    ]
                    var globalSearchWhereLike = {}
                    if(search && search.trim() != "") {
                              const searchWildCard = {}
                              globalSearchColumns.forEach(column => {
                                        searchWildCard[column] = {
                                                  [Op.substring]: search
                                        }
                              })
                              globalSearchWhereLike = {
                                        [Op.or]: searchWildCard
                              }
                    }
                    const result = await Utilisateur.findAndCountAll({
                              limit: parseInt(rows),
                              offset: parseInt(first),
                              order: [
                                        [sortModel, orderColumn, orderDirection]
                              ],
                              where: {
                                        ...globalSearchWhereLike,
                              },
                              include: {
                                        model: Syst_collines,
                                        as: 'colline',
                                        required: false,
                                        attributes: ['COLLINE_ID', 'COLLINE_NAME'],
                                        include: {
                                                  model: Syst_zones,
                                                  as: 'zone',
                                                  required: false,
                                                  include: {
                                                            model: Syst_communes,
                                                            as: 'commune',
                                                            required: false,
                                                            include: {
                                                                      model: Syst_provinces,
                                                                      as: 'province',
                                                                      required: false
                                                            }
                                                  }
                                        }
                              }
                              // attributes: ["nom"],
                              // where: {
                              //           nom: "darcy"
                              // }
                    })
                    res.status(RESPONSE_CODES.OK).json({
                              statusCode: RESPONSE_CODES.OK,
                              httpStatus: RESPONSE_STATUS.OK,
                              message: "Liste des utilisateurs",
                              result: {
                                        data: result.rows,
                                        totalRecords:result.count
                              }
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

const deleteItems = async (req, res) => {
          try {
                    const { ids } = req.body
                    const itemsIds = JSON.parse(ids)
                    await Utilisateur.destroy({
                              where: {
                                        id: {
                                                  [Op.in]: itemsIds
                                        }
                              }
                    })
                    res.status(RESPONSE_CODES.OK).json({
                              statusCode: RESPONSE_CODES.OK,
                              httpStatus: RESPONSE_STATUS.OK,
                              message: "Les elements ont ete supprimer avec success",
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

const findUtilisateur = async (req, res) => {
          try {
                    const { id } = req.params
                    const utilisateur = await Utilisateur.findOne({
                              where: {
                                        id
                              },
                              include: {
                                        model: Syst_collines,
                                        as: 'colline',
                                        required: false,
                                        attributes: ['COLLINE_ID', 'COLLINE_NAME'],
                                        include: {
                                                  model: Syst_zones,
                                                  as: 'zone',
                                                  required: false,
                                                  include: {
                                                            model: Syst_communes,
                                                            as: 'commune',
                                                            required: false,
                                                            include: {
                                                                      model: Syst_provinces,
                                                                      as: 'province',
                                                                      required: false
                                                            }
                                                  }
                                        }
                              }
                    })
                    if(utilisateur) {
                              res.status(RESPONSE_CODES.OK).json({
                                        statusCode: RESPONSE_CODES.OK,
                                        httpStatus: RESPONSE_STATUS.OK,
                                        message: "L'utilisateur",
                                        result: utilisateur
                              })
                    } else {
                              res.status(RESPONSE_CODES.NOT_FOUND).json({
                                        statusCode: RESPONSE_CODES.NOT_FOUND,
                                        httpStatus: RESPONSE_STATUS.NOT_FOUND,
                                        message: "L'utilisateur non trouve",
                              })
                    }
          } catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "Erreur interne du serveur, réessayer plus tard",
                    })
          }
}

module.exports = {
          cretaeUser,
          findAll,
          deleteItems,
          findUtilisateur
}