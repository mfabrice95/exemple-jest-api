const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../utils/sequerize');
const Syst_collines = require('./Syst_collines');

const Utilisateur = sequelize.define("utilisateurs", {
          id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true
          },
          nom: {
                    type: DataTypes.STRING(50),
                    allowNull: false
          },
          prenom: {
                    type: DataTypes.STRING(50),
                    allowNull: false
          },
          id_colline: {
                    type: DataTypes.INTEGER(4),
                    allowNull: false,
          },
          image: {
                    type: DataTypes.STRING(255),
                    allowNull: false
          },
          date_naissance: {
                    type: DataTypes.DATE,
                    allowNull: false
          },
          date_insertion: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
          }
}, {
          freezeTableName: true,
          tableName: 'utilisateurs',
          timestamps: false
})

Utilisateur.belongsTo(Syst_collines, { foreignKey: "id_colline", as: 'colline' })

module.exports = Utilisateur