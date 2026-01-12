const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const userRoutes = require("./src/router/userRouter");
const adminRoutes = require("./src/router/adminRouter");
const connectDB = require("./src/config/db");
const session = require("express-session");
const passport = require("./src/config/passport");
const nocache = require("nocache");
const multer = require("multer");
const os = require("os");
const flash = require("connect-flash");
const fs = require('fs');
const Razorpay = require('razorpay');
const razorpay = require('./src/config/rozorpay');

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const PORT = process.env.PORT;

app.use(nocache());


app.set("view engine", "ejs");

app.set("views", [
  path.join(__dirname, "src", "views", "user"),
  path.join(__dirname, "src", "views", "admin"),
]);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://vercel.live https://*.vercel.live",
      "script-src-elem 'self' https://vercel.live https://*.vercel.live",
      "connect-src 'self' https://vercel.live https://*.vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:"
    ].join("; ")
  )
  next()
})

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

app.use(passport.initialize());
app.use(passport.session());


app.use(express.static(path.join(os.homedir(), "Downloads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir);
}

const upload = multer({ storage: storage });

app.post("/uploads", upload.array("uploaded_file"), (req, res) => {
  console.log("req.file", req.file);
  console.log("req.body", req.body);
});

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.cartItem = req.session.cartItem || 0
  
  next();
});

app.use(
  "/admin/assets",
  express.static(path.join(__dirname, "public", "admin", "assets"))
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
