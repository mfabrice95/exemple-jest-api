const express = require("express");
const RESPONSE_CODES = require("../../constants/RESPONSE_CODES");
const RESPONSE_STATUS = require("../../constants/RESPONSE_STATUS");
const Category = require("../../models/Boutique/Category");
const Validation = require("../../class/Validation");
const { Op, where } = require("sequelize");

const createCategory = async (req, res) => {
  try {
    const { DESIGNATION } = req.body;
    const data = { ...req.body };
    const validation = new Validation(
      data,
      {
        DESIGNATION: {
          required: true,
          alpha: true,
          length: [2, 20],
        },
      },
      {
        DESIGNATION: {
          required: "Ce champ est obligatoire",
          alpha: "Doit contenir des caractères alpha numeriques",
          length: "La valeur doit être comprise 2 et 20 caractères",
        },
      }
    );

    if (!validation) {
      const errors = await validation.getErrors();
      return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
        message: "Problème de validation des données",
        result: errors,
      });
    }

    const result = await Category.create({ DESIGNATION });

    res.status(RESPONSE_CODES.CREATED).json({
      statusCode: RESPONSE_CODES.CREATED,
      httpStatus: RESPONSE_STATUS.CREATED,
      message: "Categorié créée avec succès",
      result: result,
    });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
      statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur, réessayer plus tard",
    });
  }
};

const findAllCategory = async (req, res) => {
  try {
    const { rows = 10, first = 0, sortField, sortOrder, search } = req.query;
    const defaultSortDirection = "DESC";

    const sortColumns = {
      category: {
        as: "category",
        fields: {
          ID_CATEGORY: "ID_CATEGORY",
          DESIGNATION: "DESIGNATION",
          CREATED_AT: "CREATED_AT",
        },
      },
    };

    var orderColumn, orderDirection;

    // sorting
    var sortModel;
    if (sortField) {
      for (let key in sortColumns) {
        if (sortColumns[key].fields.hasOwnProperty(sortField)) {
          sortModel = {
            model: key,
            as: sortColumns[key].as,
          };
          orderColumn = sortColumns[key].fields[sortField];
          break;
        }
      }
    }
    if (!orderColumn || !sortModel) {
      orderColumn = sortColumns.category.fields.CREATED_AT;
      sortModel = {
        model: "category",
        as: sortColumns.category.as,
      };
    }

    // ordering
    if (sortOrder == 1) {
      orderDirection = "ASC";
    } else if (sortOrder == -1) {
      orderDirection = "DESC";
    } else {
      orderDirection = defaultSortDirection;
    }

    // searching
    const globalSearchColumns = ["DESIGNATION"];

    var globalSearchWhereLike = {};
    if (search && search.trim() != "") {
      const searchWildCard = {};
      globalSearchColumns.forEach((column) => {
        searchWildCard[column] = {
          [Op.substring]: search,
        };
      });
      globalSearchWhereLike = {
        [Op.or]: searchWildCard,
      };
    }

    const result = await Category.findAndCountAll({
      limit: parseInt(rows),
      offset: parseInt(first),
      order: [[sortModel, orderColumn, orderDirection]],
      where: {
        ...globalSearchWhereLike,
      },
    });

    res.status(RESPONSE_CODES.OK).json({
      statusCode: RESPONSE_CODES.OK,
      httpStatus: RESPONSE_STATUS.OK,
      message: "Liste des categories",
      result: {
        data: result.rows,
        totalRecords: result.count,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
      statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur, réessayer plus tard",
    });
  }
};

const findOneCategory = async (req, res) => {
  try {
    const { ID_CATEGORY } = req.params;
    const category = await Category.findOne({ where: { ID_CATEGORY } });
    if (!category) {
      res.status(RESPONSE_CODES.NOT_FOUND).json({
        statusCode: RESPONSE_CODES.NOT_FOUND,
        httpStatus: RESPONSE_STATUS.NOT_FOUND,
        message: "Catégorie non trouvée",
      });
    }
    res.status(RESPONSE_CODES.OK).json({
      statusCode: RESPONSE_CODES.OK,
      httpStatus: RESPONSE_STATUS.OK,
      message: "Categorie trouvée",
      result: category,
    });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
      statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur, réessayer plus tard",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { ids } = req.body;
    const itemsIds = JSON.parse(ids);
    await Category.destroy({
      where: {
        ID_CATEGORY: {
          [Op.in]: itemsIds,
        },
      },
    });
    res.status(RESPONSE_CODES.OK).json({
      statusCode: RESPONSE_CODES.OK,
      httpStatus: RESPONSE_STATUS.OK,
      message: "Catégories supprimées avec succès",
    });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
      statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur, réessayer plus tard",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { ID_CATEGORY } = req.params;
    const { DESIGNATION } = req.body;

    const data = { ...req.body };
    const validation = new Validation(
      data,
      {
        DESIGNATION: {
          required: true,
          alpha: true,
          length: [2, 20],
        },
      },
      {
        DESIGNATION: {
          required: "Ce champ est obligatoire",
          alpha: "Doit contenir des caractères alpha numeriques",
          length: "La valeur doit être comprise 2 et 20 caractères",
        },
      }
    );

    if (!validation) {
      const errors = await validation.getErrors();
      return res.status(RESPONSE_CODES.UNPROCESSABLE_ENTITY).json({
        statusCode: RESPONSE_CODES.UNPROCESSABLE_ENTITY,
        httpStatus: RESPONSE_STATUS.UNPROCESSABLE_ENTITY,
        message: "Problème de validation des données",
        result: errors,
      });
    }

    const result = await Category.update(
      { DESIGNATION },
      {
        where: { ID_CATEGORY: ID_CATEGORY },
      }
    );
    res.status(RESPONSE_CODES.CREATED).json({
      statusCode: RESPONSE_CODES.CREATED,
      httpStatus: RESPONSE_STATUS.CREATED,
      message: "Categorie mis à jour avec succès",
      result: result,
    });
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
      statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur, réessayer plus tard",
    });
  }
};

module.exports = {
  createCategory,
  findAllCategory,
  findOneCategory,
  deleteCategory,
  updateCategory,
};
