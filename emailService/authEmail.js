const { transporter } = require("../config/nodemailerConfig/nodemailerConfig");

const sendForgetPasswordEmail = async (toEmail, resetPasswordLink) => {
  try {
    const mailOptions = {
      from: `"AI-MVP-Local" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: "Reset Your Password - AI-MVP-Local",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
  
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">


          <h2 style="color: #1a39ffff;">Hello</h2>
          <p>You recently requested to reset your password for your AI-MVP-Local account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetPasswordLink}" style="
              display: inline-block;
              padding: 10px 20px;
              margin: 10px 0;
              font-size: 16px;
              color: white;
              background-color: #4733fcff;
              text-decoration: none;
              border-radius: 5px;
          ">Reset Password</a>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <p style="margin-top: 20px;">Thanks,<br/>The AI-MVP-Local Team</p>
        </div>
  </div>
</div>


        
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};


const sendVerificationEmail = async (toEmail, verifyUrl) => {
  try {
    const mailOptions = {
      from: `"AI-MVP-Local" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: "Verify Your Email - AI-MVP-Local",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a39ffff;">Welcome to AI-MVP-Local </h2>
      <p>Thanks for signing up! Please verify your email address to activate your account.</p>
      <p>Click the button below to verify your email:</p>
      <a href="${verifyUrl}" style="
          display: inline-block;
          padding: 10px 20px;
          margin: 10px 0;
          font-size: 16px;
          color: white;
          background-color: #4733fcff;
          text-decoration: none;
          border-radius: 5px;
      ">Verify Email</a>
      <p>If you didn’t create this account, you can safely ignore this email.</p>
      <p style="margin-top: 20px;">Thanks,<br/>The AI-MVP-Local Team</p>
    </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};


const sendCongratsEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: `"AI-MVP-Local" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: " Email Verified Successfully - AI-MVP-Local",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a39ffff;">Congratulations </h2>
      <p>Your email has been successfully verified.</p>
      <p>You can now log in and start using AI-MVP-Local with full access.</p>
      <a href="${process.env.FRONTEND_URL}/login" style="
          display: inline-block;
          padding: 10px 20px;
          margin: 10px 0;
          font-size: 16px;
          color: white;
          background-color: #4733fcff;
          text-decoration: none;
          border-radius: 5px;
      ">Go to Login</a>
      <p style="margin-top: 20px;">Thanks,<br/>The AI-MVP-Local Team</p>
    </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Congrats email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending congrats email:", error);
    return false;
  }
};


const sendPasswordResetSuccessEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: `"AI-MVP-Local" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: " Password Reset Successful - AI-MVP-Local",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a39ffff;">Password Reset Successful </h2>
      <p>Your password has been successfully reset.</p>
      <p>If you did not perform this action, please contact support immediately.</p>
      <a href="${process.env.FRONTEND_URL}/login" style="
          display: inline-block;
          padding: 10px 20px;
          margin: 10px 0;
          font-size: 16px;
          color: white;
          background-color: #4733fcff;
          text-decoration: none;
          border-radius: 5px;
      ">Login Now</a>
      <p style="margin-top: 20px;">Stay secure,<br/>The AI-MVP-Local Team</p>
    </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset success email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset success email:", error);
    return false;
  }
};

const sendPasswordChangeEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: `"AI-MVP-Local" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: "Your Password Was Changed - AI-MVP-Local",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a39ffff;">Password Changed Successfully</h2>
      <p>We wanted to let you know that your password has been successfully updated.</p>
      <p>If you made this change, no further action is required.</p>
      <p style="color: red; font-weight: bold;">If you did not make this change, please reset your password immediately and contact support.</p>
      <p style="margin-top: 20px;">Thanks,<br/>The AI-MVP-Local Team</p>
    </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password change email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password change email:", error);
    return false;
  }
};

const sendUpdateProfileEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: `"AI-MVP-Local" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: "Your Profile is successfully Updated - AI-MVP-Local",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a39ffff;">Profile Updated Successfully</h2>
      <p>We wanted to let you know that your profile has been successfully updated.</p>
      <p>If you made this change, no further action is required.</p>
      <p style="color: red; font-weight: bold;">If you did not make this change, please reset your password immediately and contact support.</p>
      <p style="margin-top: 20px;">Thanks,<br/>The AI-MVP-Local Team</p>
    </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Profile update email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error Updating profile email:", error);
    return false;
  }
};



module.exports = {
  sendForgetPasswordEmail,
  sendVerificationEmail,
  sendCongratsEmail,
  sendPasswordResetSuccessEmail,
  sendPasswordChangeEmail,
  sendUpdateProfileEmail

};
