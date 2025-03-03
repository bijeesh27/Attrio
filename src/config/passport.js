const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const User = require("../models/userSchema"); // Import User model

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:"http://localhost:3000/auth/google/callback",
      passReqToCallback: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("hiii");
        let user = await User.findOneAndUpdate(
          { email: profile.emails[0].value },
          {
            $set: {
              username: profile.displayName,
            },
          },
          { upsert: true, new: true }
        );

        console.log("user:", user);

        console.log("user has been authenticated....", user);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing User:", user);
  done(null, user._id); // Store MongoDB ObjectId in session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // Fetch user by MongoDB ObjectId
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
