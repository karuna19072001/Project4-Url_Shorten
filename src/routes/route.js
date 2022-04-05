const express = require('express');
const router = express.Router();

const url1= require("../controller/urlController")


router.post("/url/shorten", url1.createUrl)

router.get("/:urlCode", url1.getUrl)

module.exports= router;

