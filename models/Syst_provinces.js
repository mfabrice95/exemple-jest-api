const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/sequerize');

const Syst_provinces = sequelize.define("syst_provinces", {
          PROVINCE_ID: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true
          },
          PROVINCE_NAME: {
                    type: DataTypes.STRING(100),
                    allowNull: false
          },
          OBJECTIF: {
                    type: DataTypes.INTEGER,
                    allowNull: false
          },
          PROVINCE_LATITUDE : {
                    type: DataTypes.INTEGER,
                    allowNull: false
          },
          PROVINCE_LATITUDE : {
                    type: DataTypes.FLOAT,
                    allowNull: false
          },
          PROVINCE_LONGITUDE : {
                    type: DataTypes.FLOAT,
                    allowNull: false
          },
          PAYS_CODE : {
                    type: DataTypes.STRING(255),
                    allowNull: false
          },
}, {
          freezeTableName: true,
          tableName: 'syst_provinces',
          timestamps: false,
})


module.exports = Syst_provinces