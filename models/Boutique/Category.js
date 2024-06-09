const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../utils/sequerize");

const Category = sequelize.define(
  "category",
  {
    ID_CATEGORY: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    DESIGNATION: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CREATED_AT: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    tableName: "category",
    timestamps: false,
  }
);

module.exports = Category;
