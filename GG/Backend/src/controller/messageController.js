import MessageModel from'../models/MessageModel.js';
import messageService from'../Service/messageService.js';
let addMessage = async (req, res) => {
    let chatId = req.body.chatId;
    let senderId = req.body.senderId;
    let text = req.body.text;
    let message = await messageService.handleMessageModel(chatId, senderId, text)
     return res.status(200).json({
             message: message.errMessage,
             messageData: message.data? message.data : {}
     })
}

let findMessage = async (req, res) => {
    let userId = req.params.chatId
    let messageData = await messageService.handleFindMessage(userId)
    return res.status(200).json({
        message: messageData.errMessage,
        chatsData: messageData.data? messageData.data : {}
    })
}

let findMessages = async (req, res) => {
    let userId = req.params.chatId
    let messageData = await messageService.handleFindMessages(userId)
    console.log(messageData)
    return res.status(200).json({
        message: messageData.errMessage,
        chatsData: messageData.data? messageData.data : {}
    })
}

const messageController = {
    addMessage: addMessage,
    findMessage: findMessage,
    findMessages: findMessages
};
export default messageController;