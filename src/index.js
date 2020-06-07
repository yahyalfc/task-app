// third party modules
const express = require("express");
const env = require("dotenv").config();
const fs = require("fs");
//mongo config
require("./db/mongoose"); //just run this file so mongo connection takes place

//import routers
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express(); //creating an express app
app.use(express.json()); //convert req object from json

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

//Routers
app.use(userRouter);
app.use(taskRouter);

// Server config
const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server is up on ", port);
});
