const exprees = require('express')//this line tell that we need a exprees.
const router = exprees.Router(); //here we create a router using express
const User = require("./../models/user");//import the user.js file in server.js
const {jwtAuthMiddleware, generateToken} = require('./../jwt');//import the jwtAuthMiddleware in userRoutes.js

//POST route to add a user
router.post('/signup', async (req,res)=>{//this function call when we hit /user
    try{
      const data =req.body//Assuming the request body contains the user data

      // ✅ Check if user is trying to signup as admin
      if (data.role === "admin") {
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
          return res.status(400).json({ error: "Only one admin is allowed in the system" });
        }
      }

      //Create a new user document using the mongoose model
      const newUser = new User(data);

      //Save the new user to the databases
      const response = await newUser.save();
      console.log('data saved');

      const payload = {//this payload use to generate the token
        id: response.id,//by using payload we set the id
      }
      console.log(JSON.stringify(payload));//print the payload in the console
      const token = generateToken(payload);//this function use to generate token
      console.log('Generated Token:', token);

      res.status(200).json({response: response, token: token});//here we send the response and token to the user
    }
    catch(err){//when try through error then they directly move in catch
      console.log(err);
      res.status(500).json({error: 'Internal Server Error'});
    }
})

//login route
router.post('/login', async (req, res)=>{
  try{
    const {aadharCardNumber, password} = req.body;//extract aadharCardNumber and password from the request body
    const user = await User.findOne({aadharCardNumber: aadharCardNumber});//find the user by aadharCardNumber

    //if user does not exist or password does not match then return error
    if(!user || !(await user.comparePassword(password))){
      return res.status(401).json({error: 'Invalid username or password'});
    }
    //generate a token for the user
    const payload = {//this payload use to generate the token
      id: user.id,//by using payload we set the id
    }
    const token = generateToken(payload);//this function use to generate the token
    //return token as response
    res.json({token})//here we send the token to the user
  }
  catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

//Profile route
router.get('/profile',jwtAuthMiddleware, async (req, res)=>{//this function call when we hit /profile
  try{
    const userdata = req.user;//extract user data from the request object, we get this user data from the jwt file
   
    const userId = userdata.id;//extract user id from the user data
    const user = await User.findById(userId);//find the user by id
    res.status(200).json({user});//send the user data as response
  }catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
})

//here we used the put method for update
router.put('/profile/password', jwtAuthMiddleware, async (req, res)=>{//this function call when we hit /profile/password
  try{
    const userID =req.user.id;//extract the id from the token
    const {currentPassword, newPassword} = req.body;//extract currentPassword and newPassword from the request body
    //Find the user by userID
    const user = await User.findById(userID);

    //If password does not match then return error
    if(!(await user.comparePassword(currentPassword))){
      return res.status(401).json({error: 'Invalid username or password'});
    }

    //Update the user's password
    user.password = newPassword;
    await user.save();//save the user

    console.log('password updated');
    res.status(200).json({message: "Password updated" });
  }
  catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
})



module.exports = router;//here we export this router in server.js