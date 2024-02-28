const express = require("express");

const cookieParser = require("cookie-parser");

const searchRouter = express.Router();

searchRouter.use(cookieParser());
searchRouter.get("/", (req, res) => {
    const accessToken = req.cookies.accessToken;
    res.cookie('accessToken', accessToken);
    res.render("./search");
});


module.exports = searchRouter;
