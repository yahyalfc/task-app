const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

/*
const me = new User({
  name: "Yahya",
  email: "yoyo@gmail.com",
  age: 25,
  password: "princeofpersia",
});

me.save()
  .then(() => console.log(me))
  .catch((err) => console.log(err));

  */

/*
const task1 = new Task({
  description: "take a shower ",
});

task1
  .save()
  .then(console.log(task1))
  .catch((err) => console.log(err));
*/
