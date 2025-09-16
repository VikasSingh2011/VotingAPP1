const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file
//define the mongoDB connection URL
//const mongoURL = 'mongodb://localhost:27017/hotels'//Replace 'hotels' with your database name. This mongoURL connect local database 
const mongoURL = process.env.MONGODB_URL_LOCAL //this line tell that we use env file MONGODB_URL_LOCAL variable in our project
//const mongoURL= 'mongodb+srv://singhvikas1004_db_user:vikas12345@cluster0.zqji7a0.mongodb.net/';//this mongoURL connect online database
//const mongoURL = process.env.MONGODB_URL;//this line tell that we use env file MONGODB_URL variable in our project



//set up MongoDB connection
mongoose.connect(mongoURL,{
  //these are not needed now due to new version
  // useNewUrlParser: true,//these are mondatary parameter when we make connection
  // useUnifiedTopology: true//this is mondatary parameter when we make connection
})

//Get the default connection
//Mongoose maintains a default connection object representing the MongoDB connection
const db = mongoose.connection;//here we maintain the object

//Define event listeners for databases connection
db.on('connected', () =>{//when connection established then this message Print
  console.log('connected to MongoDB server');
});

db.on('error', (err) =>{//when error occers then this message Print
  console.error('MongoDB connection error',err);
});

db.on('disconnected', () =>{//when connection disconnect then this message Print
  console.log('connected to MongoDB server');
});