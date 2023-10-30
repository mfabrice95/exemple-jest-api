const express = require('express');
const Validation = require('../../class/Validation');
const RESPONSE_CODES = require('../../constants/RESPONSE_CODES');
const RESPONSE_STATUS = require('../../constants/RESPONSE_STATUS');
// const drivers_model = require('../../models/app/users.model');
const { query } = require('../../utils/db');
const generateToken = require('../../utils/generateToken');
const md5 = require('md5');
const moment = require("moment");
const PROFILS = require('../../constants/PROFILS');
const generateCode = require('../../utils/generateCode');
const sendSMS = require('../../utils/sendSMS');
const IMAGES_DESTINATIONS = require('../../constants/IMAGES_DESTINATIONS');


const ECONET_PHONE_NUMBER_STARTS = ["79", "71", "76", "72"]
const LUMITEL_PHONE_NUMBER_STARTS = ["69", "61", "68", "67", "62", "65", "66"]
const ONAMOB_PHONE_NUMBER_STARTS = ["77"]
const VALID_PHONE_NUMBER_STARTS = [...ECONET_PHONE_NUMBER_STARTS, ...LUMITEL_PHONE_NUMBER_STARTS, ...ONAMOB_PHONE_NUMBER_STARTS]

/**
 * Répresente un code par défault à utiliser en cas de non envoir de OTP de vérification
 *  @type {Number}
 */
const DEFAULT_CODE = 1234

/**
 * 
 * @param {string} numero le numéro de téléphone à envoyer le numéro
 * @returns {string} le code envoyer sur ce numero
 */
const sendConfirmationCode = (numero) => {
          /**
           * Représente les deux chiffres qui commencent sur un numéro burundais
           *  @type  {string} 
           */
          const phoneStart = numero.substring(0, 2)

          // si c'est un numéro econet ou lumitel on génère un code aléatoire, sinon on ajoute le code 1234 par défault
          var code
          if ([...ECONET_PHONE_NUMBER_STARTS, ...LUMITEL_PHONE_NUMBER_STARTS].includes(phoneStart) && false) {
                    code = generateCode(4)
                    sendSMS(numero, `${code} est votre code de confirmation sur l'application Wasili`)
          } else {
                    code = DEFAULT_CODE
          }
          return code
}


/**
 * Permet de vérifier la connexion d'un rider
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} res 
 * @param {express.Response} res 
 */
