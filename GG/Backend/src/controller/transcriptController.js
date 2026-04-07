import { handleGenerateTranscript, handleGetTranscripts } from '../Service/transcriptService.js';

let generateTranscript = async (req, res) => {
    const { filename, sessionId, userIds, aiAccess } = req.body;
    let messageData = await handleGenerateTranscript(filename, sessionId, userIds, aiAccess);
    return res.status(200).json({
        message: messageData.errMessage,
        messageData: messageData.data ? messageData.data : {}
    });
}

let getTranscripts = async (req, res) => {
    const userId = req.params.userId;
    let messageData = await handleGetTranscripts(userId);
    return res.status(200).json({
        message: messageData.errMessage,
        messageData: messageData.data ? messageData.data : {}
    });
}


const transcriptController = {
  generateTranscript,
  getTranscripts
};


export default transcriptController;
