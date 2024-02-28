const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cookieParser = require("cookie-parser");
const { get } = require("axios");
const mongoose = require("mongoose");

require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB is connected!");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
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

accountRouter.get("/", async (req, res) => {
    try {
        const { code } = req.query;
        let { accessToken, refreshToken } = req.cookies;

        const spotify = new SpotifyWebApi({
            redirectUri: process.env.REDIRECT_URI,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            accessToken,
            refreshToken
        });

        if (!accessToken && code) {
            const data = await spotify.authorizationCodeGrant(code);
            accessToken = data.body.access_token;
            refreshToken = data.body.refresh_token;

            res.cookie("accessToken", accessToken, { httpOnly: true });
            res.cookie("refreshToken", refreshToken, { httpOnly: true });
        }

        if (!accessToken) {
            throw new Error("Access token not found.");
        }

        await getUserInfo(spotify, res);
        const playlists = await getUserPlaylists(spotify);
        await savePlaylistsToDB(playlists);

        res.render("account", { username, email, playlists });
    } catch (error) {
        console.error(`Error! ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});

async function getUserInfo(spotify, res) {
    try {
        const me = await spotify.getMe();
        res.locals.email = me.body.email;
        res.locals.username = me.body.display_name;
    } catch (error) {
        console.error(`Error fetching user info: ${error.message}`);
        throw error;
    }
}

async function getUserPlaylists(spotify) {
    try {
        const response = await spotify.getUserPlaylists();
        return response.body.items;
    } catch (error) {
        console.error(`Error fetching user playlists: ${error.message}`);
        throw error;
    }
}

async function savePlaylistsToDB(playlists) {
    try {
        for (const playlist of playlists) {
            const doesExist = await Playlist.findOne({ id: playlist.id });
            if (!doesExist) {
                const newPlaylist = new Playlist({
                    id: playlist.id,
                    name: playlist.name,
                    image: playlist.images.length > 0 ? playlist.images[0].url : null
                });
                await newPlaylist.save();
            } else {
                console.log(`Playlist with ID ${playlist.id} already exists in the database.`);
            }
        }
        console.log("Playlists have been stored in DB.");
    } catch (error) {
        console.error(`Error saving playlists to DB: ${error.message}`);
        throw error;
    }
}

module.exports = accountRouter;
