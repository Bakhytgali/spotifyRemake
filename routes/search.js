const express = require("express");

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const searchRouter = express.Router();

// mongoose.connect("mongodb://localhost:27017/project")
//     .then(() => {
//         console.log("MongoDB is connected!");
//     });
//
// const playlistSchema = new mongoose.Schema({
//     id: String,
//     name: String,
//     image: String
// });
// const Playlist = mongoose.model("playlists", playlistSchema);

searchRouter.use(cookieParser());
searchRouter.get("/", (req, res) => {
    const accessToken = req.cookies.accessToken;
    res.cookie('accessToken', accessToken);
    res.render("./search");
});


module.exports = searchRouter;
