const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");

const accountRouter = express.Router();

let code;
let email, username;

accountRouter.get("/", async (req, res) => {
    code = req.query.code;

    await getUserInfo();

    res.render("account", { username, email });
});

let spotify;

async function getUserInfo() {
    spotify = new SpotifyWebApi({
        clientId: "b1c7aad75bd7477cbba728e68d4bc772",
        clientSecret: "e6128e223e5a42cb991d108f6e5f6990",
        redirectUri: "http://localhost:5000/account"
    });

    try {
        const data = await spotify.authorizationCodeGrant(code);
        console.log(`Access token: ${data.body["access_token"]}`);

        spotify.setAccessToken(data.body["access_token"]);

        const userData = await spotify.getMe();
        email = userData.body.email;
        username = userData.body.display_name;
    } catch (e) {
        console.log(`Error! ${e.message}`);
    }
}

module.exports = accountRouter;
