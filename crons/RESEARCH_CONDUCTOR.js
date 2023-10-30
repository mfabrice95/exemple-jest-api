const IDS_COURSE_STATUS = require( "../constants/IDS_COURSE_STATUS")
const TIMING = require("../constants/TIMING")
const {findDrivers} = require("../controllers/course/courses.controller")
const { query } = require("../utils/db")


/**
 * Cela présente le nombre de seconde que le chauffeur va voir pour accepter la demande
 * @author Dukizwe Darcy <darcy@mediabox.bi>
 */
const TIME_TO_ACCEPT = TIMING.TIME_TO_ACCEPT

/**
 * Le temps additionnel pour accepter la demande
 * @author Dukizwe Darcy <darcy@mediabox.bi>
 */
const ADDITIONAL_SECONDS = TIMING.ADDITIONAL_SECONDS

/**
 * Un cron qui écoute les demandes de chaffeur qui ne sont encore acceptee pour les relancer
 * @author Dukizwe Darcy <darcy@mediabox.bi>
 */
const RESEARCH_CONDUCTOR = (io) => {
          var interval = setInterval(() => {
                    clearInterval(interval)
                    researchAgain(io)
          }, (TIME_TO_ACCEPT + ADDITIONAL_SECONDS) * 1000)
}

const researchAgain = async (io) => {
          try {
                    const courses = await query(`SELECT ID_COURSE, ID_DRIVER, ID_RIDER, LATITUDE_PICKUP, LONGITUDE_PICKUP, ADDRESSE_PICKUP, ADDRESSE_DESTINATION, DISTANCE, MONTANT_ESTIMATIF FROM courses WHERE ID_STATUT = ${IDS_COURSE_STATUS.EN_ETTENTE} AND DATE_REDEMANDE <= NOW() - INTERVAL ${TIME_TO_ACCEPT + ADDITIONAL_SECONDS} SECOND`)
                    if(courses.length > 0) {
                              await Promise.all(courses.map(async course => {
                                        findDrivers(course, course.LATITUDE_PICKUP, course.LONGITUDE_PICKUP, io)
                              }))
                    }
                    RESEARCH_CONDUCTOR()
          } catch (error) {
                    console.log(error)
          }
}

module.exports = {
          RESEARCH_CONDUCTOR,
          TIME_TO_ACCEPT,
          ADDITIONAL_SECONDS
}