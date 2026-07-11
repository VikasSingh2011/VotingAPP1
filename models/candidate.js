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
      required: false,
  },
  electionId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  manifesto:{
    type: String,
    required: true
  },
  symbol:{
    type: String,
    required: true
  },
  status:{
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  voteCount:{
    type: Number,
    default: 0//by default voteCount is 0
  }
  
});

//create user model
const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;//we have export this user in server.js