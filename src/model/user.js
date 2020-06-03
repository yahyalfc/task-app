const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Task = require("../model/task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, //trimming spaces before after data
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Negative age not allowed");
        }
      },
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("This is not a valid email.");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.includes("password")) {
          throw new Error(`Password contains the string 'passowrd'`);
        }
      },
      minlength: 6,
    },
    avatar: {
      type: Buffer,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// local field is id on our user and foreign is owner in task which are linked
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

//statics are available on our models
//methods are available on instances

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  //we dont get these when we view data
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

//UserCredentials for login
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error({ err: "Unable to login" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch === false) {
    throw new Error({ err: "Unable to login" });
  }

  return user;
};

/*
  .validate -  run middleware just before or after validation
  .save -  run middleware just before or after saving
  .remove - //
  .init - //
*/

//pre - doing something before an event - like after validation or saving
//post - doing something after an event - like after validation or saving

//hash the plain text password before saving
userSchema.pre("save", async function (next) {
  //cant be an arrow function cuz 'this' binding plays an important role
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next(); // to move on towards next step. else it gets stuck here
});

//delete tasks when user is deleted
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next();
});
const User = mongoose.model("User", userSchema);

module.exports = User;

/*
 const task = await Task.findOne('')
 await task.populate('owner).execPopulate()
 task.owner <- now has the user object that created this task thanks to owner field

 const user = await User.findById('')
 await user.populate('tasks').execPopulate()
 user.tasks <- now is an array of objects which contains each users tasks. 

 */
