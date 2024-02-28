const express = require("express");

const cookieParser = require("cookie-parser");

const searchRouter = express.Router();
searchRouter.use(cookieParser());

searchRouter.get("/", (req, res) => {
    const accessToken = req.cookies.accessToken;

    // const playlists = loadUserPlaylist();
    //
    // console.log(playlists);

    res.cookie('accessToken', accessToken);
    res.render("./search");
});


// async function loadUserPlaylist() {
//     try {
//         return await Playlist.find()
//     } catch (e) {
//         console.log(`Error! ${e.message}`);
//         return [];
//     }
// }

module.exports = searchRouter;
