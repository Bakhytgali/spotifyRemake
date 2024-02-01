const express = require("express");
const axios = require("axios");
const accountRouter = express.Router();

const client_id = 'b1c7aad75bd7477cbba728e68d4bc772';
const client_secret = 'e6128e223e5a42cb991d108f6e5f6990';
const tokenEndpoint = "https://accounts.spotify.com/api/token";

let access_token;
let refresh_token;

accountRouter.get("/", async (req, res) => {
    const code = req.query.code;

    try {
        const response = await fetchAccessToken(code);
        handleAuthorizationResponse(response);

        await refreshAccessToken();

        // console.log(access_token);
        // console.log(refresh_token);

        res.render("account");
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

async function callAuthApi(body) {
    try {
        const response = await axios.post(tokenEndpoint, body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`
            }
        });

        console.log('Spotify API Response:', response.data);

        return response;
    } catch (error) {
        console.error('Spotify API Request Error:', error.message);
        throw new Error("Failed to make request to Spotify API");
    }
}

async function fetchAccessToken(code) {
    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("code", code);
    body.append("redirect_uri", encodeURI("http://localhost:5000/account"));
    body.append("client_id", client_id);
    body.append("client_secret", client_secret);

    try {
        const response = await callAuthApi(body);

        if (response.status === 200) {
            return response.data;
        } else {
            console.error("Spotify API Error Response:", response.data);
            throw new Error(`Failed to fetch access token. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function handleAuthorizationResponse(data) {
    if (data.access_token != undefined) {
        access_token = data.access_token;
    }
    if (data.refresh_token != undefined) {
        refresh_token = data.refresh_token;
    }
}

async function refreshAccessToken() {
    let body = "grant_type=refresh_token";
    body += `&refresh_token=${refresh_token}`;
    body += `&client_id=${client_id}`;
    return await callAuthApi(body);
}

module.exports = accountRouter;
