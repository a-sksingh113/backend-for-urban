const express = require("express");
const supabaseUpload = require("../../config/uploadConfig/supabaseUpload");
const { handleUpdateProfile, handleGetProfile, handleChangePassword } = require("../../controller/userController/userProfileController");
const router = express.Router();

router.get("/profile", handleGetProfile);
router.patch("/profile",supabaseUpload.single('profilePhoto'),handleUpdateProfile);
router.post("/change-password", handleChangePassword);

module.exports = router;