import db from "../../models/index.js";
import { Op } from "sequelize";

/**
 * Partner Matching Tool
 * Finds compatible language practice partners based on:
 * - Language swap (most important): native/target languages should be swapped
 * - Similar interests
 * - Close in age
 * - Same gender
 * - Optional: zodiac sign, MBTI (if specified in criteria)
 */
export async function partnerMatching(args) {
  try {
    const { userId, criteria = {} } = args;

    console.log(`[partnerMatching] Called with userId: ${userId} (type: ${typeof userId}), criteria:`, criteria);

    if (!userId) {
      return {
        error: "userId is required",
      };
    }

    // Ensure userId is a number
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(numericUserId)) {
      return {
        error: "Invalid userId",
        details: `userId must be a number, got: ${userId} (type: ${typeof userId})`
      };
    }

    // Fetch the requesting user's profile with interests
    const user = await db.UserProfile.findOne({
      where: { id: numericUserId },
      include: [
        {
          model: db.Interest,
          through: { attributes: [] },
          attributes: ["id", "interest_name"],
        },
      ],
    });

    if (!user) {
      console.log(`[partnerMatching] User profile not found for userId: ${numericUserId}`);
      return {
        error: "User profile not found",
        details: `No profile found for userId: ${numericUserId}`
      };
    }

    console.log(`[partnerMatching] Found user: ${numericUserId}, native: ${user.native_language}, target: ${user.target_language}`);

    // Fetch user account for name
    const userAccount = await db.UserAccount.findByPk(numericUserId);
    if (!userAccount) {
      console.log(`[partnerMatching] UserAccount not found for userId: ${numericUserId}`);
      return {
        error: "User account not found",
        details: `No account found for userId: ${numericUserId}`
      };
    }

    // Find all other users whose native language matches user's target language
    // and whose target language matches user's native language (language swap)
    const potentialMatches = await db.UserProfile.findAll({
      where: {
        id: { [Op.ne]: numericUserId }, // Exclude self
        native_language: user.target_language,
        target_language: user.native_language,
      },
      include: [
        {
          model: db.Interest,
          through: { attributes: [] },
          attributes: ["id", "interest_name"],
        },
      ],
    });

    console.log(`[partnerMatching] Found ${potentialMatches.length} potential matches with language swap`);

    // Calculate compatibility scores
    const matchesWithScores = [];

    for (const match of potentialMatches) {
      // Fetch match's account for name
      const matchAccount = await db.UserAccount.findByPk(match.id);

      if (!matchAccount) continue;

      let score = 0;

      // Language swap is already guaranteed by the query, but we give it high weight
      // This ensures language swap is the most important factor
      score += 100; // Base score for language swap match

      // Calculate shared interests
      const userInterestNames = (user.Interests || []).map((i) => i.interest_name);
      const matchInterestNames = (match.Interests || []).map((i) => i.interest_name);
      const sharedInterests = matchInterestNames.filter((n) =>
        userInterestNames.includes(n)
      );
      score += 2 * sharedInterests.length; // 2 points per shared interest

      // Age compatibility (closer age = higher score)
      const ageDiff = Math.abs((user.age || 0) - (match.age || 0));
      score += Math.max(0, 10 - ageDiff * 0.3); // Up to 10 points, decreases with age difference

      // Gender match (same gender = bonus)
      if (user.gender && match.gender && user.gender === match.gender) {
        score += 6;
      }

      // Optional criteria: Zodiac sign
      if (criteria.zodiac && match.zodiac && match.zodiac === criteria.zodiac) {
        score += 5;
      }

      // Optional criteria: MBTI
      if (criteria.mbti && match.mbti && match.mbti === criteria.mbti) {
        score += 5;
      }

      // Profession match (bonus)
      if (user.profession && match.profession && user.profession === match.profession) {
        score += 5;
      }

      matchesWithScores.push({
        userId: match.id,
        firstName: matchAccount.firstName,
        lastName: matchAccount.lastName,
        age: match.age,
        gender: match.gender,
        profession: match.profession,
        nativeLanguage: match.native_language,
        targetLanguage: match.target_language,
        targetLanguageProficiency: match.target_language_proficiency,
        mbti: match.mbti,
        zodiac: match.zodiac,
        sharedInterests: sharedInterests,
        compatibilityScore: parseFloat(score.toFixed(2)),
      });
    }

    // Sort by compatibility score (highest first)
    matchesWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Return top 10 matches
    const topMatches = matchesWithScores.slice(0, 10);

    console.log(`[partnerMatching] Returning ${topMatches.length} top matches out of ${matchesWithScores.length} total`);

    return {
      success: true,
      user: {
        userId: user.id,
        name: `${userAccount.firstName} ${userAccount.lastName}`,
        nativeLanguage: user.native_language,
        targetLanguage: user.target_language,
      },
      matches: topMatches,
      totalMatches: matchesWithScores.length,
    };
  } catch (error) {
    console.error("partnerMatching error:", error);
    return {
      error: "Failed to find matches",
      details: error.message,
    };
  }
}

