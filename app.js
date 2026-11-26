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

const viewDirectories = [
  path.join(__dirname, "src", "views", "user"),
  path.join(__dirname, "src", "views", "admin"),
  path.join(__dirname, "src", "views", "partials"),
  path.join(__dirname, "src", "views"),
  path.join(process.cwd(), "src", "views", "user"),
  path.join(process.cwd(), "src", "views", "admin"),
];
app.set("views", Array.from(new Set(viewDirectories)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "script-src-elem 'self' 'unsafe-inline' https:",
      "connect-src 'self' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' data: https:",
      "img-src 'self' data: blob: https:",
      "frame-src 'self' https:"
    ].join("; ")
  );
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "attrio-session-secret-2025",
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
  res.locals.session = req.session || {};
  res.locals.cartItem = (req.session && req.session.cartItem) ? req.session.cartItem : 0;
  next();
});

app.use(
  "/admin/assets",
  express.static(path.join(__dirname, "public", "admin", "assets"))
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure DB connection before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection failure in request:", err.message);
  }
  next();
});

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Attiro - Service Notice</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF7F2; color: #2D241E; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; border-radius: 12px; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; border: 1px solid #EFEAE6; }
          h1 { font-size: 24px; margin-bottom: 12px; color: #5C3D2E; }
          p { color: #6E6259; line-height: 1.6; margin-bottom: 20px; font-size: 15px; }
          .diag { background: #F8F4F0; border: 1px solid #E2D9D2; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 12px; color: #8A4035; text-align: left; margin-bottom: 24px; word-break: break-all; }
          a { display: inline-block; background: #5C3D2E; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
          a:hover { background: #442C20; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>We'll be right back</h1>
          <p>We encountered a temporary issue while loading this page. Please try refreshing in a moment.</p>
          <div class="diag"><strong>Details:</strong> ${err && (err.message || err.toString()) ? (err.message || err.toString()) : "Internal Server Error"}</div>
          <a href="/">Return to Home</a>
        </div>
      </body>
    </html>
  `);
});

connectDB();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
