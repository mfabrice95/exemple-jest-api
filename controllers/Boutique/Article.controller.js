const express = require("express");
const RESPONSE_CODES = require("../../constants/RESPONSE_CODES");
const RESPONSE_STATUS = require("../../constants/RESPONSE_STATUS");
const Category = require("../../models/Boutique/Category");
const Validation = require("../../class/Validation");
const { Op, where } = require("sequelize");
const Article = require("../../models/Boutique/Article");
const ArtilceUpload = require("../../class/uploads/ArticleUpload");
const IMAGES_DESTINATIONS = require("../../constants/IMAGES_DESTINATIONS");
const sendMail = require("../../utils/sendMail");

const createArticle = async (req, res) => {
  try {
    const { ID_CATEGORY, NAME_ARTICLE, PRICE } = req.body;
    const { IMAGE } = req.files || {};

    const data = { ...req.body, ...req.files };

    const validation = new Validation(
      data,
      {
        ID_CATEGORY: {
          required: true,
          number: true,
        },
        NAME_ARTICLE: {
          required: true,
          alpha: true,
          length: [2, 20],
        },
        PRICE: {
          required: true,
        },
        IMAGE: { required: true, image: 2000000 },
      },
      {
        ID_CATEGORY: {
          required: "Ce champ est obligatoire",
          number: "Doit etre un nombre",
        },
        NAME_ARTICLE: {
          required: "Ce champ est obligatoire",
          alpha: "Doit etre alpha-numerique",
          length: "La valeur du champ doit etre entre 2 et 20 caractères",
        },
        PRICE: {
          required: "Ce champ est obligatoire",
        },
        IMAGE: {
          required: "Ce champ est obligatoire",
          image: "Ne doit pas dépasser 2MO ",
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

    // import de la classe qui va uploader l'image de l'article
    const articleUpload = new ArtilceUpload();
    var filename; // va afficher le nom de l'image uploadée

    if (IMAGE) {
      const { fileInfo: fileInfo_1, thumbInfo: thumbInfo_1 } =
        await articleUpload.upload(IMAGE, false);
      filename = fileInfo_1;
    }

    const result = await Article.create({
      ID_CATEGORY,
      NAME_ARTICLE,
      PRICE,
      IMAGE: filename
        ? `${req.protocol}://${req.get("host")}/${
            IMAGES_DESTINATIONS.articles
          }/${filename?.fileName}`
        : null,
    });
    res.status(RESPONSE_CODES.CREATED).json({
      statusCode: RESPONSE_CODES.CREATED,
      httpStatus: RESPONSE_STATUS.CREATED,
      message: "Article créée avec succès",
      result: result,
    });

    // envoi d'un mail lorsque l'article a été enregistré
    const sujet = "Boutique - Confirmation article";
    const EMAIL = "tony@mediabox.bi";
    await sendMail({ to: EMAIL, sujet }, "confirm_article", {
      NAME_ARTICLE,
      PRICE
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

const findAllArticle = async (req, res) => {
  try {
    const { rows = 10, first = 0, sortField, sortOrder, search } = req.query;
    const defaultSortDirection = "DESC";

    const sortColumns = {
      category: {
        as: "category",
        fields: {
          DESIGNATION: "DESIGNATION",
        },
      },
      article: {
        as: "article",
        fields: {
          ID_ARTICLE: "ID_ARTICLE",
          ID_CATEGORY: "ID_CATEGORY",
          NAME_ARTICLE: "NAME_ARTICLE",
          PRICE: "PRICE",
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
      orderColumn = sortColumns.article.fields.CREATED_AT;
      sortModel = {
        model: "article",
        as: sortColumns.article.as,
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
    const globalSearchColumns = ["NAME_ARTICLE", "$category->DESIGNATION$"];

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

    const result = await Article.findAndCountAll({
      limit: parseInt(rows),
      offset: parseInt(first),
      //   order: [[sortModel, orderColumn, orderDirection]],
      where: {
        ...globalSearchWhereLike,
      },
      include: [
        {
          model: Category,
          as: "category",
          required: false,
        },
      ],
    });
    res.status(RESPONSE_CODES.OK).json({
      statusCode: RESPONSE_CODES.OK,
      httpStatus: RESPONSE_STATUS.OK,
      message: "Liste des articles",
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

const findOneArticle = async (req, res) => {
  try {
    const { ID_ARTICLE } = req.params;
    const article = await Article.findOne({
      include: { model: Category, as: "category" },
      where: { ID_ARTICLE },
    });
    if (article) {
      res.status(RESPONSE_CODES.OK).json({
        statusCode: RESPONSE_CODES.OK,
        httpStatus: RESPONSE_STATUS.OK,
        message: "Article trouvé",
        result: article,
      });
    } else {
      res.status(RESPONSE_CODES.NOT_FOUND).json({
        statusCode: RESPONSE_CODES.NOT_FOUND,
        httpStatus: RESPONSE_STATUS.NOT_FOUND,
        message: "L'article non trouvé",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({
      statusCode: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      httpStatus: RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
      message: "Erreur interne du serveur, réessayer plus tard",
    });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { ids } = req.body;
    const itemsIds = JSON.parse(ids);
    await Article.destroy({
      where: {
        ID_ARTICLE: {
          [Op.in]: itemsIds,
        },
      },
    });
    res.status(RESPONSE_CODES.OK).json({
      statusCode: RESPONSE_CODES.OK,
      httpStatus: RESPONSE_STATUS.OK,
      message: "Article supprimé avec succès",
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

const updateArticle = async (req, res) => {
  try {
    const { ID_ARTICLE } = req.params;
    const { ID_CATEGORY, NAME_ARTICLE, PRICE } = req.body;

    const { IMAGE } = req.files || {};
    const data = { ...req.body, ...req.files };

    const validation = new Validation(
      data,
      {
        ID_CATEGORY: {
          required: true,
          number: true,
        },
        NAME_ARTICLE: {
          required: true,
          alpha: true,
          length: [2, 20],
        },
        PRICE: {
          required: true,
        },
        IMAGE: {
          image: 2000000,
        },
      },
      {
        ID_CATEGORY: {
          required: "Ce champ est obligatoire",
          number: "Doit etre un nombre",
        },
        NAME_ARTICLE: {
          required: "Ce champ est obligatoire",
          alpha: "Doit etre alpha-numerique",
          length: "La valeur du champ doit etre entre 2 et 20 caractères",
        },
        PRICE: {
          required: "Ce champ est obligatoire",
        },
        IMAGE: { image: "Ne doit pas dépasser 2M0" },
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

    // on va l'utiliser pour recuperer l'image actuelle
    const currentArticle = await Article.findByPk(ID_ARTICLE, {
      attributes: ["IMAGE"],
    });

    // import de la classe qui va uploader l'image de l'article
    const articleUpload = new ArtilceUpload();
    var filename; // va afficher le nom de l'image uploadée

    // Si l'image est modifiée
    if (IMAGE) {
      const { fileInfo } = await articleUpload.upload(IMAGE, false);
      filename = `${req.protocol}://${req.get("host")}/${
        IMAGES_DESTINATIONS.articles
      }/${fileInfo.fileName}`;
    }

    const result = await Article.update(
      {
        ID_CATEGORY,
        NAME_ARTICLE,
        PRICE,
        IMAGE: filename ? filename : currentArticle?.IMAGE,
      },
      {
        where: { ID_ARTICLE: ID_ARTICLE },
      }
    );

    res.status(RESPONSE_CODES.CREATED).json({
      statusCode: RESPONSE_CODES.CREATED,
      httpStatus: RESPONSE_STATUS.CREATED,
      message: "Article mis à jour avec succès",
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
  createArticle,
  findAllArticle,
  findOneArticle,
  deleteArticle,
  updateArticle,
};
