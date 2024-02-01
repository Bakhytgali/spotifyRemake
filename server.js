const express = require("express");
const { join } = require("path");

const app = express();
const port = 5000;
app.set("view engine", "ejs");

app.use(express.static(__dirname));
app.use("/styles", express.static(join(__dirname, "styles")));

app.get("/", (req, res) => {
    res.render("index");
});

const accountRouter = require("./routes/account");

app.use("/account", accountRouter);

app.listen(port);
