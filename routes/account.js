const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cookieParser = require("cookie-parser");
const { get } = require("axios");
const mongoose = require("mongoose");

require("dotenv").config();

mongoose.connect("mongodb+srv://metroSpider:hokageboss@atlascluster.mhywsqd.mongodb.net/project")
    .then(() => {
        console.log("MongoDB is connected!");
    });

const songSchema = new mongoose.Schema({
    id: String,
    name: String,
});

const playlistSchema = new mongoose.Schema({
    id: String,
    name: String,
    image: String,
    songs: [songSchema]
});
const Playlist = mongoose.model("playlists", playlistSchema);

const accountRouter = express.Router();

accountRouter.use(cookieParser());

let code;
let email, username, accessToken, refreshToken;
let spotify;

accountRouter.get("/", async (req, res) => {
    code = req.query.code;

    accessToken = req.cookies.accessToken;
    refreshToken = req.cookies.refreshToken;

    spotify = new SpotifyWebApi({
        redirectUri: `${process.env.REDIRECT_URI}`,
        clientId: `${process.env.CLIENT_ID}`,
        clientSecret: `${process.env.CLIENT_SECRET}`
    });

    if (!accessToken || !refreshToken) {
        try {
            const data = await spotify.authorizationCodeGrant(code);
            accessToken = data.body["access_token"];

            refreshToken = data.body["refresh_token"];

            console.log(data.body["expires_in"]);

            res.cookie("accessToken", accessToken, {httpOnly: true});
            res.cookie("refreshToken", refreshToken, {httpOnly: true});
        } catch (error) {
            console.error(`Error! ${error.message}`);
            res.status(500).send("Internal Server Error");
            return;
        }
    }

    try {
        await getUserInfo();

        const playlists = await getUserPlaylists();

        await savePlaylistsToDB(playlists);

        res.render("account", { username, email, playlists });
    } catch (error) {
        console.error(`Error! ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});

async function getUserInfo() {
    try {
        spotify.setAccessToken(accessToken);
        const me = await spotify.getMe();
        email = me.body.email;
        username = me.body["display_name"];
    } catch (error) {
        console.error(`Error! ${error.message}`);
    }
}

async function getUserPlaylists() {
    try {
        const response = await get(
            "https://api.spotify.com/v1/me/playlists", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            }
        );
        return response.data.items;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}

async function savePlaylistsToDB(playlists) {
    try {
        for (const playlist of playlists) {
            const doesExist = await Playlist.findOne({
                id: playlist.id
            });
            if (!doesExist) {
                const newPlaylist = new Playlist({

                    id: playlist.id,
                    name: playlist.name,
                    image: playlist.images.length > 0 ?
                        playlist.images[0].url : null

                });
                console.log(`playlist id: ${playlist.id}`);

                await newPlaylist.save();

            } else {
                console.log(`Playlist with ID ${playlist.id} already exists in the database.`);
            }
        }
        console.log("Playlists have been stored in DB.");

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}


module.exports = accountRouter;