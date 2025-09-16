const express = require('express')//this line tell that we need a exprees.
const app = express();//here we store the express function in app.
require('dotenv').config();//line tell that we use dotenv file in our project
const db = require('./db');//import the db.js file in server.js to connect with database
 
//different person are send data in different format so we use body-parser is a middleware to parse the JSON data form the request body and convert into a JavaScript object that we can work with in our server.
const bodyParser = require('body-parser');//we need body-parser in our project
app.use(bodyParser.json());//line tell that we use body-parser in json format
const PORT = process.env.PORT || 3000;//here we use .env file PORT variable if PORT variable not found then they use 3000

const {jwtAuthMiddleware} = require('./jwt');//import the jwtAuthMiddleware in server.js

//Import the router files
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

//use the routers
app.use('/user',jwtAuthMiddleware, userRoutes);//we use the userRoutes in server.js
app.use('/candidate', candidateRoutes);//we use the userRoutes in server.js

app.listen(PORT,()=>{//this is the location of the server
  console.log('listening on port 3000');
})
