const jwt = require("jsonwebtoken");
const User = require("../model/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    //here we are getting the user so we send it in request to our route handler
    // we dont need to search for user again.

    req.user = user; // we access that in route handler function
    req.token = token;
    next();
  } catch (e) {
    //no next
    res.status(404).send({ error: "please authenticate" });
  }
};

module.exports = auth;

/*
    signing up and logging in souldnt use auth middleware
    
*/
