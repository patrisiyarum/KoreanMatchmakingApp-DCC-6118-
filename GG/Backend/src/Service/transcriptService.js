import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import { promisify } from "util";
import { createRequire } from "module";

import db from '../models/index.js';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use createRequire to load the native addon (it doesn't support ES modules)
const require = createRequire(import.meta.url);

let whisperAsync = null;
try {
  const whisperBaseLocation = path.resolve("whisper.cpp");
  const moduleLocation = "build/bin/Release/addon.node.node";
  const { whisper } = require(
    path.join(whisperBaseLocation, moduleLocation)
  );
  whisperAsync = promisify(whisper);
} catch (err) {
  console.warn("Whisper native module not found — transcript generation will be unavailable.", err.message);
}

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                "-ac", "1",              // mono
                "-ar", "16000"           // 16kHz sample rate
            ])
            .output(outputPath)
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .run();
    });
}

// const modelName = "ggml-base.en.bin";
const modelName = "ggml-medium.bin";

async function transcribeAudio(filename) {
    const modelPath = path.join(whisperBaseLocation, "models", modelName);
    
    // Convert to WAV format that whisper expects
    const tempWavPath = path.join(path.dirname(filename), `temp_${Date.now()}.wav`);
    
    try {
        console.log("Converting audio to WAV format...");
        await convertToWav(filename, tempWavPath);
        
        console.log("Starting transcription...");
        const params = {
            language: "auto",
            model: modelPath,
            fname_inp: tempWavPath,
            translate: false,
            print_progress: false,
            print_realtime: false,
            print_timestamps: false,
            progress_callback: (progress) => {
                console.log(`Transcription progress: ${progress}%`);
            }
        };
        
        const result = await whisperAsync(params);
        
        // Clean up temp file
        if (fs.existsSync(tempWavPath)) {
            fs.unlinkSync(tempWavPath);
        }
        
        return result;
        
    } catch (error) {
        // Clean up temp file on error
        if (fs.existsSync(tempWavPath)) {
            fs.unlinkSync(tempWavPath);
        }
        throw error;
    }
}

// ^^^ Transcript generation
// VVV Transcript storage

/**
 * Store a new transcript with associated user accounts
 * @param {string} sessionId - Unique session identifier
 * @param {string} transcript - The transcript text content
 * @param {number[]} userAccountIds - Array of UserAccount IDs to associate with this transcript
 * @param {boolean} [aiAccess=false] - Whether AI access is enabled for this transcript
 * @returns {Promise<Object>} The created transcript with associated user accounts
 */
export async function storeTranscript(sessionId, transcript, userAccountIds, aiAccess = false) {
  console.log({sessionId, transcript, userAccountIds, aiAccess});
  try {
    // Create the transcript
    const newTranscript = await db.Transcript.create({
      sessionId,
      transcript,
      aiAccess
    });
    // Associate user accounts with the transcript
    if (userAccountIds && userAccountIds.length > 0) {
      const transcriptUsers = userAccountIds.map(userAccountId => ({
        transcriptId: newTranscript.id,
        userAccountId
      }));
      
      await db.TranscriptUser.bulkCreate(transcriptUsers);
    }
    // Fetch and return the transcript with associated user accounts
    const transcriptWithUsers = await db.Transcript.findByPk(newTranscript.id, {
      include: [{
        model: db.UserAccount,
        as: 'userAccounts',
        through: { attributes: [] }, // Exclude junction table attributes
        attributes: ['id', 'email', 'firstName', 'lastName'] // Only return needed fields
      }]
    });
    return transcriptWithUsers;
  } catch (error) {
    throw new Error(`Failed to store transcript: ${error.message}`);
  }
}

function formatLists(lists) {
  return lists
    .map(sublist => {
      if (sublist.length === 0) return ""; // handle empty sublists

      const firstPart = sublist.slice(0, 2).join("-");
      const rest = sublist.slice(2);

      // join the rest (if any) with spaces, and add to the next line
      const secondPart = rest.length ? "\n" + rest.join(" ") : "";

      return firstPart + secondPart;
    })
    .join("\n\n"); // blank line between each list
}


let handleGenerateTranscript = (filename, sessionId, userIds, aiAccess) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await transcribeAudio(filename);
            let message = {};
            message.errMessage = 'Transcript successfully created';
            message.data = formatLists(result.transcription);
            
            // Store it
            storeTranscript(sessionId, message.data, userIds, aiAccess);

            resolve(message);
        } catch (e) {
            console.error(`Error generating transcript from video with filename ${filename}`, e);
            reject(e);
        }
    });
}

export { handleGenerateTranscript };

export async function getTranscriptsByUserAccountId(userAccountId) {
  try {
    // Query through the junction table to find all transcripts for this user
    const transcriptUsers = await db.TranscriptUser.findAll({
      where: { userAccountId },
      include: [{
        model: db.Transcript,
        include: [{
          model: db.UserAccount,
          as: 'userAccounts',
          through: { attributes: [] },
          attributes: ['id', 'email', 'firstName', 'lastName']
        }]
      }]
    });

    // Extract the transcripts from the junction table results
    const transcripts = transcriptUsers.map(tu => tu.Transcript);

    return transcripts;
  } catch (error) {
    throw new Error(`Failed to retrieve transcripts for user account: ${error.message}`);
  }
}

let handleGetTranscripts = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await getTranscriptsByUserAccountId(userId);
            let message = {};
            message.errMessage = 'Transcripts retrieved';
            message.data = result;

            resolve(message);
        } catch (e) {
            console.error(`Error retrieving transcripts for userId ${userId}`, e);
            reject(e);
        }
    });
}

export { handleGetTranscripts };