const login = async (req, res) => {
          try {
                    const { USERNAME, MOT_DE_PASSE, PUSH_NOTIFICATION_TOKEN, DEVICE, LOCALE } = req.body;
                    const validation = new Validation(
                              req.body,
                              {
                                        USERNAME: "required",
                                        MOT_DE_PASSE:
                                        {
                                                  required: true,
                                        },
                              },
                              {
                                        MOT_DE_PASSE:
                                        {
                                                  required: "Mot de passe est obligatoire",
                                        },
                                        USERNAME: {
                                                  required: "L'email est obligatoire",
                                                  email: "Email invalide"
                                        }
                              }
                    );
                    await validation.run();
                    const isValid = await validation.isValidate()
                    const errors = await validation.getErrors()
                    if (!isValid) {
                              return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
                                        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
                                        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
                                        message: "Probleme de validation des donnees",
                                        result: errors
                              })
                    }
                    var user = (await drivers_model.findUserLogin(USERNAME))[0];
                    if (user) {
                              if (user.MOT_DE_PASSE == md5(MOT_DE_PASSE)) {
                                        const token = generateToken({ user: user.ID_DRIVER, ID_PROFIL: PROFILS.chauffeur }, 3 * 12 * 30 * 24 * 3600)
                                        const { MOT_DE_PASSE, ...other } = user
                                        if (PUSH_NOTIFICATION_TOKEN) {
                                                  const notification = (await query('SELECT ID_NOTIFICATION_TOKEN FROM driver_notification_tokens WHERE TOKEN = ? AND ID_DRIVER = ?', [PUSH_NOTIFICATION_TOKEN, user.ID_DRIVER]))[0]
                                                  if (notification) {
                                                            await query('UPDATE driver_notification_tokens SET DEVICE = ?, TOKEN = ?, LOCALE = ? WHERE ID_NOTIFICATION_TOKEN = ?', [DEVICE, PUSH_NOTIFICATION_TOKEN, LOCALE, notification.ID_NOTIFICATION_TOKEN]);
                                                  } else {
                                                            await query('INSERT INTO driver_notification_tokens(ID_DRIVER, DEVICE, TOKEN, LOCALE) VALUES(?, ?, ?, ?)', [user.ID_DRIVER, DEVICE, PUSH_NOTIFICATION_TOKEN, LOCALE]);
                                                  }
                                        }
                                        res.status(RESPONSE_CODES.CREATED).json({
                                                  statusCode: RESPONSE_CODES.CREATED,
                                                  httpStatus: RESPONSE_STATUS.CREATED,
                                                  message: "Vous êtes connecté avec succès",
                                                  result: {
                                                            ...other,
                                                            token
                                                  }
                                        })
                              } else {
                                        validation.setError('main', 'Identifiants incorrects')
                                        const errors = await validation.getErrors()
                                        res.status(RESPONSE_CODES.NOT_FOUND).json({
                                                  statusCode: RESPONSE_CODES.NOT_FOUND,
                                                  httpStatus: RESPONSE_STATUS.NOT_FOUND,
                                                  message: "Utilisateur n'existe pas",
                                                  result: errors
                                        })
                              }
                    } else {
                              validation.setError('main', 'Identifiants incorrects')
                              const errors = await validation.getErrors()
                              res.status(RESPONSE_CODES.NOT_FOUND).json({
                                        statusCode: RESPONSE_CODES.NOT_FOUND,
                                        httpStatus: RESPONSE_STATUS.NOT_FOUND,
                                        message: "Utilisateur n'existe pas",
                                        result: errors
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
/**
 * Permet de modifier le mot de passe d'un rider
 * @author NDAYIKENGURUKIYE Innocent <ndayikengurukiye.innocent@mediabox.bi>
 * @param {express.Request} res 
 * @param {express.Response} res 
 */
const changePassword = async (req, res) => {
          try {
                    const { ENCIEN_MOT_DE_PASSE, NOUVEAU_MOT_DE_PASSE } = req.body;
                    const validation = new Validation(
                              req.body,
                              {

                                        ENCIEN_MOT_DE_PASSE:
                                        {
                                                  required: true,
                                        },

                                        NOUVEAU_MOT_DE_PASSE:
                                        {
                                                  required: true,
                                        },
                              },
                              {
                                        ENCIEN_MOT_DE_PASSE:
                                        {
                                                  required: " Encien mot de passe est obligatoire",
                                        },
                                        NOUVEAU_MOT_DE_PASSE:
                                        {
                                                  required: " Nouveau mot de passe est obligatoire",
                                        },

                              }
                    );
                    await validation.run();
                    const isValid = await validation.isValidate()
                    const errors = await validation.getErrors()
                    if (!isValid) {
                              return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
                                        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
                                        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
                                        message: "Probleme de validation des donnees",
                                        result: errors
                              })
                    }
                    var user = (await drivers_model.findUserLogins())[0];
                    if (user) {
                              if (user.MOT_DE_PASSE == md5(ENCIEN_MOT_DE_PASSE)) {
                                        const nouveau = md5(NOUVEAU_MOT_DE_PASSE)
                                        await query('UPDATE drivers SET MOT_DE_PASSE=? WHERE ID_DRIVER =1', [nouveau]);
                                        res.status(RESPONSE_CODES.CREATED).json({
                                                  statusCode: RESPONSE_CODES.CREATED,
                                                  httpStatus: RESPONSE_STATUS.CREATED,
                                                  message: "modification du mot de passe avec succès",

                                        })
                              } else {
                                        validation.setError('main', 'Encien mot de passe incorrect')
                                        const errors = await validation.getErrors()
                                        res.status(RESPONSE_CODES.NOT_FOUND).json({
                                                  statusCode: RESPONSE_CODES.NOT_FOUND,
                                                  httpStatus: RESPONSE_STATUS.NOT_FOUND,
                                                  message: "Utilisateur n'existe pas",
                                                  result: errors
                                        })
                              }
                    } else {
                              validation.setError('main', 'Identifiants incorrects')
                              const errors = await validation.getErrors()
                              res.status(RESPONSE_CODES.NOT_FOUND).json({
                                        statusCode: RESPONSE_CODES.NOT_FOUND,
                                        httpStatus: RESPONSE_STATUS.NOT_FOUND,
                                        message: "Utilisateur n'existe pas",
                                        result: errors
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
/**
 * Permet de créer un drivers lors de l'authentification
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
const createDrivers = async (req, res) => {
          try {
                    const { NOM, PRENOM, EMAIL, USERNAME, MOT_DE_PASSE, DATE_NAISSANCE, PUSH_NOTIFICATION_TOKEN, DEVICE, LOCALE } = req.body
                    const { IMAGE } = req.files || {}
                    const validation = new Validation({ ...req.body, ...req.files },
                              {
                                        NOM:
                                        {
                                                  required: true,
                                        },
                                        PRENOM:
                                        {
                                                  required: true,
                                        },
                                        MOT_DE_PASSE:
                                        {
                                                  required: true,
                                        },
                                        IMAGE: {
                                                  image: 21000000
                                        },

                                        EMAIL:
                                        {
                                                  email: true,
                                                  unique: "drivers,EMAIL"
                                        }

                              },
                              {
                                        IMAGE: {
                                                  IMAGE: "La taille invalide"
                                        },
                                        NOM: {
                                                  required: "Le nom est obligatoire"
                                        },
                                        PRENOM: {
                                                  required: "Le prenom est obligatoire"
                                        },
                                        EMAIL: {
                                                  email: "Email invalide",
                                                  unique: "Email déjà utilisé"
                                        },
                                        MOT_DE_PASSE: {
                                                  required: "Le mot de passe est obligatoire"
                                        },
                              }
                    )
                    await validation.run();
                    const isValide = await validation.isValidate()
                    const errors = await validation.getErrors()
                    if (!isValide) {
                              return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
                                        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
                                        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
                                        message: "Probleme de validation des donnees",
                                        result: errors
                              })
                    }
                    const usersUpload = new DriverUpload()
                    var filename
                    if (IMAGE) {
                              const { fileInfo } = await usersUpload.upload(IMAGE, false)
                              filename = fileInfo.fileName
                    }
                    const { insertId: ID_DRIVER } = await drivers_model.createOne(
                              NOM,
                              PRENOM,
                              USERNAME ? USERNAME : null,
                              EMAIL ? EMAIL : null,
                              md5(MOT_DE_PASSE),
                              DATE_NAISSANCE ? moment(DATE_NAISSANCE).format("YYYY-MM-DD HH:mm:ss") : null,
                              filename ? filename : null
                    )
                    const user = (await drivers_model.findById(ID_DRIVER))[0]
                    const token = generateToken({ user: user.ID_DRIVER, ID_PROFIL: PROFILS.chauffeur }, 3 * 12 * 30 * 24 * 3600)
                    if (PUSH_NOTIFICATION_TOKEN) {
                              const notification = (await query('SELECT ID_NOTIFICATION_TOKEN FROM driver_notification_tokens WHERE TOKEN = ? AND ID_DRIVER = ?', [PUSH_NOTIFICATION_TOKEN, user.ID_DRIVER]))[0]
                              if (notification) {
                                        await query('UPDATE driver_notification_tokens SET DEVICE = ?, TOKEN = ?, LOCALE = ? WHERE ID_NOTIFICATION_TOKEN = ?', [DEVICE, PUSH_NOTIFICATION_TOKEN, LOCALE, notification.ID_NOTIFICATION_TOKEN]);
                              } else {
                                        await query('INSERT INTO driver_notification_tokens(ID_DRIVER, DEVICE, TOKEN, LOCALE) VALUES(?, ?, ?, ?)', [user.ID_DRIVER, DEVICE, PUSH_NOTIFICATION_TOKEN, LOCALE]);
                              }
                    }
                    res.status(RESPONSE_CODES.CREATED).json({
                              statusCode: RESPONSE_CODES.CREATED,
                              httpStatus: RESPONSE_STATUS.CREATED,
                              message: "Enregistrement est fait avec succès",
                              result: {
                                        ...user,
                                        token
                              }
                    })
          }
          catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "Enregistrement echoue",
                    })
          }
}

/**
 * Permet d'enregistrer le numero de telephone d'un driver et envoyer l'OTP
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} res 
 * @param {express.Response} res 
 */
const registerPhone = async (req, res) => {
          try {
                    const { tel, COUNTRY_ID } = req.body
                    const validation = new Validation({ ...req.body },
                              {
                                        tel: {
                                                  required: true,
                                        }
                              }, {
                              tel: {
                              }
                    }
                    )
                    const alreadyExists = (await query("SELECT ID_DRIVER, IS_OTP_CONFIRMED, MOT_DE_PASSE FROM drivers WHERE TELEPHONE = ?", [tel]))[0]
                    if (alreadyExists) {
                              if (alreadyExists.IS_OTP_CONFIRMED && alreadyExists.MOT_DE_PASSE) {
                                        validation.setError('tel', 'Numéro de téléphone déjà utilisé')
                              }
                    }
                    await validation.run();
                    const isValide = await validation.isValidate()
                    const errors = await validation.getErrors()
                    if (!isValide) {
                              return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
                                        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
                                        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
                                        message: "Numéro de téléphone déjà utilisé",
                                        result: errors
                              })
                    }
                    const otp = sendConfirmationCode(tel)
                    var ID_DRIVER
                    if (alreadyExists) {
                              await query("UPDATE drivers SET OTP = ? WHERE TELEPHONE = ?", [otp, tel])
                              ID_DRIVER = alreadyExists.ID_DRIVER
                    } else {
                              const { insertId } = await query("INSERT INTO drivers(TELEPHONE, OTP, COUNTRY_ID) VALUES(?, ?, ?)", [tel, otp, COUNTRY_ID])
                              ID_DRIVER = insertId
                    }
                    res.status(RESPONSE_CODES.CREATED).json({
                              statusCode: RESPONSE_CODES.CREATED,
                              httpStatus: RESPONSE_STATUS.CREATED,
                              message: "Enregistrement est fait avec succès",
                              result: {
                                        ID_DRIVER,
                                        TELEPHONE: tel
                              }
                    })
          }
          catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "Enregistrement echoue",
                    })
          }
}

/**
 * Permet de verifier si un code OTP est valide
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} req
 * @param {express.Response} res 
 */
const checkOtp = async (req, res) => {
          try {
                    const { code, tel, PUSH_NOTIFICATION_TOKEN, DEVICE, LOCALE } = req.body
                    const driver = (await query("SELECT ID_DRIVER FROM drivers WHERE TELEPHONE = ? AND OTP = ?", [tel, code]))[0]
                    if (driver) {
                              const token = generateToken({ user: driver.ID_DRIVER, ID_PROFIL: PROFILS.chauffeur }, 3 * 12 * 30 * 24 * 3600)
                              await query("UPDATE drivers SET IS_OTP_CONFIRMED = ?, DATE_CONFIRMATION_OTP = ? WHERE ID_DRIVER= ?", [1, moment(new Date()).format("YYYY-MM-DD HH:mm:ss"), driver.ID_DRIVER])
                              if (PUSH_NOTIFICATION_TOKEN) {
                                        const notification = (await query('SELECT ID_NOTIFICATION_TOKEN FROM driver_notification_tokens WHERE TOKEN = ? AND ID_DRIVER = ?', [PUSH_NOTIFICATION_TOKEN, driver.ID_DRIVER]))[0]
                                        if (notification) {
                                                  await query('UPDATE driver_notification_tokens SET DEVICE = ?, TOKEN = ?, LOCALE = ? WHERE ID_NOTIFICATION_TOKEN = ?', [DEVICE, PUSH_NOTIFICATION_TOKEN, LOCALE, notification.ID_NOTIFICATION_TOKEN]);
                                        } else {
                                                  await query('INSERT INTO driver_notification_tokens(ID_DRIVER, DEVICE, TOKEN, LOCALE) VALUES(?, ?, ?, ?)', [driver.ID_DRIVER, DEVICE, PUSH_NOTIFICATION_TOKEN, LOCALE]);
                                        }
                              }
                              res.status(RESPONSE_CODES.OK).json({
                                        statusCode: RESPONSE_CODES.OK,
                                        httpStatus: RESPONSE_STATUS.OK,
                                        message: "Code de confirmation valide",
                                        result: {
                                                  ...driver,
                                                  token
                                        }
                              })
                    } else {
                              res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                                        statusCode: RESPONSE_CODES.UNAUTHORIZED,
                                        httpStatus: RESPONSE_STATUS.UNAUTHORIZED,
                                        message: "Code de confirmation invalide",
                              })
                    }
          } catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "Enregistrement echoue",
                    })
          }
}

