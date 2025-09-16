const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {//this function call when we hit the protected route

  //first check request headers has authorization or not
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: 'Token not found' });
  }

  //Extract the jwt token from the request header
  const token = req.headers.authorization.split(' ')[1];//here we split the bearer with the help of space then bearer keyword move pahle bale index and token move 1 index
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    //Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    //Attach the decoded user information to the request object
    req.user = decoded;
    next();//move to next phase
  }
  catch(err) {//if error occers then move to catch phase
    console.log(err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

//function to generate a JWT token for a user
const generateToken = (useData) => {
  return jwt.sign(useData, process.env.JWT_SECRET, { expiresIn: 30000000 });//here we set the token expire time 30000000 seconds
}

module.exports = {jwtAuthMiddleware, generateToken}//export this function in server.js