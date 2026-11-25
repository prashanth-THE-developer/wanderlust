// Load .env only on your laptop. Render sets NODE_ENV=production itself.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError");
const User = require("./models/user");
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");

// ---------- Required settings (stop early with a clear message) ----------
const REQUIRED_ENV = [
  "ATLASDB_URL",
  "SECRET",
  "CLOUD_NAME",
  "CLOUD_API_KEY",
  "CLOUD_API_SECRET",
  "MAP_TOKEN",
];

for (const name of REQUIRED_ENV) {
  if (!process.env[name]) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
}

const dbUrl = process.env.ATLASDB_URL;
const secret = process.env.SECRET;

const app = express();

// On Render the site is served over HTTPS through a proxy. "trust proxy" lets Express know
// the visitor used HTTPS, so the secure login cookie below can be sent.
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) app.set("trust proxy", 1);

// ---------- View engine ----------
app.engine("ejs", ejsMate);                        // lets us use layout()
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- Basic middleware ----------
app.use(express.urlencoded({ extended: true }));   // read form data
app.use(methodOverride("_method"));                // allow PUT/DELETE from forms
app.use(express.static(path.join(__dirname, "public")));

// ---------- Sessions (stored in MongoDB Atlas, so they survive restarts) ----------
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret },
  touchAfter: 24 * 3600,                           // update session at most once a day
});

store.on("error", (err) => {
  console.error("ERROR in MONGO SESSION STORE", err);
});

app.use(
  session({
    store,
    secret,
    resave: false,
    saveUninitialized: false,                      // no session for visitors who never log in
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,             // 7 days
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,                        // cookie only travels over HTTPS when deployed
    },
  })
);
app.use(flash());

// ---------- Login (passport) ----------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make flash messages and the logged-in user available in every EJS view
app.use((req, res, next) => {
  // Only touch flash when a message exists; otherwise every visitor would get a session
  const hasFlash = req.session && req.session.flash;
  res.locals.success = hasFlash ? req.flash("success") : [];
  res.locals.error = hasFlash ? req.flash("error") : [];
  res.locals.currUser = req.user || null;
  next();
});

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// ---------- 404 and error handling ----------
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;

  // problems with the uploaded file (too big, wrong field) are the visitor's mistake, not a crash
  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (maximum 5 MB)." : err.message;
  }

  if (statusCode >= 500) {
    console.error(err);                            // the real error goes to the terminal / Render logs
    message = "Something went wrong!";             // visitors never see internal details
  }

  res.status(statusCode).render("error.ejs", { message });
});

// ---------- Connect to DB, then start server ----------
const port = process.env.PORT || 8080;

async function main() {
  await mongoose.connect(dbUrl);
  console.log("Connected to MongoDB Atlas");

  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
