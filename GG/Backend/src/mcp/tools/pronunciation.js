import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv"; dotenv.config();
import db from "../../models/index.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

async function getRatingsByUserId(userId) {
  const ratings = await db.PronunciationRatings.findAll({
    where: { userId },
    attributes: ['rating', 'time'],
    order: [['time', 'DESC']],
  });

  return ratings;
}

export async function addRating(userId, rating) {
  try {
    const newRating = await db.PronunciationRating.create({
      userId,
      rating,
      // time will be set automatically via defaultValue
    });
    return true;
  } catch (error) {
    console.log(`Error adding rating to the database: ${error}`);
    return false;
  }
}

export async function pronunciationHelp(args) {
  try {
    const { userId, audioPart } = args;
    console.log(`[pronunciationHelp] called with userId: ${userId} and audio file`);

    if (!userId) {
      return {
        success: false,
        error: "userId is required",
      };
    }

    const quantPrompt = `
      Given this audio recording, give the user a score from 1-10 (decimal is fine) based on their pronunciation. Grade the user ONLY on their pronunciation, not grammar or anything else.

    Return ONLY the number, such as 7.5 or 2.3.
`;

    const qualPrompt = `
      Given this audio recording, give the user qualitative feedback on their pronunciation.
      Do not give the user a numerical grade. Give the user specific things that they can improve on in their chosen language.
`;

    // rate the user's pronunciation quantitatively

    const quantParts = [{ text: quantPrompt }].concat(audioPart);
    const quantResponse = await model.generateContent({
      contents: [{ role: "user", parts: quantParts }]
    });
    const quantResponseText = quantResponse.response.text().trim();
    var numericalRating;
    try {
      numericalRating = parseFloat(quantResponseText);
    } catch (err) {
      console.log("Failed to get numerical rating");
      numericalRating = null;
    }

    // rate the user's pronunciation qualitatively
    const qualParts = [{ text: qualPrompt }].concat(audioPart);
    const qualResponse = await model.generateContent({
      contents: [{ role: "user", parts: qualParts }]
    });
    const qualResponseText = qualResponse.response.text();
    
    // save to database
    addRating(userId, numericalRating);
    
    const savedToDb = false;

    console.log(`Quantitative Score: ${numericalRating}`);

    return {
      success: true,
      numericalRating: numericalRating,
      qualitativeResponse: qualResponseText,
      savedToDB: savedToDb,
    }


  } catch (error) {
    console.log(`Error calling pronunciationHelp: ${error}`)
    return {
      success: false,
      error: error
    }
  }
}
