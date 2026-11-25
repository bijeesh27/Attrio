const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const env=require('dotenv').config()
function generateReferralCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
  }
  
  return referralCode;
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
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
            const referralCode=generateReferralCode()
            // Create a completely new user
            user = new User({
              googleId: profile.id,
              username: profile.displayName,
              email: email,
              referralCode
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
} else {
  console.warn("Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing. Google login is disabled.");
}

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
