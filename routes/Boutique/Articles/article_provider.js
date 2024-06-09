const express = require("express");
const article_routes = require("./artilce.routes");
const artilce_router = express.Router();

artilce_router.use("/", article_routes);

module.exports = artilce_router;
