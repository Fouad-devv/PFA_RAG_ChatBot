
import express from "express";

const router = express.Router();

import { handGetResponse, handGetHistory, handGetConversation, handleNewConversation, handleDeleteConversation, handleRenameConversation } from "../controllers/homeController.js";

router.post('/response', handGetResponse);
router.post('/newChat', handleNewConversation);
router.get('/conversations', handGetHistory);
router.get('/conversations/:conversationId', handGetConversation);
router.delete('/conversations/:conversationId', handleDeleteConversation);
router.patch('/conversations/:conversationId', handleRenameConversation);

export default router;
