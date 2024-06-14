const express = require("express");
const article_controller = require("../../../controllers/Boutique/Article.controller");
const article_routes = express.Router();

/**
 * Une route qui permet de créer un artilce
 *@method POST
 * @url /article/create/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

article_routes.post("/create", article_controller.createArticle);
/**
 * Une route qui permet de lister les articles
 *@method GET
 * @url /article/all/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

article_routes.get("/all", article_controller.findAllArticle);
/**
 * Une route qui permet de lister les articles
 *@method GET
 * @url /article/all/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

article_routes.get("/get/:ID_ARTICLE", article_controller.findOneArticle);
/**
 * Une route qui permet de lister les articles
 *@method GET
 * @url /article/all/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

article_routes.post("/delete", article_controller.deleteArticle);
/**
 * Une route qui permet de lister les articles
 *@method PUT
 * @url /article/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

article_routes.put("/update/:ID_ARTICLE", article_controller.updateArticle);


article_routes.get("/by_category", article_controller.getArticlesByCategory1);


article_routes.get("/all_categories/:ID_CATEGORY", article_controller.allArticlesByCategory);

module.exports = article_routes;
