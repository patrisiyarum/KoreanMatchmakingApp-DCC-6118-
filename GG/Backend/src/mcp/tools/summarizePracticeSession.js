import db from "../../models/index.js";

export async function getTranscriptBySessionId(sessionId) {
  try {
    const transcript = await db.Transcript.findOne({
      where: { sessionId },
      include: [{
        model: db.UserAccount,
        as: 'userAccounts',
        through: { attributes: [] },
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });

    return transcript;
  } catch (error) {
    throw new Error(`Failed to retrieve transcript: ${error.message}`);
  }
}

export async function summarizePracticeSession(args) {
  try {
    const { chatId, userId } = args;

    console.log(args);

    const transcript = await getTranscriptBySessionId(chatId);
    
    if (!transcript) {
      return {
        error: 'Transcript not found',
        chatId
      };
    }

    const hasAccess = (
      transcript.userAccounts?.some(
        user => user.id === Number(userId)) &&
      transcript.aiAccess
    );

    if (!hasAccess) {
      return {
        error: 'Access denied',
        message: 'You do not have permission to access this transcript'
      };
    }

    const prompt = `
You are an AI language tutor. Analyze the following language practice session and provide:

1. Summary of Conversation
- Main topics discussed
- Key vocabulary and phrases used
- Notable moments or achievements

2. Grammar Feedback (Specific & Actionable)
- Quote exact sentences from the learner containing grammar mistakes
- Provide corrected versions
- Give brief explanations of the corrections

3. Word Choice and Naturalness Feedback
- Identify phrases that sound unnatural or awkward
- Provide improved alternatives
- Explain why the alternatives sound more natural

4. Goals for Improvement
Format exactly like this:
Goals for Improvement:
- GOAL 1: ...
- GOAL 2: ...
- GOAL 3: ...
(Provide 3–5 concise goals)

Return the response in clear markdown.

Transcript:
${transcript.transcript}
`;

    return {
      success: true,
      chatId: transcript.chatId,
      createdAt: transcript.createdAt,
      participants: transcript.userAccounts?.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      })),
      prompt,
      transcriptLength: transcript.transcript.length
    };

  } catch (error) {
    console.error('Error in summarizePracticeSession tool:', error);
    return {
      error: 'Failed to summarize practice session',
      details: error.message
    };
  }
}
