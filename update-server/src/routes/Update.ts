import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/", async (req, res) => {
    const pathToUpdateJson = path.join(__dirname, "../Update/update.json");
    const pathToUpdateBin = path.join(__dirname, "../Update/update.bin");

    if (fs.existsSync(pathToUpdateJson)) {
        const file = fs.readFileSync(pathToUpdateJson, "ascii");
        const data = JSON.parse(file);

        if (fs.existsSync(pathToUpdateBin)) {
            const bin = fs.createReadStream()
        }

        res.json(data).send(200);

    } else
        res.json({ error: "Update JSON file not found" }).status(500);

});

export default router;