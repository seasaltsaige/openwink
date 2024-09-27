import express from "express";
import serverless from "serverless-http";
import Update from "../routes/Update";

const app = express();


app.use("/.netlify/functions/update", Update);


module.exports.handler = serverless(app);