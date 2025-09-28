const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const dotenv = require("dotenv");
const passport = require("passport");
const routes = require('./routes/routes');
const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");
require("dotenv").config();
require("./config/passport/google")(passport); // Google strategy config
require("./config/passport/serialize")(passport);

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Body Parser Middleware
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Session Setup (must come before passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Passport Setup (after session)
app.use(passport.initialize());
app.use(passport.session());

// Make user available in all EJS templates
app.use(async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.locals.user = req.user; // Google login users
  } else if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.user = user;
    } catch (err) {
      console.error("Error loading user:", err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  // Add message from session to res.locals and clear it
  res.locals.message = req.session.message;
  delete req.session.message;

  next();
});

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// EJS View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", routes);
app.use("/", authRoutes);

// 404 Fallback
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 GlamMate server running at http://localhost:${PORT}`);
});