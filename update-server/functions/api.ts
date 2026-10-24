import express, { NextFunction, Request, Response, Router } from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

app.use(express.json());

const router = Router();


const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

const compareFirmwareVersions = (a: string, b: string) => {
  const aParsed = a.split(".").map(v => parseInt(v, 10));
  const bParsed = b.split(".").map(v => parseInt(v, 10));

  for (let i = 0; i < 3; i++) {
    if (aParsed[i] < bParsed[i]) return -1;
    if (aParsed[i] > bParsed[i]) return 1;
  }

  return 0;
}

const calculateNextFirmware = (currentVersion: string): Array<{
  version: string;
  size: number;
  app_version: string;
  description: string;
}> | null | undefined => {
  if (!SEMVER_REGEX.test(currentVersion)) return undefined;

  const updateData = fs.readFileSync(path.join(__dirname, "../files/update.json"), "ascii");
  const jsonData = JSON.parse(updateData) as {
    updates: Array<{
      version: string;
      description: string;
      required_firmware_version: string;
      required_app_version: string;
    }>
  };

  if (!jsonData.updates || jsonData.updates.length === 0) return null;

  let nextUpdate = jsonData.updates[jsonData.updates.length - 1];

  // if current version is the latest update version or more (somehow) then no update is needed so return null
  if (compareFirmwareVersions(currentVersion, nextUpdate.version) >= 0) return null;

  let latestFound = false;
  let numUpdatesNeeded = 0;
  const visitedVersions = new Set<string>();
  const updatesToDo: string[] = [];
  const appVersions: string[] = [];
  const binarySizes: number[] = [];
  const descriptions: string[] = [];

  while (!latestFound) {
    if (visitedVersions.has(nextUpdate.version) || numUpdatesNeeded >= jsonData.updates.length) {
      return undefined;
    }
    visitedVersions.add(nextUpdate.version);

    // if current version is not older than update version, update chain is inconsistent
    if (compareFirmwareVersions(currentVersion, nextUpdate.version) >= 0) {
      return undefined;
    }

    const binPath = path.join(__dirname, `../files/firmware/update-${nextUpdate.version}.bin`);
    if (!fs.existsSync(binPath)) {
      return undefined;
    }

    const { size } = fs.statSync(binPath);
    updatesToDo.push(nextUpdate.version);
    appVersions.push(nextUpdate.required_app_version);
    binarySizes.push(size);
    descriptions.push(nextUpdate.description);

    // compare to required version for update
    // if the current version is equal to or greater than the required version for install
    if (compareFirmwareVersions(currentVersion, nextUpdate.required_firmware_version) >= 0) {
      latestFound = true;
      numUpdatesNeeded++;
    } else {
      // index where the update's version is equal to the current "nextUpdate" required version for install
      const nextIndex = jsonData.updates.findIndex((update) => update.version === nextUpdate.required_firmware_version);
      if (nextIndex === -1) return undefined;

      nextUpdate = jsonData.updates[nextIndex];
      numUpdatesNeeded++;
    }
  }


  const data: Array<{
    version: string;
    size: number;
    app_version: string;
    description: string;
  }> = [];

  for (let i = 0; i < updatesToDo.length; i++) {
    data.push({
      version: updatesToDo[i],
      size: binarySizes[i],
      app_version: appVersions[i],
      description: descriptions[i],
    });
  }

  return data.reverse();
}



const auth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (authorization === undefined)
    return res.status(403).json({ error: "Missing Authorization" });

  if (authorization !== process.env.API_AUTH)
    return res.status(403).json({ error: "Invalid Authorization" });

  next(null);
}


router.get("/:version", auth, async (req, res) => {
  const version = req.params.version;

  if (!version || !SEMVER_REGEX.test(version)) {
    return res.status(400).json({ error: "Invalid or missing current firmware version." });
  }

  const pathToUpdateJson = path.join(__dirname, "../files/update.json");

  if (fs.existsSync(pathToUpdateJson)) {
    const updateData = calculateNextFirmware(version);
    if (updateData === null) {
      res.status(200).json({ message: "Up to date", updateNeeded: false });
    } else if (updateData === undefined) {
      res.status(500).json({ error: "Something went wrong while parsing version information." });
    } else {
      const data = {
        versions: updateData,
        updateNeeded: true,
      };

      res.status(200).json(data);
    }

  } else res.status(500).json({ error: "Update JSON file not found." });
});

router.get("/firmware/:version", auth, async (req, res) => {
  const versionToInstall = req.params.version as string;

  if (!versionToInstall || !SEMVER_REGEX.test(versionToInstall)) {
    return res.status(400).json({ error: "Invalid or missing target firmware version." });
  }

  const pathToUpdateBin = path.join(__dirname, `../files/firmware/update-${versionToInstall}.bin`);
  if (fs.existsSync(pathToUpdateBin)) {
    res.status(200).contentType("application/octet-stream").sendFile(pathToUpdateBin);
  } else
    res.status(500).json({ error: `Update BIN v${versionToInstall} not found` });
});


app.use("/.netlify/functions/api/update", router);

const handler = serverless(app, {
  binary: ['application/octet-stream'],
});

// @ts-ignore
module.exports.handler = async (event, context) => {
  const res = await handler(event, context);
  return res;
};