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
        console.log("hiii");
        let user = await User.findOne({googleId:profile.id})
        if(user){
          return done(null,user)
        }else{
          user=new User({
            username:profile.displayName,
            email:profile.emails[0].value,
          });
          await user.save();
          return done(null,user)
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
