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
app.set("trust proxy", 1);


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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.live https://cdn.jsdelivr.net https://checkout.razorpay.com https://code.jquery.com",
      "script-src-elem 'self' 'unsafe-inline' https://vercel.live https://*.vercel.live https://cdn.jsdelivr.net https://checkout.razorpay.com https://code.jquery.com",
      "connect-src 'self' https://vercel.live https://*.vercel.live https://api.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
      "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://cdn.razorpay.com",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com"
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


const downloadsPath = path.join(os.homedir(), "Downloads");
if (fs.existsSync(downloadsPath)) {
  app.use(express.static(downloadsPath));
}

const uploadDir = path.join(process.env.VERCEL ? os.tmpdir() : __dirname, "uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.log("Upload dir initialization:", err.message);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

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

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