/**
 * Permet de modifier un drivers 
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} req
 * @param {express.Response} res 
 */
const updateFullDriversInfo = async (req, res) => {
          try {
                    const { ID_DRIVER } = req.params
                    const { personnalData: personnalDataStr, plaque, marque, modele, couleur } = req.body
                    const personnalData = JSON.parse(personnalDataStr)
                    const { IMAGE, cni, permis, conduite, photoVehicule, photoCarteRose, photoAssurance, photoControleTechnique } = req.files || {}
                    const validation = new Validation({ ...req.body, ...req.files },
                              {
                                        NOM:
                                        {
                                                  required: true,
                                        },
                                        PRENOM:
                                        {
                                                  required: true,
                                        },
                                        MOT_DE_PASSE:
                                        {
                                                  required: true,
                                        },
                                        IMAGE: {
                                                  image: 21000000
                                        },

                                        EMAIL:
                                        {
                                                  email: true,
                                                  // unique: "drivers,EMAIL"
                                        }

                              },
                              {
                                        IMAGE: {
                                                  IMAGE: "La taille invalide"
                                        },
                                        NOM: {
                                                  required: "Le nom est obligatoire"
                                        },
                                        PRENOM: {
                                                  required: "Le prenom est obligatoire"
                                        },
                                        EMAIL: {
                                                  email: "Email invalide",
                                                  // unique: "Email déjà utilisé"
                                        },
                                        MOT_DE_PASSE: {
                                                  required: "Le mot de passe est obligatoire"
                                        },
                              }
                    )
                    await validation.run();
                    const isValide = await validation.isValidate()
                    const errors = await validation.getErrors()
                    if (false) {
                              return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
                                        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
                                        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
                                        message: "Probleme de validation des donnees",
                                        result: errors
                              })
                    }
                    const driverUpload = new DriverUpload()
                    var filename, PHOTO_CNI, PHOTO_PERMIS, PHOTO_BONNE_CONDUITE
                    if (IMAGE) {
                              const { fileInfo } = await driverUpload.upload(IMAGE, false)
                              filename = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    if (cni) {
                              const { fileInfo } = await driverUpload.upload(cni, false)
                              PHOTO_CNI = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    if (permis) {
                              const { fileInfo } = await driverUpload.upload(permis, false)
                              PHOTO_PERMIS = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    if (conduite) {
                              const { fileInfo } = await driverUpload.upload(conduite, false)
                              PHOTO_BONNE_CONDUITE = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    var PHOTO_CARTE_ROSE, PHOTO_ASSURANCE, PHOTO_CONTROLE_TECHNIQUE, PHOTO_VEHICULE
                    if (photoVehicule) {
                              const { fileInfo } = await driverUpload.upload(photoVehicule, false)
                              PHOTO_VEHICULE = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    if (photoCarteRose) {
                              const { fileInfo } = await driverUpload.upload(photoCarteRose, false)
                              PHOTO_CARTE_ROSE = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    if (photoAssurance) {
                              const { fileInfo } = await driverUpload.upload(photoAssurance, false)
                              PHOTO_ASSURANCE = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    if (photoControleTechnique) {
                              const { fileInfo } = await driverUpload.upload(photoControleTechnique, false)
                              PHOTO_CONTROLE_TECHNIQUE = `${req.protocol}://${req.get("host")}${IMAGES_DESTINATIONS.drivers}/${fileInfo.fileName}`
                    }
                    const { insertId: ID_VEHICULE } = await query(`
                    INSERT INTO vehicules(
                              ID_DRIVER,
                              NUMERO_PLAQUE,
                              PHOTO_CARTE_ROSE,
                              PHOTO_ASSURANCE,
                              PHOTO_CONTROLE_TECHNIQUE,
                              PHOTO_VEHICULE,
                              MARQUE,
                              MODELE,
                              COULEUR)
                              VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [ID_DRIVER, plaque, PHOTO_CARTE_ROSE, PHOTO_ASSURANCE, PHOTO_CONTROLE_TECHNIQUE, PHOTO_VEHICULE, marque, modele, couleur])
                    await drivers_model.updateOne(
                              personnalData.nom,
                              personnalData.prenom,
                              personnalData.username ? personnalData.username : null,
                              personnalData.email ? personnalData.email : null,
                              md5(personnalData.password),
                              personnalData.naissance ? moment(personnalData.naissance).format("YYYY-MM-DD HH:mm:ss") : null,
                              filename ? filename : null,
                              personnalData.gender,
                              PHOTO_CNI, PHOTO_PERMIS, PHOTO_BONNE_CONDUITE,
                              0,
                              ID_VEHICULE,
                              ID_DRIVER,
                    )
                    const other = (await query('SELECT TELEPHONE FROM drivers WHERE ID_DRIVER = ?', [ID_DRIVER]))[0]
                    const driver = {
                              ID_DRIVER,
                              NOM: personnalData.nom,
                              PRENOM: personnalData.prenom,
                              USERNAME: personnalData.username ? personnalData.username : null,
                              EMAIL: personnalData.email ? personnalData.email : null,
                              DATE_NAISSANCE: personnalData.naissance ? moment(personnalData.naissance).format("YYYY-MM-DD HH:mm:ss") : null,
                              IMAGE: filename ? filename : null,
                              GENRE: personnalData.gender,
                              PHOTO_CNI,
                              PHOTO_PERMIS,
                              PHOTO_BONNE_CONDUITE,
                              IS_ACTIVE: 0,
                              ...other
                    }
                    const vehicule = {
                              ID_VEHICULE,
                              ID_DRIVER,
                              NUMERO_PLAQUE: plaque,
                              PHOTO_CARTE_ROSE,
                              PHOTO_ASSURANCE,
                              PHOTO_CONTROLE_TECHNIQUE,
                              PHOTO_VEHICULE,
                              MARQUE: marque,
                              MODELE: modele,
                              COULEUR: couleur
                    }
                    res.status(RESPONSE_CODES.CREATED).json({
                              statusCode: RESPONSE_CODES.CREATED,
                              httpStatus: RESPONSE_STATUS.CREATED,
                              message: "modification  est fait avec succès",
                              result: {
                                        ...driver,
                                        vehicules: [vehicule]
                              }
                    })

          } catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "modification echoue",
                    })
          }
}

/**
 * Permet de modifier un drivers 
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @param {express.Request} req
 * @param {express.Response} res 
 */
const getConnectedDriver = async (req, res) => {
          try {
                    var sqlQuery = `
                    SELECT 
                              ID_DRIVER,
                              NOM,
                              PRENOM,
                              USERNAME,
                              EMAIL,
                              DATE_NAISSANCE,
                              IMAGE,
                              GENRE,
                              PHOTO_CNI,
                              PHOTO_PERMIS,
                              PHOTO_BONNE_CONDUITE,
                              IS_ACTIVE,
                              TELEPHONE
                    FROM drivers
                              WHERE ID_DRIVER = ?
                    `
                    const driver = (await query(sqlQuery, [req.userId]))[0]
                    if (!driver) {
                              return res.status(RESPONSE_CODES.NOT_FOUND).json({
                                        statusCode: RESPONSE_CODES.OK,
                                        httpStatus: RESPONSE_STATUS.NOT_FOUND,
                                        message: "Chauffeur non trouve",
                                        result: null
                              })
                    }
                    const vehicules = await query("SELECT * FROM vehicules WHERE ID_DRIVER = ?", [driver.ID_DRIVER])
                    res.status(RESPONSE_CODES.OK).json({
                              statusCode: RESPONSE_CODES.OK,
                              httpStatus: RESPONSE_STATUS.OK,
                              message: "Informations du chauffeur",
                              result: {
                                        ...driver,
                                        vehicules
                              }
                    })
          } catch (error) {
                    console.log(error)
                    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
                              statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
                              httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
                              message: "modification echoue",
                    })
          }
}

/**
 * Supprimer le push token de l'utilisateur our n'est plus recevoit des notificaitons
 * @author Dukizwe Darcie <darcy@mediabox.bi>
 * @date 03/05/2023
 * @param {express.Request} req
 * @param {express.Response} res
 */
const logOutDriver = async (req, res) => {
          try {
                    const { PUSH_NOTIFICATION_TOKEN } = req.body
                    await query("UPDATE drivers SET EN_LIGNE = 0 WHERE ID_DRIVER = ?", [req.userId])
                    await query("DELETE FROM driver_notification_tokens WHERE ID_DRIVER = ? AND TOKEN = ?", [req.userId, PUSH_NOTIFICATION_TOKEN])
                    res.status(RESPONSE_CODES.OK).json({
                              statusCode: RESPONSE_CODES.OK,
                              httpStatus: RESPONSE_STATUS.OK,
                              message: "Utilisateur deconnecte avec succes",
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

module.exports = {
          login,
          createDrivers,
          updateFullDriversInfo,
          registerPhone,
          checkOtp,
          getConnectedDriver,
          sendConfirmationCode,
          logOutDriver,
          changePassword
}