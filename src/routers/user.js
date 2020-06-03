const express = require("express");
const router = new express.Router();

//third party modules
const multer = require("multer");
const sharp = require("sharp");

//Mongo user model
const User = require("../model/user");

//authentification middleware running
const auth = require("../middleware/authen");

//                     Public routes

//Sign-up
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token }); //201 Created
  } catch (err) {
    res.status(400).send(err);
  }
});

//Sign-in
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (err) {
    res.status(404).send();
  }
});

//Sign Out
router.post("/users/logout", auth, async (req, res) => {
  //we get the user from req.user from auth file
  try {
    /*
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token != req.token;
    });
    await req.user.save();
    res.send();
    */

    req.user.tokens = req.user.tokens.forEach((token, index, object) => {
      if (token === req.token) {
        object.splice(index, 1);
      }
    });
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(401).send(err);
  }
});

//Signout all devices
router.post("/users/logoutall", auth, async (req, res) => {
  //we get the user from req.user from auth file
  try {
    req.user.tokens = []; //clearing out all tokens
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(500).send(err);
  }
});

//                      Private routes

// IMAGE

const upload = multer({
  // dest: "images", // in order to not save in images folder but db
  limits: {
    fileSize: 1000000, //1mb
  },
  fileFilter(req, file, callback) {
    if (file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      callback(undefined, true);
    } else {
      return callback(new Error("Please upload an image."));
    }
  },
});

router.post(
  "/users/me/avatar",
  auth, //authenticate before upload
  upload.single("avatar"),
  async (req, res) => {
    // we will use sharp here to edit pic before saving it into db
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer(); //req.file.buffer contains the image/file uploaded

    req.user.avatar = buffer;
    // req.user.avatar = req.file.buffer;   //req.file.buffer contains the image/file uploaded
    await req.user.save(); //saving the user
    res.sendStatus(200);
  },
  (error, req, res, next) => {
    //for handling errors
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/users/avatar/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error("not found");
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send(err.message);
  }
});

router.get("/users/me", auth, async (req, res) => {
  //we get the user from req.user from auth file
  res.send(req.user);
});

router.delete("/users/me", auth, async (req, res) => {
  //user is passed down from auth middleware
  try {
    await req.user.remove();
    res.status(200).send(req.user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body); //this takes the keys of json objects to compare to allowed keys
  const allowedUpdates = ["name", "email", "password", "age"]; //allowed keys
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update); //every so it is only true when all keys are there.
  });

  if (!isValidOperation) {
    res.status(400).send({ error: "Invalid updates" });
  }

  try {
    //password setting for bcrypt middleware to run
    const user = req.user;
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    await user.save();

    /*
    const user = await User.findByIdAndUpdate(_id, req.body, {
      new: true, //user object now contains the new updated object
      runValidators: true, //so we run the validators defined in mongoose schema
    });
  */

    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;

// OLD CODE
/*
//get all users
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(500).send(err); //internal server problem
  }
});
*/

/*  -- Should not work cuz we cant allow anyone to see all users.

router.get("/users/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send("User not found"); //404 not found
    }
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
*/

/* -- Should not work cuz cant allow a user to delete other id's

router.delete("/users/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findByIdAndDelete(_id);

    if (!user) {
      res.status(404).send();
    }
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
*/

/*
router.patch("/users/:id", async (req, res) => {
  const _id = req.params.id;

  const updates = Object.keys(req.body); //this takes the keys of json objects to compare to allowed keys
  const allowedUpdates = ["name", "email", "password", "age"]; //allowed keys
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update); //every so it is only true when all keys are there.
  });

  if (!isValidOperation) {
    res.status(400).send({ error: "Invalid updates" });
  }

  try {
    //password setting for bcrypt middleware to run
    const user = await User.findById(_id);
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    await user.save();

    /*
    const user = await User.findByIdAndUpdate(_id, req.body, {
      new: true, //user object now contains the new updated object
      runValidators: true, //so we run the validators defined in mongoose schema
    });
  * /
    if (!user) {
      res.status(404).send();
    }
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
*/
