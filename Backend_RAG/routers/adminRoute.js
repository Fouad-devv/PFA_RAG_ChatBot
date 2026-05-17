import express from "express";
import multer from "multer";
import { requireAdmin } from "../Middleware/requireAdmin.js";
import {
  deleteChunk,
  deleteDocument,
  getStats,
  listChunks,
  listDocuments,
  reingestAll,
  uploadPDF,
} from "../controllers/adminController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAdmin);

router.get("/stats", getStats);
router.get("/documents", listDocuments);
router.delete("/documents/:filename", deleteDocument);
router.get("/chunks", listChunks);
router.delete("/chunks/:id", deleteChunk);
router.post("/upload", upload.single("file"), uploadPDF);
router.post("/reingest", reingestAll);

export default router;
