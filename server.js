const express = require("express");
const { join } = require("path");

const app = express();
const port = 5000;
app.set("view engine", "ejs");

app.use(express.static(__dirname));
app.use("/styles", express.static(join(__dirname, "styles")));

app.get("/", (req, res) => {
    res.render("index", { powerCards });
});

const accountRouter = require("./routes/account");

app.use("/account", accountRouter);


const powerCards = [
    adFree = {
        image: "/imgs/Image.svg",
        title: "Ad-free music listening",
        subtitle: "Enjoy uninterrupted music"
    },
    offline = {
        image: "/imgs/Image-1.svg",
        title: "Offline playback",
        subtitle: "Save your data by listening offline"
    },
    everywhere = {
        image: "/imgs/Image-2.svg",
        title: "Play everywhere",
        subtitle: "Listen on your speakers, TV, and other favorite devices"
    },
    payment = {
        image: "/imgs/Image-3.svg",
        title: "Pay your way",
        subtitle: "Prepay with Paytm, UPI and more"
    }
];

const playlistRouter = require("./routes/playlist");

app.use("/playlist", playlistRouter);

const searchRouter = require("./routes/search");

app.use("/search", searchRouter);

app.listen(port);
