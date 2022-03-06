
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const res = require('express/lib/response');
const time = require(__dirname + "/time.js")

const app = express();
const messageTitle = "Anonymous ~";

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env['SECRET'],
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Admin-Aditi:aditi@cluster0.ajbdu.mongodb.net/messageDB", {useNewUrlParser: true, useUnifiedTopology : true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env['CLIENT_ID'],
    clientSecret: process.env['CLIENT_SECRET'],
    callbackURL: "https://ptg-forum.herokuapp.com/auth/google/ptg-forum",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    //passReqToCallback   : true
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const postSchema = {
  title: String,
  content: String,
  time: String
};
const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["email","profile"] })
);

app.get("/auth/google/ptg-forum",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
      res.redirect("/messages");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/messages", function(req, res){
  
  Post.find({}, function(err, posts){
    res.render("messages",{title: messageTitle, posts: posts});
  });

});

app.get("/submit", function(req, res){
  const t = time.getTime();
  if (req.isAuthenticated()){
    res.render("submit",{time: t});
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedMessage = req.body.message;
  const t= time.getTime();
  const post = new Post({
    title: messageTitle,
    content: submittedMessage,
    time: t
  });
  post.save(function(){
            res.redirect("/messages");
           });

});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.render("errorPage");
     
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/messages");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
    console.log(err);
    res.render("errorPage");
    } else {
      passport.authenticate("local")(req, res, function(){
          res.redirect("/messages");
      });
    }
  });

});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started.");
});
