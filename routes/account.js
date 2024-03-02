const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

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

let code; // authorization code
let email, userName, userId; // created to display the user info
let accessToken, refreshToken; // access token for the api calls, and refresh for refreshing it after some time
let spotify; // spotify - instance of a Spotify Web API Node

accountRouter.get("/account", async (req, res) => {
    code = req.query.code;
    accessToken = req.cookies.accessToken;
    refreshToken = req.cookies.refreshToken;

    spotify = new SpotifyWebApi({
        redirectUri: `${process.env.REDIRECT_URI}`,
        clientId: `${process.env.CLIENT_ID}`,
        clientSecret: `${process.env.CLIENT_SECRET}`,
    });

    if (!accessToken || !refreshToken) {
        try {
            const data = await spotify.authorizationCodeGrant(code);
            accessToken = data.body["access_token"];

            refreshToken = data.body["refresh_token"];

            console.log(data.body["expires_in"]);

            res.cookie("accessToken", accessToken, { httpOnly: true });
            res.cookie("refreshToken", refreshToken, { httpOnly: true });

        } catch (error) {

            console.error(`Error! ${error.message}`);
            res.status(500).send("Internal Server Error");
            return;

        }

    } else {

        accessToken = await refreshAccessToken(refreshToken);
        res.cookie("accessToken", accessToken, {httpOnly:true});

    }

    try {
        await getUserInfo(res);
        const playlists = await getUserPlaylists();

        await savePlaylistsToDB(playlists);

        res.render("account", { userName, email, playlists });
    } catch (error) {
        console.error(`Error! ${error.message}`);
        res.status(500).send("Internal Server Error");
    }
});


async function getUserInfo(res) {
    try {
        spotify.setAccessToken(accessToken);
        const me = await spotify.getMe();
        email = me.body.email;
        userName = me.body["display_name"];
        userId = me.body.id;

        res.cookie("userId", userId, {httpOnly : true});
        res.cookie("userName", userName, {httpOnly : true});

        console.log(userId);
    } catch (error) {
        console.error(`Error! ${error.message}`);
    }
}

async function getUserPlaylists() {
    try {
        const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            new Error(`Failed to fetch playlists: ${response.statusText}`);
        }
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}

async function savePlaylistsToDB(playlists) {
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
        const response = await fetch(url, payload);
        const body = await response.json();

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
module.exports = {accountRouter, Playlist};
