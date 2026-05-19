
import express from "express";

const router = express.Router();

import { handGetPublicResponse, handGetPublicResponseStream } from "../controllers/publicController.js";

router.post('/response', handGetPublicResponse);
router.post('/response-stream', handGetPublicResponseStream);


export default router;