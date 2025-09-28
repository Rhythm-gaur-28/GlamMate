const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");

// Helper to get the current user
async function getCurrentUser(req) {
    if (req.user) return req.user;
    if (req.session && req.session.userId) {
        const User = require("../models/User");
        return await User.findById(req.session.userId);
    }
    return null;
}

// Updated ensureLoggedIn middleware
function ensureLoggedIn(req, res, next) {
    if (req.user) return next();
    if (req.session && req.session.userId) return next();
    req.session.message = { type: 'error', text: 'Login is required to perform this action.' };
    res.redirect('/auth');
}

// Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback from Google
router.get("/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
        if (err) {
            console.error("Google Auth Error:", err);
            return res.redirect("/auth");
        }

        if (!user) {
            req.session.loginError = info?.message || "Google login failed.";
            return res.redirect("/auth");
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error("Login error:", err);
                req.session.loginError = "Login failed.";
                return res.redirect("/auth");
            }
            return res.redirect("/");
        });
    })(req, res, next);
});

// Set username for Google users
router.post("/set-username", ensureLoggedIn, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ ok: false, message: "Login required" });

    const { username } = req.body;
    if (!username) return res.json({ ok: false, message: "Username cannot be empty" });

    try {
        const User = require("../models/User");
        const existing = await User.findOne({ username });
        if (existing) return res.json({ ok: false, message: "Username already taken" });

        user.username = username;
        await user.save();

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.json({ ok: false, message: "Server error" });
    }
});

// Auth Pages
router.get("/auth", authController.showAuthPage);
router.post("/signup", authController.signup);
router.get("/verify", authController.showOtpPage);
router.post("/verify", authController.verifyOtp);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
