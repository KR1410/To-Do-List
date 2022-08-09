//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ =require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-Atishay:Aaarjain@cluster0.sgdkm.mongodb.net/todolistDB");
// mongoose.connect("mongodb://localhost:27017/todolistDB");

const userSchema= new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= new mongoose.model("User", userSchema);

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
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/list",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/list"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const itemsSchema= {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete your item."
})

const defaultItems= [item1,item2,item3];

const listSchema={
  name: String,
  items: [itemsSchema]
}

const List=mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  res.render("home");
});

app.get("/auth/google", passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/list",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    Item.find({}, function(err, foundItems){

      if(foundItems.length===0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("Successfully inserted default items.");
          }
        });
        res.redirect("/list");
      }
      else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

    })

  });

  app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/list",
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    Item.find({}, function(err, foundItems){

      if(foundItems.length===0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("Successfully inserted default items.");
          }
        });
        res.redirect("/");
      }
      else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

    })
  });


  app.get("/login",function(req,res){
    res.render("login");
  })

  app.get("/register",function(req,res){
    res.render("register");
  })

  app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
  })

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(listName);

  const item =new Item({
    name: itemName
  })

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err,foundList){

        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);


    });
  }

});

app.post("/register", function(req,res){

  User.register({username: req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/list");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/list");
      });
    }
  });
});

app.post("/login", function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/list");
      })
    }
  })
})

app.post("/delete", function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName= req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    })
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }

})

app.get("/:customListName", function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList){
        const list=new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{

        res.render("list", {listTitle: customListName, newListItems: foundList.items})
      }
    }
  })
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT||3000, function() {
  console.log("Server started Successfully.");
});
