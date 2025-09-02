const User = require("../../model/userModel/userModel");

const handleGetProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
  console.error("Error fetching profile:", error);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: error.message || error
  });
}
};

const handleUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, city, state, country, zipCode } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      console.error("User not found:", userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (city) user.city = city;
    if (state) user.state = state;
    if (country) user.country = country;
    if (zipCode) user.zipCode = zipCode;

    if (req.fileUrl) {
      user.profilePhoto = req.fileUrl;
    }

    await user.save();
    const { password, ...userData } = user.toJSON();

    console.log("Updated User Data:", userData);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error,
    });
  }
};


module.exports = {
    handleGetProfile,
    handleUpdateProfile
}