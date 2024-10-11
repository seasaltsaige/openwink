import express, { NextFunction, Request, Response, Router } from "express";
import serverless from "serverless-http";
import fs from "fs";
import path from "path";

const app = express();


const router = Router();

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (authorization === undefined)
    return res.status(403).json({ error: "Missing Authorization" });

  const macDir = path.join(__dirname, "../files/mac.json");
  if (!fs.existsSync(macDir)) return res.status(500).json({ error: "Internal Server Error" });

  const data = fs.readFileSync(macDir, "ascii");
  const jsonData = JSON.parse(data);

  if (!jsonData || !jsonData.mac_addr) return res.status(500).json({ error: "Internal Server Error" });


  const macs = jsonData.mac_addr as string[];
  if (!macs) return res.status(500).json({ error: "Internal Server Error" });

  if (!macs.includes(authorization))
    return res.status(403).json({ error: "Invalid Authorization" });


  next(null);
}


router.get("/", auth, async (req, res) => {
  const pathToUpdateJson = path.join(__dirname, "../files/update.json");

  if (fs.existsSync(pathToUpdateJson)) {
    const file = fs.readFileSync(pathToUpdateJson, "ascii");
    const data = JSON.parse(file);

    res.status(200).json(data);
  } else
    res.status(500).json({ error: "Update JSON file not found" });
});

router.get("/firmware", /**auth**/ async (req, res) => {
  const pathToUpdateBin = path.join(__dirname, "../files/update.bin");
  console.log(pathToUpdateBin);
  if (fs.existsSync(pathToUpdateBin)) {
    const blob = await fs.openAsBlob(pathToUpdateBin);
    // console.log(new Blob([blob], { type: "application/octet-stream" }));
    // console.log(new Uint8Array(await blob.arrayBuffer()));
    // const blobOctet = blob.slice(0, blob.size, "application/octet-stream");
    // res.status(200).sendFile()
    // res.writeHead(200, {
    //   'Content-Type': "application/octet-stream",
    //   'Content-Length': blob.size,
    // });

    // const base64 = fs.readFileSync(pathToUpdateBin, "base64");
    // console.log(base64);
    // res.status(200).send(base64);
    res.status(200).contentType("application/octet-stream").sendFile(pathToUpdateBin);
  } else
    res.status(500).json({ error: "Update BIN file not found" });
});

router.post("/firmware", express.raw({ limit: "2mb" }), async (req, res) => {
  const data = req.body;
  const blob = new Blob([data], { type: "application/octet-stream" });
  console.log(new Uint8Array(await blob.arrayBuffer()));
  res.sendStatus(200);
});


app.use("/.netlify/functions/api/update", router);

const handler = serverless(app, {
  binary: ['application/json', 'application/octet-stream'],
});

//@ts-ignore
module.exports.handler = async (event, context) => {
  const res = await handler(event, context);
  return res;
};