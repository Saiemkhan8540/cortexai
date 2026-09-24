import express from "express"
import { createConversation, getConversation, getConversations, getMessages, saveMessage, updateConversation } from "../controllers/chat.controller.js"
import requireInternal from "../../../shared/middleware/requireInternal.js"

const router = express.Router()

router.get("/create-conversation", createConversation)
router.get("/get-conversation", getConversations)
router.get("/get-conversations", getConversations)
router.get("/conversation/:id", getConversation)
router.post("/update-conversation", updateConversation)
// only the agent service writes messages
router.post("/save-message", requireInternal, saveMessage)
router.post("/get-messages/:conversationId", getMessages)

export default router
