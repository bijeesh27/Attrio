const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
require("dotenv").config();

// Simplified serialization - just use the MongoDB _id (converted to string)
passport.serializeUser((user, done) => {
    if (!user) {
        return done(new Error("User not found"), null);
    }
    console.log("Serializing user ID:", user.id);
    done(null, user.id);
});

// Simplified deserialization - find by MongoDB _id 
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await User.findOne({ googleId: profile.id });
                
                if (!user) {
                    // Create new user
                    user = new User({
                        googleId: profile.id,
                        firstName: profile.name?.givenName || profile.displayName || 'Unknown',
                        lastName: profile.name?.familyName || '',
                        email: profile.emails?.[0]?.value || '',
                    });
                    await user.save();
                }
                
                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

module.exports = passport;