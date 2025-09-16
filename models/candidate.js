const mongoose = require('mongoose');//import mongoose to connect with database
//const bcrypt = require('bcrypt');//import bcrypt to hash the password

//Define the candidate schema
const candidateSchema = new mongoose.Schema({
  name:{
      type: String,
      required: true//it means name is must require during filling the form
  },
  party:{
      type: String,
      required: true,
  },
  age:{
      type: Number,
      required: true,
  },
  votes:[
    {
      user:{
        type: mongoose.Schema.Types.ObjectId,//here we use ObjectId because we want to store the id of the user who voted
        ref: 'User',//it means votes is reference to user model
        required: true
      },
      votedAt:{
        type: Date,//it means votedAt is date type
        default: Date.now//by default votedAt is current date and time
      }
    }
  ],
  voteCount:{
    type: Number,
    default: 0//by default voteCount is 0
  }
  
});

//create user model
const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;//we have export this user in server.js