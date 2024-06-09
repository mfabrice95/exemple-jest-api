const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../utils/sequerize");
const Category = require("./Category");

const Article = sequelize.define(
  "article",
  {
    ID_ARTICLE: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    ID_CATEGORY: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    NAME_ARTICLE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    PRICE: {
      type: DataTypes.FLOAT,
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
    tableName: "article",
    timestamps: false,
  }
);

Article.belongsTo(Category, { foreignKey: "ID_CATEGORY", as: "category" });

module.exports = Article;
