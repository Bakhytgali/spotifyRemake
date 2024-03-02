const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const axios = require('axios'); // Import axios for making HTTP requests

require("dotenv").config();

const playlistSchema = new mongoose.Schema({
    userId: String,
    id: String,
    name: String,
    image: String
});
const Playlist = mongoose.model("playlists", playlistSchema);

const accountRouter = express.Router();

accountRouter.use(cookieParser());


accountRouter.get("/", async (req, res) => {
    let code; // authorization code
    let accessToken, refreshToken; // access token for the api calls, and refresh for refreshing it after some time
    let spotify; // spotify - instance of a Spotify Web API Node

    code = req.query.code;
    accessToken = req.cookies.accessToken;
    refreshToken = req.cookies.refreshToken;

    spotify = new SpotifyWebApi({
        redirectUri: "https://spotifyremake.onrender.com/account",
        clientId: `${process.env.CLIENT_ID}`,
        clientSecret: `${process.env.CLIENT_SECRET}`,
    });

    try {
        if (!accessToken || !refreshToken) {
            const data = await spotify.authorizationCodeGrant(code);
            accessToken = data.body["access_token"];
            refreshToken = data.body["refresh_token"];

            console.log(data.body["expires_in"]);

            res.cookie("accessToken", accessToken, { httpOnly: true });
            res.cookie("refreshToken", refreshToken, { httpOnly: true });
        } else {
            accessToken = await refreshAccessToken(refreshToken);
            res.cookie("accessToken", accessToken, { httpOnly: true });
        }

        const { email, userName, userId } = await getUserInfo(res, spotify, accessToken);
        const playlists = await getUserPlaylists(accessToken, userId);

        await savePlaylistsToDB(playlists, userId);

        res.render("account", { userName, email, playlists });
    } catch (error) {
        console.error(`Error! ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});


async function getUserInfo(res, spotify, accessToken) {
    try {
        spotify.setAccessToken(accessToken);
        const me = await spotify.getMe();
        const email = me.body.email;
        const userName = me.body.display_name;
        const userId = me.body.id;

        console.log(email + " " + userName + " " + userId);

        res.cookie("userId", userId, { httpOnly: true });
        res.cookie("userName", userName, { httpOnly: true });

        return { email, userName, userId }; // Return user information
    } catch (error) {
        console.error(`Error! ${error.message}`);
        throw error; // Throw error to be caught in the calling function
    }
}

async function getUserPlaylists(accessToken, userId) {
    try {
        const response = await axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.items; // Return playlists
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error; // Throw error to be caught in the calling function
    }
}

async function savePlaylistsToDB(playlists, userId) {
    try {
        for (const playlist of playlists) {
            const doesExist = await Playlist.findOne({
                userId: userId,
                id: playlist.id
            });
            if (!doesExist) {
                const newPlaylist = new Playlist({
                    userId: userId,
                    id: playlist.id,
                    name: playlist.name,
                    image: playlist.images.length > 0 ? playlist.images[0].url : null
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

const refreshAccessToken = async (refreshToken) => {
    const url = "https://accounts.spotify.com/api/token";
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    };

    try {
        const response = await axios.post(url, payload);
        const body = response.data;

        if (body.access_token) {
            console.log("Access token refreshed successfully!");
            return body.access_token;
        } else {
            console.error("Failed to refresh access token.");
            return null;
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
};

module.exports = { accountRouter, Playlist };
