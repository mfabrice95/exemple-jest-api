const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/sequerize');
const Syst_provinces = require('./Syst_provinces');

const Syst_communes = sequelize.define("syst_communes", {
          COMMUNE_ID: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true
          },
          COMMUNE_NAME: {
                    type: DataTypes.STRING(100),
                    allowNull: false
          },
          PROVINCE_ID : {
                    type: DataTypes.INTEGER,
                    allowNull: false
          },
          COMMUNE_LATITUDE : {
                    type: DataTypes.FLOAT,
                    allowNull: false
          },
          COMMUNE_LONGITUDE : {
                    type: DataTypes.FLOAT,
                    allowNull: false
          },
}, {
          freezeTableName: true,
          tableName: 'syst_communes',
          timestamps: false,
})

Syst_communes.belongsTo(Syst_provinces, { foreignKey: "PROVINCE_ID", as: 'province' })

module.exports = Syst_communes