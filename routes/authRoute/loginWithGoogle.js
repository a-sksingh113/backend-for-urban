const express = require('express');
const { redirectToGoogle, googleCallback } = require('../../controller/userController/googleLoginController');

const router = express.Router();

router.get('/google', redirectToGoogle);
router.get('/google/callback', googleCallback);

module.exports = router;
