const User = require("../models/User");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Show Auth Page
exports.showAuthPage = (req, res) => {
  const loginError = req.session.loginError || null;
  const signupError = req.session.signupError || null;

  // Clear errors from session
  req.session.loginError = null;
  req.session.signupError = null;

  res.render("auth", { loginError, signupError });
};

// Show OTP Page
exports.showOtpPage = (req, res) => {
  res.render("otp", { email: req.session.tempEmail || "" });
};

// Signup with OTP + Password
exports.signup = async (req, res) => {
  const { name, username, email, password, confirmPassword } = req.body;

  // check username uniqueness
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    req.session.signupError = "Username already taken. Please choose another.";
    return res.redirect("/auth");
  }

  // Check password match
  if (password !== confirmPassword) {
    return res.send("Passwords do not match");
  }

  // Server-side password strength check
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.send(
      "Password must be at least 8 characters, include one uppercase, one number, and one special symbol."
    );
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.googleId) {
        req.session.signupError =
          "This email is already registered via Google. Please sign in with Google.";
      } else {
        req.session.signupError = "User already exists.";
      }
      return res.redirect("/auth");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
    });

    await user.save();
    req.session.tempEmail = email;

    await sendOTP(email, otp);
    res.redirect("/verify");
  } catch (err) {
    console.error(err);
    res.send("Error during signup");
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const email = req.session.tempEmail;
  try {
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || Date.now() > user.otpExpiry) {
      return res.send("Invalid or expired OTP");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    req.session.userId = user._id;
    // ✅ Redirect to landing page after successful signup
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error verifying OTP");
  }
};

// Login with Password
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      req.session.loginError = "Wrong email or password.";
      return res.redirect("/auth");
    }

    if (user.googleId) {
      req.session.loginError =
        "This email is registered with Google. Please sign in using Google.";
      return res.redirect("/auth");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.session.loginError = "Wrong email or password.";
      return res.redirect("/auth");
    }

    req.session.userId = user._id;
    // ✅ Redirect to landing page after successful login
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.session.error = "Error logging in.";
    res.redirect("/auth");
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth");
  });
};

// Send OTP Helper
const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `GlamMate <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your GlamMate OTP",
    html: `<h2>Your OTP is:</h2><h3>${otp}</h3><p>It will expire in 10 minutes.</p>`,
  });
};
