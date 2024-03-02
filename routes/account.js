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
const Playlist = mongoose.model("Playlist", playlistSchema);

const accountRouter = express.Router();

accountRouter.use(cookieParser());

// Initialize Spotify API with credentials
const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
});

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        if (!accessToken || !refreshToken) {
            return res.status(401).send("Unauthorized");
        }

        // Set access token
        spotifyApi.setAccessToken(accessToken);

        // Check if access token is expired
        const tokenInfo = await spotifyApi.getAccessTokenInfo();
        if (tokenInfo.body.expires_in <= 0) {
            // Refresh access token
            const data = await spotifyApi.refreshAccessToken();
            const newAccessToken = data.body.access_token;

            // Update access token in cookies
            res.cookie("accessToken", newAccessToken, { httpOnly: true });
            spotifyApi.setAccessToken(newAccessToken);
        }

        // User is authenticated, proceed to next middleware
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Route to fetch user playlists
accountRouter.get("/", isAuthenticated, async (req, res) => {
    try {
        // Get user info
        const me = await spotifyApi.getMe();
        const email = me.body.email;
        const userName = me.body.display_name;
        const userId = me.body.id;

        // Fetch user playlists
        const data = await spotifyApi.getUserPlaylists(userId);
        const playlists = data.body.items.map(item => ({
            id: item.id,
            name: item.name,
            image: item.images.length > 0 ? item.images[0].url : null
        }));

        // Save playlists to database
        await Playlist.insertMany(playlists);

        // Render account page with user info and playlists
        res.render("account", { userName, email, playlists });
    } catch (error) {
        console.error("Error fetching user playlists:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = { accountRouter, Playlist };
