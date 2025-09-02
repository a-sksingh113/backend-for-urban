const express = require("express");
const supabaseUpload = require("../../config/uploadConfig/supabaseUpload");
const { handleUpdateProfile, handleGetProfile } = require("../../controller/userController/userProfileController");
const router = express.Router();

router.get("/profile", handleGetProfile);
router.patch("/profile",supabaseUpload.single('profilePhoto'),handleUpdateProfile);

module.exports = router;