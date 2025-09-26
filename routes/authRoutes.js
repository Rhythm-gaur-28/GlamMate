// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const Post = require("../models/Post");
const User = require("../models/User");
const Collection = require("../models/Collection");
const passport = require("passport");
const multer = require("multer");
const path = require("path");

// Updated ensureLoggedIn middleware
function ensureLoggedIn(req, res, next) {
    if (req.user) return next();
    if (req.session && req.session.userId) return next();
    // Redirect with an error message
    req.session.message = { type: 'error', text: 'Login is required to perform this action.' };
    res.redirect('/auth');
}
function isAjaxOrJson(req) {
  return req.headers.accept && req.headers.accept.includes('application/json');
}
// Helper to get the current user (for manual or Google login)
async function getCurrentUser(req) {
    if (req.user) return req.user;
    if (req.session && req.session.userId) {
        return await User.findById(req.session.userId);
    }
    return null;
}

//landing page
router.get("/", (req, res) => {
  res.render("index");
});

// Explore feed - paginated
router.get("/explore", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1"));
  const limit = Math.min(30, parseInt(req.query.limit || "20"));
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const count = await Post.countDocuments();
    res.render("explore", { posts, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Single post page
router.get("/explore/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).send("Post not found");
    res.render("post", { post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Like post
router.post("/post/:id/like", ensureLoggedIn, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ ok: false, message: "Login required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ ok: false });
    const uid = user._id;
    const i = post.likes.findIndex((id) => id.equals(uid));
    if (i === -1) post.likes.push(uid);
    else post.likes.splice(i, 1);
    await post.save();
    res.json({ ok: true, likesCount: post.likes.length, liked: i === -1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// Save post
router.post("/post/:id/save", ensureLoggedIn, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ ok: false, message: "Login required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ ok: false });
    const uid = user._id;
    const i = post.saves.findIndex((id) => id.equals(uid));
    if (i === -1) post.saves.push(uid);
    else post.saves.splice(i, 1);
    await post.save();
    res.json({ ok: true, savesCount: post.saves.length, saved: i === -1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// GET Add Post page
router.get("/posts/add", ensureLoggedIn, async (req, res) => {
  res.render("addPost");
});
// POST Add Post
router.post("/posts/add", ensureLoggedIn, async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      req.session.message = { type: "error", text: "Login required" };
      return res.redirect("/auth");
    }

    const { caption, filter } = req.body;
    let images = [];

    // req.files will contain Base64 strings sent from frontend
    if (!req.body.images || !req.body.images.length) {
      req.session.message = { type: "error", text: "Please upload at least one image" };
      return res.redirect("/posts/add");
    }

    // Handle single string or array
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    // Limit 5 images
    if (images.length > 5) images = images.slice(0, 5);

    const post = new Post({
      uploadedBy: user._id,
      uploadedByName: user.username,
      uploadedByAvatar: user.avatar,
      images,
      caption,
      filter
    });

    await post.save();

    req.session.message = { type: "success", text: "Post added successfully!" };
    res.redirect("/profile/" + user.username);
  } catch (err) {
    console.error(err);
    req.session.message = { type: "error", text: "Server error while adding post" };
    res.redirect("/posts/add");
  }
});

// GET View Posts (redirect to profile)
router.get("/posts/view", ensureLoggedIn, async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    req.session.message = { type: "error", text: "Login required" };
    return res.redirect("/auth");
  }
  res.redirect("/profile/" + user.username + "#posts");
});

router.get("/profile/:username", async (req, res) => {
  try {
    const profileUser = await User.findOne({ username: req.params.username }).populate("followers").populate("following").lean();
    if (!profileUser) return res.status(404).send("User not found");

    const posts = await Post.find({ uploadedBy: profileUser._id }).lean();

    const loggedInUser = await getCurrentUser(req);
    const isOwner = loggedInUser && loggedInUser._id.equals(profileUser._id);

    const collectionsCount = isOwner ? await Collection.countDocuments({ owner: profileUser._id }) : 0;
    const savedCount = isOwner && profileUser.saves ? profileUser.saves.length : 0;

    res.render("profile", {
      // Use a new variable name for the profile being viewed
      profileUser: profileUser,
      posts,
      postsCount: posts.length,
      collectionsCount,
      savedCount,
      isOwner
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

//callback from Google
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
      return res.redirect("/"); // or "/" if you prefer
    });
  })(req, res, next);
});

router.post("/set-username", ensureLoggedIn, async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ ok: false, message: "Login required" });

  const { username } = req.body;
  if (!username) return res.json({ ok: false, message: "Username cannot be empty" });

  try {
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

// Configure multer storage for avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/avatars");
  },
  filename: async function (req, file, cb) {
    // Use user id from either req.user or session
    let user = req.user;
    if (!user && req.session && req.session.userId) {
      user = await User.findById(req.session.userId);
    }
    if (user) {
      cb(null, user._id + path.extname(file.originalname));
    } else {
      cb(new Error("User not found"), "");
    }
  }
});
const upload = multer({ storage });

// Update profile (avatar, bio, aboutMe)
router.post("/profile/update", ensureLoggedIn, upload.single("avatar"), async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            if (isAjaxOrJson(req)) {
                return res.status(401).json({ ok: false, message: 'Login is required.' });
            }
            req.session.message = { type: 'error', text: 'Login is required.' };
            return res.redirect('/auth');
        }

        const { bio, aboutMe } = req.body;
        if (bio !== undefined) user.bio = bio;
        if (aboutMe !== undefined) user.aboutMe = aboutMe;
        if (req.file) {
            user.avatar = "/uploads/avatars/" + req.file.filename;
        }
        await user.save();

        if (isAjaxOrJson(req)) {
            return res.json({ ok: true });
        }
        req.session.message = { type: 'success', text: 'Profile updated successfully!' };
        res.redirect('/profile/' + user.username);
    } catch (err) {
        console.error(err);
        if (isAjaxOrJson(req)) {
            return res.status(500).json({ ok: false, message: 'Failed to update profile. Server error.' });
        }
        req.session.message = { type: 'error', text: 'Failed to update profile. Server error.' };
        res.redirect('back');
    }
});

