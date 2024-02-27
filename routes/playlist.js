const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");

const playlistRouter = express.Router();

playlistRouter.use(cookieParser());

let accessToken;
playlistRouter.get("/", async (req, res) => {
    const playlistId = req.query.playlistId;

    try {
        accessToken = req.cookies.accessToken;
        res.cookie("accessToken", accessToken);
        const playlist = await getPlaylist(playlistId, req);

        if (!playlist) {
            res.status(404).send("Playlist not found");
            return;
        }

        res.render("playlist", {
            playlist: playlist
        });
    } catch (e) {
        console.log(`Error! ${e.message}`);
        res.status(500).send("Internal Server Error");
    }
});

async function getPlaylist(playlistId) {
    try {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });
        return response.data;
    } catch (e) {
        console.log(`Error! ${e.message}`);
        return null;
    }
}

module.exports = playlistRouter;
