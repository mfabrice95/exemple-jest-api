const express = require("express");
const category_controller = require("../../../controllers/Boutique/Category.controller");
const category_routes = express.Router();

/**
 * Une route qui permet de créer une catégorie
 *@method POST
 * @url /category/create/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

category_routes.post("/create", category_controller.createCategory);

/**
 * Une route qui permet de lister toutes les categories
 *@method GET
 * @url /category/all/
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

category_routes.get("/all", category_controller.findAllCategory);
/**
 * Une route qui permet d'afficher une seule categorie
 *@method GET
 * @url /category/get/:ID_CATEGORIE
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

category_routes.get("/get/:ID_CATEGORY", category_controller.findOneCategory);
/**
 * Une route qui permet de supprimer une ou plusieurs categories
 *@method POST
 * @url /category/get/:ID_CATEGORIE
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

category_routes.post("/delete", category_controller.deleteCategory);
/**
 * Une route qui permet de mettre à jour les categories
 *@method PUT
 * @url /category/update/:ID_CATEGORIE
 * @author HAKIZIMANA Tony Carlin <tony@mediabox.bi>
 */

category_routes.put("/update/:ID_CATEGORY", category_controller.updateCategory);

module.exports = category_routes
