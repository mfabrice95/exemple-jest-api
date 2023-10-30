const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/sequerize');
const Syst_communes = require('./Syst_communes');

const Syst_zones = sequelize.define("syst_zones", {
          ZONE_ID: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true
          },
          ZONE_NAME: {
                    type: DataTypes.STRING(100),
                    allowNull: false
          },
          COMMUNE_ID : {
                    type: DataTypes.INTEGER,
                    allowNull: false
          },
          LATITUDE : {
                    type: DataTypes.FLOAT,
                    allowNull: false
          },
          LONGITUDE : {
                    type: DataTypes.FLOAT,
                    allowNull: false
          },
}, {
          freezeTableName: true,
          tableName: 'syst_zones',
          timestamps: false,
})

Syst_zones.belongsTo(Syst_communes, { foreignKey: "COMMUNE_ID", as: 'commune' })

module.exports = Syst_zones