import mongoose from "mongoose"
import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"

// Every route is scoped to the user the gateway authenticated.
const findOwnedConversation = async (id, userId) => {
    if (!userId || !mongoose.isValidObjectId(id)) return null
    return Conversation.findOne({ _id: id, userId })
}

export const createConversation = async(req, res) => {
    try{
        const userId = req.headers["x-user-id"]
        if(!userId){
            return res.status(401).json({message: "unauthorized"})
        }
        const conversation = await Conversation.create({
            userId: userId
        })

        return res.status(200).json(conversation)
    }catch(error){
        return res.status(500).json({message: `create conversation error ${error}`})
    }
}

export const getConversations = async(req, res) => {
    try{
        const userId = req.headers["x-user-id"]
        if(!userId){
            return res.status(401).json({message: "unauthorized"})
        }
        const conversations = await Conversation.find({
            userId: userId
        }).sort({updatedAt: -1})

        return res.status(200).json(conversations)
    }catch(error){
        return res.status(500).json({message: `get conversation error ${error}`})
    }
}

export const getConversation = async(req, res) => {
    try{
        const conversation = await findOwnedConversation(req.params.id, req.headers["x-user-id"])
        if(!conversation){
            return res.status(404).json({message: "conversation not found"})
        }
        return res.status(200).json(conversation)
    }catch(error){
        return res.status(500).json({message: `get conversation error ${error}`})
    }
}

export const updateConversation = async(req, res) => {
    try{
        const {id, title} = req.body
        const conversation = await findOwnedConversation(id, req.headers["x-user-id"])
        if(!conversation){
            return res.status(404).json({message: "conversation not found"})
        }
        conversation.title = title
        await conversation.save()

        return res.status(200).json(conversation)
    }catch(error){
        return res.status(500).json({message: `update conversation error ${error}`})
    }
}


export const saveMessage = async (req, res) => {
    try{
        const {conversationId, role, content, images, artifacts} = req.body
        const conversation = await findOwnedConversation(conversationId, req.headers["x-user-id"])
        if(!conversation){
            return res.status(404).json({message: "conversation not found"})
        }
        const message = await Message.create({
            conversationId,
            content,
            role,
            images,
            artifacts
        })
        return res.status(200).json(message)
    }catch (error){
        return res.status(500).json({message: `save message error ${error}`})
    }
}

export const getMessages = async (req, res) => {
    try{
        const conversation = await findOwnedConversation(req.params.conversationId, req.headers["x-user-id"])
        if(!conversation){
            return res.status(404).json({message: "conversation not found"})
        }
        const messages = await Message.find({
            conversationId : req.params.conversationId
        }).sort({createdAt: 1})
        return res.status(200).json(messages)
    }catch (error){
        return res.status(500).json({message: `get messages error ${error}`})
    }
}
