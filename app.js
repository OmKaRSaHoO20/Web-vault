require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const session = require('express-session');
const mongoose = require("mongoose");
const passport =require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'My secret',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/infinityDB");

const userSchema = new mongoose.Schema({
    email: String,
    password : String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
})

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:2020/auth/google/infinityvault",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
})
 
app.get("/auth/google",passport.authenticate("google", { 
    scope: ["profile"] 
}));

app.get("/auth/google/infinityvault", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect("/MainFolder");
  });

// post for register

app.get("/Register", function (req, res){
    res.sendFile(__dirname + "/Register.html");
})

// mainfolder

app.get("/MainFolder", function(req, res){
    if (req.isAuthenticated()){
        res.render("MainFolder");
    }
    else{
        res.redirect("/loginform");
    }
});

app.post("/Register", function(req,res){
    User.register({username: req.body.username}, req.body.passwod, function(err,user){
        if (err){
            console.log(err);
            res.redirect("/Register");
        }
        else{
            passport.authenticate("local")(req,req, function(){
                res.redirect("/MainFolder");
            })
        }
    })
})

// logout........

app.post("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
})

// post for Login

app.get("/loginform", function (req, res) {
    res.sendFile(__dirname + "/loginform.html");
})

app.post("/loginform", function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/MainFolder");
            })
        }
    })
})









app.listen(2020, function(){
    console.log("Server started on port 2020");
});

// GET all files.......................