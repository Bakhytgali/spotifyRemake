const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cookieParser = require("cookie-parser");
const { get } = require("axios");

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
        clientId: "b1c7aad75bd7477cbba728e68d4bc772",
        clientSecret: "e6128e223e5a42cb991d108f6e5f6990",
        redirectUri: "http://localhost:5000/account"
    });

    if (!accessToken || !refreshToken) {
        try {
            const data = await spotify.authorizationCodeGrant(code);
            accessToken = data.body["access_token"];
            refreshToken = data.body["refresh_token"];

            res.cookie('accessToken', accessToken, { httpOnly: true });
            res.cookie('refreshToken', refreshToken, { httpOnly: true });

        } catch (error) {
            console.error(`Error! ${error.message}`);
            res.status(500).send("Internal Server Error");
            return;
        }
    }

    try {
        await getUserInfo();

        const playlists = await getUserPlaylists();

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

module.exports = accountRouter;