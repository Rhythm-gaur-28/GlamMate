const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Collection = require("../models/Collection");
const multer = require("multer");
const path = require("path");

// Helper to get the current user
async function getCurrentUser(req) {
    if (req.user) return req.user;
    if (req.session && req.session.userId) {
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

function isAjaxOrJson(req) {
    return req.headers.accept && req.headers.accept.includes('application/json');
}

// Landing page
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
        res.render("explore", { 
            posts, 
            page, 
            totalPages: Math.ceil(count / limit) 
        });
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

        const { caption, tags, filter } = req.body;
        let images = [];

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

        // Limit 10 images
        if (images.length > 10) images = images.slice(0, 10);

        // Process tags
        let processedTags = [];
        if (tags) {
            processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }

        const post = new Post({
            uploadedBy: user._id,
            uploadedByName: user.username,
            uploadedByAvatar: user.avatar,
            images,
            caption: caption || "",
            tags: processedTags,
            filter: filter || ""
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

// Profile page
router.get("/profile/:username", async (req, res) => {
    try {
        const profileUser = await User.findOne({ username: req.params.username })
            .populate("followers")
            .populate("following")
            .lean();
        if (!profileUser) return res.status(404).send("User not found");

        const posts = await Post.find({ uploadedBy: profileUser._id }).lean();

        const loggedInUser = await getCurrentUser(req);
        const isOwner = loggedInUser && loggedInUser._id.equals(profileUser._id);

        const collectionsCount = isOwner ? await Collection.countDocuments({ owner: profileUser._id }) : 0;
        const savedCount = isOwner && profileUser.saves ? profileUser.saves.length : 0;

        res.render("profile", {
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

// Configure multer storage for avatars
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/avatars");
    },
    filename: async function (req, file, cb) {
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

// Update profile
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
router.post("/profile/update-banner", ensureLoggedIn, bannerUpload.single("banner"), async (req, res) => {
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
});

// Search for users by username
router.get("/api/users/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { name: { $regex: query, $options: "i" } }
            ]
        }).select("username name avatar").limit(10);

        res.json(users);
    } catch (err) {
        console.error("User search error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
