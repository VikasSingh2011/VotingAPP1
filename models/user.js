const mongoose = require('mongoose');//import mongoose to connect with database
const bcrypt = require('bcrypt');//import bcrypt to hash the password

//Define the user schema
const userSchema = new mongoose.Schema({
  name:{
      type: String,
      required: true//it means name is must require during filling the form
  },
  age:{
      type: Number,
      required: true,
  },
  email:{
      type: String,
      required: true,
  },
  mobile:{
      type: String,
  },
  address:{
      type: String,
      required: true,
  },
  aadharCardNumber:{
      type: Number,
      required: true,
      unique: true,//it means no two user have same aadharCardNumber
  },
  password:{
      type: String,
      required: true,
  },
  role:{
      type: String,
      enum: ['voter', 'admin'],//it means role is either voter or admin
      default: 'voter'//by default role is voter}
  },
  isVoted:{
    type: Boolean,
    default: false//by default isVoted is false
  },
  isVerified:{
    type: Boolean,
    default: false
  }
});

//Hash the password before saving the user document
userSchema.pre('save', async function(next){//this function call before saving the data in the database
  const user = this;//here this represent the current document being saved
  //hash the password only if it has been modified or is new
  if(!user.isModified('password')) return next();//if password is not modified then move to next phase 

  try{//hash password generation
    const salt = await bcrypt.genSalt(10);//generate a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(user.password, salt);//hash the password using the generated salt
    user.password = hashedPassword;//replace the plain text password with the hashed password
    next();
  }
  catch(err){
    return next(err);//if error occers then move to next phase
  }
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    //use bcrypt to compare the hashed password
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
      throw error;
  }
}

//create user model
const User = mongoose.model('User', userSchema);
module.exports = User;//we have export this user in server.js