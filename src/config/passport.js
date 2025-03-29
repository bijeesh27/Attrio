const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const env=require('dotenv').config()

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google auth attempt");
        // First check if user exists with Google ID
        let user = await User.findOne({ email: profile.email });
        
        if (user) {
          return done(null, user);
        }
        
        // If no user with this Google ID, check if the email exists
        const email = profile.emails[0].value;
        user = await User.findOne({ email: email });
        
        if (user) {
          // User exists with this email but not connected to Google
          // Update the user to link their Google account
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        } else {
          // Create a completely new user
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: email,
          });
          await user.save();
          return done(null, user);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing User:", user);
  done(null, user.id); 
});

passport.deserializeUser((id, done) => {
    User.findById(id)
    .then(user=>{
      done(null,user)
    })
    .catch(err=>{
      done(err,null)
    })
});

module.exports = passport;
