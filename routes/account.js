const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");

const clientId = 'b1c7aad75bd7477cbba728e68d4bc772';
const clientSecret = 'e6128e223e5a42cb991d108f6e5f6990';
const redirectUri = 'http://localhost:5000/account';

const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri
});

const accountRouter = express.Router();

accountRouter.get("/", async (req, res) => {
        res.render("account");
});

module.exports = accountRouter;
