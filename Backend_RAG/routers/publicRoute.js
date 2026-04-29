
import express from "express";

const router = express.Router();

import { handGetPublicResponse } from "../controllers/publicController.js";

router.post('/response', handGetPublicResponse);


export default router;