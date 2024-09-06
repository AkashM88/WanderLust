if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Database connection
mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.error("DB Connection Error:", err);
    });

app.set("view engine", 'ejs'); // Set view engine to EJS
app.set("views", path.join(__dirname, "views")); // Set views directory
app.engine("ejs", ejsMate); // Use ejs-mate for layouts

app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(methodOverride("_method")); // Method override for forms
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Session and flash
const sessionOptions = {
    secret: process.env.SECRET || 'defaultsecret', // Default secret for development
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true, // Prevents client-side script access to the cookie
        // secure: process.env.NODE_ENV === "production", // Uncomment if using HTTPS in production
        // sameSite: 'strict' // Uncomment if using HTTPS
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Initialize passport and handle sessions
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Handle 404 errors
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
});

// Start the server
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
