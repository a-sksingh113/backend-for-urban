const express = require("express");
const { handleGetUserHistory } = require("../../controller/historyController/requestHistory");
const router = express.Router();

router.get('/history',handleGetUserHistory);

module.exports = router;