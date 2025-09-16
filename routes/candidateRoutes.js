const express = require('express')//this line tell that we need a exprees.
const router = express.Router(); //here we create a router using express
const User = require("./../models/user");//import the user.js file in server.js
const {jwtAuthMiddleware, generateToken} = require('./../jwt');//import the jwtAuthMiddleware in userRoutes.js
const Candidate = require("./../models/candidate");//import the candidate.js file in server.js

//function to check the user role is admin or not
const checkAdminRole = async(userID) => {
  try{
    const user = await User.findById(userID);//find the candidate by id
    return user.role === 'admin';//return true if role is admin else false
  }
  catch(err){
    return false;//if error occers then return false
  }
}

//POST route to add a candidate
router.post('/',jwtAuthMiddleware, async (req,res)=>{//this function call when we hit /user
    try{
      if(! await checkAdminRole(req.user.id))
        return res.status(403).json({message:'user does not have admin role'});//if role is not admin then return access denied

      const data =req.body//Assuming the request body contains candidate data

      //Create a new candidate document using the mongoose model
      const newCandidate = new Candidate(data);

      //Save the new candidate to the databases
      const response = await newCandidate.save();
      console.log('data saved');

      res.status(200).json({response: response});//here we send the response to the candidate
    }
    catch(err){//when try through error then they directly move in catch
      console.log(err);
      res.status(500).json({error: 'Internal Server Error'});
    }
})

//here we used the put method for update
router.put('/:candidateID',jwtAuthMiddleware, async (req, res)=>{//this function call when we hit /candidateID
  try{
     if(! await checkAdminRole(req.user.id))
        return res.status(403).json({message:'user does not have admin role'});//if role is not admin then return access denied

      const candidateID = req.params.candidateID;//extract candidateID from the request parameters
      const updateCandidateData = req.body;//extract update candidate data from the request body

      const response = await Candidate.findByIdAndUpdate(candidateID, updateCandidateData, {
        new: true,//Return the updated document
        runValidators: true,//Run Mongoose validators on the update data
      });

      if(!response){
        return res.status(404).json({error: 'Candidate not found'});//if candidate not found then return error
      }

      console.log('Candidate data updated ');
      res.status(200).json(response);//here we send the response to the candidate
  }
  catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
})

//here we used the delete method for delete
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{//this function call when we hit /candidateID
  try{
     if(! await checkAdminRole(req.user.id))
        return res.status(403).json({message:'user does not have admin role'});//if role is not admin then return access denied

      const candidateID = req.params.candidateID;//extract candidateID from the request parameters

      const response = await Candidate.findByIdAndDelete(candidateID);

      if(!response){
        return res.status(404).json({error: 'Candidate not found'});//if candidate not found then return error
      }

      console.log('Candidate deleted ');
      res.status(200).json(response);//here we send the response to the candidate
  }
  catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
})

//lets start  voting
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res)=>{//this function call when we hit /vote/candidateID
  //no admin can vote 
  //user can vote only one time
  candidateID = req.params.candidateID;//extract candidateID from the request parameters
  userID = req.user.id;//extract the id from the token
  try{
      //find the Candidate document with the specified candidateID
      const candidate = await Candidate.findById(candidateID);
      if(!candidate){
        return res.status(404).json({message: 'Candidate not found'});//if candidate not found then return error
      }
      const user = await User.findById(userID);//find the user by id
      if(!user){
        return res.status(404).json({message: 'User not found'});//if user not found then return error
      }
      if(user.isVoted){
        res.status(400).json({message: 'User has already voted'});//if user already voted then return error
      }
      if(user.role === 'admin'){
        res.status(403).json({message: 'Admin cannot vote'});//if user is admin then return error
      }
      //update the vote count of the candidate
      candidate.votes.push({user: userID});//push the userID in the votes array
      candidate.voteCount++;//increment the voteCount by 1
      await candidate.save();//save the candidate

      //update the user document to indicate that the user has voted
      user.isVoted = true;//set isVoted to true
      await user.save();//save the user

      res.status(200).json({message: 'Vote recorded successfully'});//here we send the response to the candidate
  }
  catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

//vote count route
router.get('/vote/count', async (req, res)=>{//this function call when we hit /vote/count
  try{
      const candidate = await Candidate.find().sort({voteCount: -1});//find the candidate and sort them in descending order of voteCount
      //Map the candidate to only return their name and voteCount
      const voteRecord = candidate.map((data)=>{
        return {
          party: data.party,
          count: data.voteCount
        }
      });
      return res.status(200).json(voteRecord);//here we send the response to the candidate
    }
  catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

//here we
router.get('/candidate', async (req, res) => {
  try{

  }catch(err){
    
  }
})

module.exports = router;//here we export this router in server.js