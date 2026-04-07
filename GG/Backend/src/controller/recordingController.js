import { handleGenerateTranscript } from '../Service/transcriptService.js';

const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    console.log(req.body);
    var { user1Id, user2Id, timestamp, aiAccess } = req.body;
    aiAccess = (aiAccess == "true");
    
    // Generate a session ID for the transcript (using chatId or creating one)
    const sessionId = crypto.randomUUID();
    
    // Collect user IDs for transcript association
    const userIds = [user1Id, user2Id].filter(id => id != null).map(id => parseInt(id, 10));
    
    // Start transcription in the background (don't await if you want immediate response)
    // Or await if you want to include transcript in response
    handleGenerateTranscript(req.file.path, sessionId, userIds, aiAccess)
      .then(transcriptResult => {
        console.log('Transcript generated successfully:', transcriptResult.errMessage);
      })
      .catch(err => {
        console.error('Transcript generation failed:', err);
      });

    // Return the filename and metadata immediately (transcription happens in background)
    res.json({ 
      success: true, 
      message: 'Recording saved successfully, transcription started',
      filename: req.file.filename,
      localPath: req.file.path,
      metadata: {
        user1Id: user1Id,
        user2Id: user2Id,
        timestamp,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export default {
  uploadRecording
};
