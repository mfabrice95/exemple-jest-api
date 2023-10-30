const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/sequerize');
const Syst_zones = require('./Syst_zones');

const Syst_collines = sequelize.define("syst_collines", {
          COLLINE_ID: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true
          },
          COLLINE_NAME: {
                    type: DataTypes.STRING(100),
                    allowNull: false
          },
          ZONE_ID : {
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
          tableName: 'syst_collines',
          timestamps: false,
})

Syst_collines.belongsTo(Syst_zones, { foreignKey: "ZONE_ID", as: 'zone' })

module.exports = Syst_collines