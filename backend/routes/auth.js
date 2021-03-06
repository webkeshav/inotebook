const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const fetchuser = require('../Middleware/fetchuser')

const JWT_SECRET = 'Keshavisagoodb$oy';

//Route 1 : Create a user using : POST "/api/auth/"  Doesn't requite AUTH
router.post(
  "/createuser",
  [
    body("name").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 5 }),
  ],
  async(req, res) => {
    let success = false;
    // If there are errors then send bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success,errors: errors.array() });
    }

// Check weather the user with this email already exists
try{
let user = await User.findOne({email : req.body.email});
if(user){
   return  res.status(400).json({success,error:"A user with this email already exist"});
}
const salt = await bcrypt.genSalt(10);
const secPass = await bcrypt.hash(req.body.password,salt);
// create a new user
    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      })
const Data = {
    user:{
        id: user.id
    }

}
      const authToken = jwt.sign(Data, JWT_SECRET);
      success = true;
     res.json({success,authToken});

  }catch(err){
    console.error(err.message);
    res.status(500).send("some erroe occured");
  }
}
)
//Route 2 : Authenticating a user with email and password : POST "/api/auth/"  requite AUTH
router.post(
    "/login",
    [
      body("email").isEmail(),
      body("password", "Password cannont be blank").exists()
    ],
    async(req, res) => {
      let success = false;

      // If there are errors then send bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const {email, password} = req.body;
      try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error: "Please try to login with correct credentials"});
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
          success=false;
            return res.status(400).json({success, error: "Please try to login with correct credentials"});
        }
        const Data = {
            user:{
                id: user.id
            }
        
        }
              const authToken = jwt.sign(Data, JWT_SECRET);
             success = true; 
             res.json({success,authToken});
      } catch(err){
        console.error(err.message);
        res.status(500).send("Internal Server Error");
      }
    }
)


//Route 3 : Create a user using : POST "/api/getuser/"   require AUTH
router.post(
    "/getuser",
    fetchuser,
    async(req, res) => {
try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send({user});
    
} catch(err){
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
    }
    )

module.exports = router;
