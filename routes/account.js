const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const {authorizationCodeGrant} = require("spotify-web-api-node/src/server-methods");

let code;

let email, username;

const accountRouter = express.Router();

accountRouter.get("/", async (req, res) => {
        code = req.query.code;

        getUserInfo();

        res.render("account", { username, email });
});

let spotify;

async function getUserInfo() {
    spotify = new SpotifyWebApi({
        clientId: "b1c7aad75bd7477cbba728e68d4bc772",
        clientSecret: "e6128e223e5a42cb991d108f6e5f6990",
        redirectUri: "http://localhost:5000/account"
    });

    spotify.
    authorizationCodeGrant(code)
        .then(function(data) {

            console.log(`Access token: ${data.body["access_token"]}`);

            spotify.setAccessToken(data.body["access_token"]);

            return spotify.getMe();
        })
        .then(function(data) {

            email = data.body.email;
            username = data.body["display_name"];

        }).catch(
        function(e) {
            console.log(`Error! ${e.message}`);
        }
    )
}

module.exports = accountRouter;
