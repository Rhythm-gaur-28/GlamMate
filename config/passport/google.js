const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../../models/User");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Step 1: Check if user already exists by Google ID
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // Step 2: Check if user with same email exists (from OTP/manual signup)
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            if (user.googleId) {
              // Already a Google user
              return done(null, user);
            } else {
              // Prevent Google login if email is used for manual signup
              return done(null, false, { message: "This email is already registered manually. Please login using email and password." });
            }
          }


          // Step 3: If no match, create a brand new user
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            // avatar: profile.photos[0].value,
            isVerified: true,
          });

          const savedUser = await newUser.save();
          done(null, savedUser);
        } catch (err) {
          console.error("Google Auth Error:", err);
          done(err, null);
        }
      }
    )
  );
};