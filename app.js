const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const userRoutes = require("./src/router/userRouter");
const adminRoutes = require("./src/router/adminRouter");
const connectDB = require("./src/config/db");
const session = require("express-session");
const nocache = require("nocache");
const multer = require("multer");
const os = require("os");

const PORT = process.env.PORT;

app.use(nocache());

app.set("view engine", "ejs");

app.set("views", [
  path.join(__dirname, "src", "views", "user"),
  path.join(__dirname, "src", "views", "admin"),
]);
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static(path.join(os.homedir(), "Downloads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/uploads");
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

app.use((req,res,next)=>{
  res.locals.session = req.session
  next()
})

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
