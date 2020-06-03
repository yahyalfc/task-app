const express = require("express");
const router = new express.Router();

const Task = require("../model/task"); //Mongo task model

const auth = require("../middleware/authen"); //middleware

router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);
  const task = new Task({
    ...req.body, //spread operator as we need to add a new property owner
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task); //201 Created
  } catch (err) {
    res.status(400).send(err.message); //400 Bad Request
  }
});

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0 //10 results. we get first 10 results. if we want second 10 results, skip=10
//GET /tasks?sortBy=createdAt_asc (ascending) or //GET /tasks?sortBy=createdAt_desc (descending)

router.get("/tasks", auth, async (req, res) => {
  const user = req.user;

  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.status = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    console.log(parts[0], "|", parts[1]);
    sort["createdAt"] = parts[1] === "desc" ? -1 : 1; //if its descending we enter -1 else its 1.
    // part[0] contains createdAt
  }
  try {
    await user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();

    res.send(user.tasks);
  } catch (err) {
    res.status(500).send(err);
  }

  //const user = req.user;
  //await user.populate("tasks").execPopulate();
  //user.tasks now contain the tasks
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    //by doing this we can only access tasks ids whose owner is auth.user

    if (!task) {
      return res.status(500).send("Task not found");
    }
    res.send(task);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!task) {
      res.status(404).send();
    }
    res.status(200).send(task);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  const updates = Object.keys(req.body); //this takes the keys of json objects to compare to allowed keys
  const allowedUpdates = ["description", "status"]; //allowed keys
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update); //every so it is only true when all keys are there.
  });

  if (!isValidOperation) {
    res.status(400).send({ error: "Invalid updates" });
  }

  try {
    //setting it up to use middlewares
    const task = await Task.findOne({ _id, owner: req.user._id });
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    /*
    const task = await Task.findByIdAndUpdate(_id, req.body, {
      new: true, //user object now contains the new updated object
      runValidators: true, //so we run the validators defined in mongoose schema
    });
*/
    if (!task) {
      res.status(404).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
module.exports = router;

/* -- Should not be accessible

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.send(tasks);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
*/
