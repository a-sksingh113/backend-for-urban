const express = require("express");
const { handleGetUserHistory, handleGetUserHistoryById } = require("../../controller/historyController/requestHistory");
const router = express.Router();

router.get('/history',handleGetUserHistory);
router.get("/history/:historyId",  handleGetUserHistoryById);

module.exports = router;