// Configure multer storage for banners
const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/banners");
  },
  filename: async function (req, file, cb) {
    // Use user id from either req.user or session
    let user = req.user;
    if (!user && req.session && req.session.userId) {
      user = await User.findById(req.session.userId);
    }
    if (user) {
      cb(null, user._id + path.extname(file.originalname));
    } else {
      cb(new Error("User not found"), "");
    }
  }
});
const bannerUpload = multer({ storage: bannerStorage });

// Update banner
router.post(
    "/profile/update-banner",
    ensureLoggedIn,
    bannerUpload.single("banner"),
    async (req, res) => {
        try {
            const user = await getCurrentUser(req);
            if (!user) {
                if (isAjaxOrJson(req)) {
                    return res.status(401).json({ ok: false, message: 'Login is required.' });
                }
                req.session.message = { type: 'error', text: 'Login is required.' };
                return res.redirect('/auth');
            }

            user.banner = "/uploads/banners/" + req.file.filename;
            await user.save();

            if (isAjaxOrJson(req)) {
                return res.json({ ok: true });
            }
            req.session.message = { type: 'success', text: 'Banner updated successfully!' };
            res.redirect('/profile/' + user.username);
        } catch (err) {
            console.error("Banner Update Error:", err);
            if (isAjaxOrJson(req)) {
                return res.status(500).json({ ok: false, message: 'Failed to update banner. Server error.' });
            }
            req.session.message = { type: 'error', text: 'Failed to update banner. Server error.' };
            res.redirect('back');
        }
    }
);
// Search for users by username
router.get("/api/users/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }

    // Use a case-insensitive regular expression to search for users
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } }
      ]
    }).select("username name avatar").limit(10); // Select only necessary fields

    res.json(users);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Server error" });
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