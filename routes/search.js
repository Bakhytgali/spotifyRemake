const express = require("express");

const cookieParser = require("cookie-parser");

const searchRouter = express.Router();
searchRouter.use(cookieParser());

const { accountRouter, Playlist } = require("./account");

searchRouter.get("/", async (req, res) => {
    const accessToken = req.cookies.accessToken;
    const userId = req.cookies.userId;
    const userName = req.cookies.userName;

    const playlists = await Playlist.find({
        userId: userId
    })

    res.cookie('accessToken', accessToken);
    res.render("./search", {
        playlists: playlists,
        userName: userName,
        userId: userId
    });
});



module.exports = searchRouter;
