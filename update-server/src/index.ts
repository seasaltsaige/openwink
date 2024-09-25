import express from "express";
import Update from "./routes/Update";

const app = express();


app.use("/update", Update);


app.listen(3000, () => console.log("App listening on port 3000"));