import dotenv from 'dotenv';
dotenv.config();
import {
  getProfileCustomizationOptions as loadProfileCustomizationConfig,
  validateProfileCustomizationFields,
} from '../Service/profileValidation.js';
import { pool } from '../config/connectDB.js'; //TOWNSHEND: this was formally connected to sequelize...
//but the methods were using .execute method, so I changed the import to the pool object
import db from '../models/index.js';
import { createZoomMeeting, hasZoomConfig } from '../Service/zoomService.js';
import agoraToken from 'agora-token';

const { RtcTokenBuilder, RtcRole } = agoraToken;

const READD_COOLDOWN_HOURS = 24;
const isPostgres = (process.env.DB_DIALECT || 'mysql') === 'postgres';

const isProfileComplete = (profile) => {
  if (!profile) return false;

  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  };

  // Keep this aligned with actual required fields in profile setup/update UI.
  // Optional fields should not block friend discovery.
  return Boolean(
    hasValue(profile.native_language) &&
    hasValue(profile.target_language) &&
    hasValue(profile.target_language_proficiency) &&
    hasValue(profile.age) &&
    hasValue(profile.profession)
  );
};

const getProfileByUserId = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM UserProfile WHERE id = ?', [userId]);
  return rows[0] || null;
};

/** MySQL / Postgres “column missing” — e.g. migration 15 not applied on server */
const isMissingColumnDbError = (error) => {
  if (!error) return false;
  if (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054) return true;
  if (error.code === '42703') return true;
  const msg = String(error.message || '');
  if (/Unknown column/i.test(msg)) return true;
  if (/does not exist/i.test(msg) && /column/i.test(msg)) return true;
  return false;
};

const isMissingBioColumnDbError = (error) => {
  if (!isMissingColumnDbError(error)) return false;
  const msg = String(error.message || error.sqlMessage || '');
  return /\bbio\b/i.test(msg);
};

const getProfileCustomizationOptions = (req, res) => {
  try {
    return res.status(200).json({ message: 'ok', data: loadProfileCustomizationConfig() });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sortedPair = (userId1, userId2) => {
  const a = Math.min(Number(userId1), Number(userId2));
  const b = Math.max(Number(userId1), Number(userId2));
  return { a, b };
};
//TOWNSHEND: getAllUsers may be the best way to sort users on a page since all data on a UserAccount is attached to the user
// I can explore this more
let getAllUsers = async (req, res) => {
    const [rows, fields] = await pool.execute(`SELECT * FROM useraccount`);
    return res.status(200).json({
        message: 'ok',
        data: rows
    })
}

let createNewUser = async (req, res) => { //POST function
    let { firstName, lastName, email, address } = req.body;
    if (!firstName || !lastName || !email || !address) {
        return res.status(200).json({
            message: 'missing @params'
        })
    }
    await pool.execute('insert into useraccount(firstName, lastName, email, address) values(?, ?, ?, ?)', [firstName, lastName, email, address]);
    return res.status(200).json({
        message: 'ok'
    })
}

let updateUser = async (req, res) => { // PUT function
    let { firstName, lastName, email, address, id } = req.body;
    if (!firstName || !lastName || !email || !address || !id) {
        return res.status(200).json({
            message: 'missing @params'
        })
    }

    await pool.execute('update useraccount set firstName = ?, lastName= ?, email = ?, address= ? WHERE id = ?',
        [firstName, lastName, email, address, id]);
    return res.status(200).json({
        message: 'ok'
    })
    
}

let deleteUser = async (req, res) => { // DELETE function
    const userId = Number(req.params.id);
    if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ message: 'missing or invalid id' });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        // Defensive cascade: explicitly clear rows in tables that may not have ON DELETE CASCADE
        // in every deployed environment. Errors on missing tables are swallowed individually
        // so a single missing optional table can't fail the whole delete.
        const cascadeStatements = [
            ['DELETE FROM FriendRequest WHERE pairUser1Id = ? OR pairUser2Id = ?', [userId, userId]],
            ['DELETE FROM FriendsModel WHERE user1_ID = ? OR user2_ID = ?', [userId, userId]],
            ['DELETE FROM ChatModel WHERE senderId = ? OR receiverId = ?', [userId, userId]],
            ['DELETE FROM MessageModel WHERE senderId = ?', [userId]],
            ['DELETE FROM PostcardModel WHERE senderId = ? OR recipientId = ?', [userId, userId]],
            ['DELETE FROM PostcardRecentMediaModel WHERE userId = ?', [userId]],
            ['DELETE FROM Challenge WHERE challengerId = ? OR challengedId = ?', [userId, userId]],
            ['DELETE FROM GameSession WHERE userId = ?', [userId]],
            ['DELETE FROM TeamInvite WHERE userId = ?', [userId]],
            ['DELETE FROM TeamMember WHERE userId = ?', [userId]],
            ['DELETE FROM VideoCallInvite WHERE callerId = ? OR calleeId = ?', [userId, userId]],
            ['DELETE FROM MeetingModel WHERE hostId = ? OR attendeeId = ?', [userId, userId]],
            ['DELETE FROM TranscriptUsers WHERE userId = ?', [userId]],
            ['DELETE FROM Transcripts WHERE userId = ?', [userId]],
            ['DELETE FROM AIChats WHERE userId = ?', [userId]],
            ['DELETE FROM UserTranslations WHERE userId = ?', [userId]],
            ['DELETE FROM UserQuestProgress WHERE userId = ?', [userId]],
            ['DELETE FROM UserBadge WHERE userId = ?', [userId]],
            ['DELETE FROM UserInterest WHERE user_id = ?', [userId]],
            ['DELETE FROM UserAvailability WHERE userId = ?', [userId]],
            ['DELETE FROM PronunciationRatings WHERE userId = ?', [userId]],
            ['DELETE FROM UserRatings WHERE userId = ?', [userId]],
            // UserProfile FK on the live DB lacks ON DELETE CASCADE, so delete it explicitly.
            ['DELETE FROM UserProfile WHERE id = ?', [userId]],
        ];
        for (const [sql, params] of cascadeStatements) {
            try {
                await conn.execute(sql, params);
            } catch (e) {
                if (e && e.code !== 'ER_NO_SUCH_TABLE' && e.code !== 'ER_BAD_FIELD_ERROR') {
                    throw e;
                }
            }
        }
        await conn.execute('DELETE FROM useraccount WHERE id = ?', [userId]);
        await conn.commit();
        return res.status(200).json({ message: 'ok' });
    } catch (err) {
        if (conn) {
            try { await conn.rollback(); } catch {}
        }
        console.error('deleteUser failed:', err);
        return res.status(500).json({
            message: 'Could not delete user',
            error: err && err.message ? err.message : String(err),
        });
    } finally {
        if (conn) conn.release();
    }
};
const getUserPreferences = async (req , res) => {
  try {
    const [userPreferences] = await pool.execute(`SELECT * FROM UserProfile`); 
    res.status(200).json({
      message: 'ok',
      data: userPreferences
    });
  } catch (error) {
    console.error('Error retrieving user names:', error); // Log error details
    res.status(500).json({
      message: 'Error retrieving preferences',
      error: error.message
    });
  }
}
//TOWNSHEND: I created a simpler function that isolated the user firstName and lastName
// but may not be good for sorting.
const getUserNames = async (req, res) => {
    try {
      const requesterId = Number(req.query.requesterId || 0);
      if (requesterId) {
        const requesterProfile = await getProfileByUserId(requesterId);
        if (!isProfileComplete(requesterProfile)) {
          return res.status(403).json({
            message: 'Complete your profile before searching for friends.',
            code: 'PROFILE_INCOMPLETE',
          });
        }
      }

      const sql = requesterId
        ? `SELECT * FROM useraccount WHERE id <> ?`
        : `SELECT * FROM useraccount`;
      const params = requesterId ? [requesterId] : [];
      const [users] = await pool.execute(sql, params); // uses mysql2 function to access database
      res.status(200).json({
        message: 'ok',
        data: users
      });
    } catch (error) {
      console.error('Error retrieving user names:', error); // Log error details
      res.status(500).json({
        message: 'Error retrieving user names',
        error: error.message
      });
    }
};

/**
 * Discover users for Find Friends: join account + profile, optional filters on learning goal,
 * communication style, commitment, optional name/email search; sort by affinity or name.
 */
const getDiscoverUsers = async (req, res) => {
  try {
    const requesterId = Number(req.query.requesterId || 0);
    if (!requesterId) {
      return res.status(400).json({ message: 'requesterId is required' });
    }

    const requesterProfile = await getProfileByUserId(requesterId);
    if (!isProfileComplete(requesterProfile)) {
      return res.status(403).json({
        message: 'Complete your profile before searching for friends.',
        code: 'PROFILE_INCOMPLETE',
      });
    }

    const sort = String(req.query.sort || 'best_match') === 'name' ? 'name' : 'best_match';
    const flg = req.query.learningGoal ? String(req.query.learningGoal).trim() : '';
    const fcs = req.query.communicationStyle ? String(req.query.communicationStyle).trim() : '';
    const fclRaw = req.query.commitmentLevel;
    const fcl =
      fclRaw !== undefined && fclRaw !== null && fclRaw !== ''
        ? parseInt(String(fclRaw), 10)
        : null;
    const commitmentFlex = Math.min(
      2,
      Math.max(0, parseInt(String(req.query.commitmentFlex ?? '0'), 10) || 0)
    );

    if (flg || fcs || (fcl !== null && !Number.isNaN(fcl))) {
      const pv = validateProfileCustomizationFields({
        learning_goal: flg || undefined,
        communication_style: fcs || undefined,
        commitment_level:
          fcl !== null && !Number.isNaN(fcl) ? fcl : undefined,
      });
      if (!pv.ok) {
        return res.status(400).json({
          message: pv.errors.join(' '),
          validationErrors: pv.errors,
        });
      }
    }

    let whereExtra = '';
    const execParams = [requesterId, requesterId, requesterId, requesterId, requesterId, requesterId];
    const relationshipExclusionClause = `
      AND NOT EXISTS (
        SELECT 1
        FROM FriendRequest fr
        WHERE fr.pairUser1Id = LEAST(ua.id, ?)
          AND fr.pairUser2Id = GREATEST(ua.id, ?)
          AND fr.status IN ('pending', 'accepted')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM FriendsModel f
        WHERE (
          (f.user1_ID = ua.id AND f.user2_ID = ?)
          OR (f.user2_ID = ua.id AND f.user1_ID = ?)
        )
          AND (f.status IS NULL OR f.status = 'accepted')
      )
    `;

    if (flg) {
      whereExtra += ' AND up.learning_goal = ? ';
      execParams.push(flg);
    }
    if (fcs) {
      whereExtra += ' AND up.communication_style = ? ';
      execParams.push(fcs);
    }
    if (fcl !== null && !Number.isNaN(fcl)) {
      if (commitmentFlex === 0) {
        whereExtra += ' AND up.commitment_level = ? ';
        execParams.push(fcl);
      } else {
        whereExtra += ' AND up.commitment_level IS NOT NULL AND ABS(up.commitment_level - ?) <= ? ';
        execParams.push(fcl, commitmentFlex);
      }
    }

    let searchClause = '';
    const searchParams = [];
    const rawSearch = req.query.search != null ? String(req.query.search) : '';
    const searchTrim = rawSearch.trim().slice(0, 120);
    if (searchTrim) {
      const escaped = searchTrim
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      const pattern = `%${escaped}%`;
      searchClause = ` AND (
        ua.firstName LIKE ? OR ua.lastName LIKE ? OR ua.email LIKE ? OR
        CONCAT(COALESCE(ua.firstName, ''), ' ', COALESCE(ua.lastName, '')) LIKE ?
      )`;
      searchParams.push(pattern, pattern, pattern, pattern);
    }

    /**
     * Language-exchange "dating app" style affinity (max raw PROFILE_MATCH_MAX_RAW):
     * - Language tandem (highest): perfect swap (you speak what they learn & vice versa) = 50;
     *   partial one-way fit = 25.
     * - Learning goal + communication style (exact) = 40 each.
     * - Commitment closeness = up to 25.
     * - MBTI + zodiac when both set = 15 each.
     * - Shared interests = 5 pts each, cap 25.
     * Final matchScore = ROUND(100 * raw / PROFILE_MATCH_MAX_RAW), clamped 0–100.
     */
    const PROFILE_MATCH_MAX_RAW = 210;
    const langTandemExpr = `(
      CASE
        WHEN TRIM(COALESCE(up.native_language, '')) <> ''
         AND TRIM(COALESCE(rp.native_language, '')) <> ''
         AND TRIM(COALESCE(up.target_language, '')) <> ''
         AND TRIM(COALESCE(rp.target_language, '')) <> ''
         AND LOWER(TRIM(up.native_language)) = LOWER(TRIM(rp.target_language))
         AND LOWER(TRIM(up.target_language)) = LOWER(TRIM(rp.native_language))
        THEN 50
        WHEN (
          LOWER(TRIM(COALESCE(up.native_language, ''))) = LOWER(TRIM(COALESCE(rp.target_language, '')))
          AND TRIM(COALESCE(rp.target_language, '')) <> ''
        ) OR (
          LOWER(TRIM(COALESCE(up.target_language, ''))) = LOWER(TRIM(COALESCE(rp.native_language, '')))
          AND TRIM(COALESCE(rp.native_language, '')) <> ''
        )
        THEN 25
        ELSE 0
      END
    )`;
    const matchExpr = `(
      ${langTandemExpr} +
      (CASE WHEN up.learning_goal <=> rp.learning_goal AND rp.learning_goal IS NOT NULL AND TRIM(rp.learning_goal) <> '' THEN 40 ELSE 0 END) +
      (CASE WHEN up.communication_style <=> rp.communication_style AND rp.communication_style IS NOT NULL AND TRIM(rp.communication_style) <> '' THEN 40 ELSE 0 END) +
      (CASE WHEN up.commitment_level IS NOT NULL AND rp.commitment_level IS NOT NULL THEN GREATEST(0, 25 - 5 * ABS(up.commitment_level - rp.commitment_level)) ELSE 0 END) +
      (CASE WHEN up.mbti IS NOT NULL AND rp.mbti IS NOT NULL AND TRIM(up.mbti) <> '' AND TRIM(rp.mbti) <> '' AND UPPER(TRIM(up.mbti)) = UPPER(TRIM(rp.mbti)) THEN 15 ELSE 0 END) +
      (CASE WHEN up.zodiac IS NOT NULL AND rp.zodiac IS NOT NULL AND TRIM(up.zodiac) <> '' AND TRIM(rp.zodiac) <> '' AND LOWER(TRIM(up.zodiac)) = LOWER(TRIM(rp.zodiac)) THEN 15 ELSE 0 END) +
      LEAST(25, 5 * COALESCE((
        SELECT COUNT(*)
        FROM UserInterest ur
        INNER JOIN UserInterest uo ON ur.interest_id = uo.interest_id AND uo.user_id = ua.id
        WHERE ur.user_id = rp.id
      ), 0))
    )`;

    const orderClause =
      sort === 'name'
        ? 'ORDER BY ua.firstName ASC, ua.lastName ASC'
        : `ORDER BY ${matchExpr} DESC, ua.firstName ASC, ua.lastName ASC`;

    const sql = `
      SELECT
        ua.id, ua.email, ua.firstName, ua.lastName, ua.createdAt, ua.updatedAt, ua.loggedIn, ua.gameStats, ua.xp, ua.level, ua.profileImage,
        up.native_language, up.target_language, up.target_language_proficiency, up.age, up.gender, up.profession, up.mbti, up.zodiac, up.visibility,
        up.default_time_zone, up.rating, up.learning_goal, up.communication_style, up.commitment_level, up.bio,
        COALESCE(badge_counts.cnt, 0) AS badgeCount,
        badge_strip.icons AS badgeIcons,
        LEAST(100, GREATEST(0, ROUND(100 * (${matchExpr}) / ${PROFILE_MATCH_MAX_RAW}))) AS matchScore,
        (
          SELECT GROUP_CONCAT(DISTINCT i.interest_name ORDER BY i.interest_name SEPARATOR '||')
          FROM UserInterest ui
          INNER JOIN Interest i ON i.id = ui.interest_id
          WHERE ui.user_id = ua.id
        ) AS interestNames
      FROM useraccount ua
      INNER JOIN UserProfile up ON up.id = ua.id
      INNER JOIN UserProfile rp ON rp.id = ?
      LEFT JOIN (
        SELECT userId, COUNT(*) AS cnt
        FROM UserBadge
        GROUP BY userId
      ) badge_counts ON badge_counts.userId = ua.id
      LEFT JOIN (
        SELECT ub.userId,
          SUBSTRING(GROUP_CONCAT(b.icon ORDER BY ub.earnedAt DESC SEPARATOR ' '), 1, 64) AS icons
        FROM UserBadge ub
        INNER JOIN Badge b ON b.id = ub.badgeId
        GROUP BY ub.userId
      ) badge_strip ON badge_strip.userId = ua.id
      WHERE ua.id <> ?
      AND (up.visibility IS NULL OR up.visibility = '' OR up.visibility = 'Show')
      ${relationshipExclusionClause}
      ${whereExtra}
      ${searchClause}
      ${orderClause}
    `;

    try {
      const [rows] = await pool.execute(sql, [...execParams, ...searchParams]);
      return res.status(200).json({
        message: 'ok',
        data: rows,
      });
    } catch (execErr) {
      if (!isMissingColumnDbError(execErr)) throw execErr;

      console.warn(
        'getDiscoverUsers: using legacy query (profile match columns may be missing). Run migration 15add-profile-customization-fields.',
        execErr.message
      );

      const legacyOrder =
        sort === 'name'
          ? 'ORDER BY ua.firstName ASC, ua.lastName ASC'
          : 'ORDER BY ua.firstName ASC, ua.lastName ASC';

      const legacySqlBase = (bioSelect) => `
        SELECT
          ua.id, ua.email, ua.firstName, ua.lastName, ua.createdAt, ua.updatedAt, ua.loggedIn, ua.gameStats, ua.xp, ua.level, ua.profileImage,
          up.native_language, up.target_language, up.target_language_proficiency, up.age, up.gender, up.profession, up.mbti, up.zodiac, up.visibility,
          up.default_time_zone, up.rating,
          NULL AS learning_goal, NULL AS communication_style, NULL AS commitment_level,
          ${bioSelect},
          0 AS badgeCount, NULL AS badgeIcons,
          0 AS matchScore,
          (
            SELECT GROUP_CONCAT(DISTINCT i.interest_name ORDER BY i.interest_name SEPARATOR '||')
            FROM UserInterest ui
            INNER JOIN Interest i ON i.id = ui.interest_id
            WHERE ui.user_id = ua.id
          ) AS interestNames
        FROM useraccount ua
        INNER JOIN UserProfile up ON up.id = ua.id
        INNER JOIN UserProfile rp ON rp.id = ?
        WHERE ua.id <> ?
        AND (up.visibility IS NULL OR up.visibility = '' OR up.visibility = 'Show')
        ${relationshipExclusionClause}
        ${searchClause}
        ${legacyOrder}
      `;
      const legacyParams = [
        requesterId,
        requesterId,
        requesterId,
        requesterId,
        requesterId,
        requesterId,
        ...searchParams,
      ];
      let legacyRows;
      try {
        const [rows] = await pool.execute(legacySqlBase('up.bio'), legacyParams);
        legacyRows = rows;
      } catch (legacyErr) {
        if (isMissingBioColumnDbError(legacyErr)) {
          console.warn('getDiscoverUsers: legacy query without UserProfile.bio (migration 22 not applied).');
          const [rows] = await pool.execute(legacySqlBase('NULL AS bio'), legacyParams);
          legacyRows = rows;
        } else {
          throw legacyErr;
        }
      }
      return res.status(200).json({
        message: 'ok',
        data: legacyRows,
        discoverFallback: true,
      });
    }
  } catch (error) {
    console.error('Error in getDiscoverUsers:', error);
    return res.status(500).json({
      message: 'Error discovering users',
      error: error.message,
    });
  }
};

let addFriend = async (req, res) => {
  const { user_id_2, user_2_first_name, user_2_last_name } = req.body;

  // Validate that all necessary parameters are provided
  if (!user_id_2 || !user_2_first_name || !user_2_last_name) {
      return res.status(400).json({
          message: 'Missing parameters'
      });
  }

  try {
      // Assuming you have an `id` auto-incremented field in your FriendsList table, and that user_id_1 is no longer required
      const [result] = await pool.execute(
          'INSERT INTO FriendsList (user_id_2, user_2_first_name, user_2_last_name) VALUES (?, ?, ?)',
          [user_id_2, user_2_first_name, user_2_last_name]
      );
      
      res.status(201).json({
          message: 'Friend added successfully',
          data: result
      });
  } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({
          message: 'Error adding friend',
          error: error.message
      });
  }
};

let getUserProfile = async (req, res) => {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({
            message: 'Missing userId parameter'
        });
    }
    try {
        const [rows] = await pool.execute('SELECT * FROM UserProfile WHERE id = ?', [userId]);
        if (rows.length > 0) {
            return res.status(200).json({
                message: 'ok',
                data: rows[0]
            });
        } else {
            return res.status(404).json({
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        return res.status(500).json({
            message: 'Error retrieving user profile',
            error: error.message
        });
    }
};

let updateRating = async (req, res) => {
    const { rating, user_id } = req.body;

    if (!rating || !user_id) {
        return res.status(400).json({ message: 'Missing rating or user_id parameter' });
    }

    try {
        // 1. Insert NEW rating into UserRatings table
        const insertQuery = `
            INSERT INTO UserRatings (userId, rating)
            VALUES (?, ?)
        `;
        await pool.execute(insertQuery, [user_id, rating]);

        // 2. Recalculate the user's average rating
        const avgQuery = `
            SELECT AVG(rating) AS avgRating
            FROM UserRatings
            WHERE userId = ?
        `;
        const [rows] = await pool.execute(avgQuery, [user_id]);

        const average = rows[0].avgRating;

        // 3. Update UserProfile with the new average
        const updateProfileQuery = `
            UPDATE UserProfile
            SET rating = ?
            WHERE id = ?
        `;
        await pool.execute(updateProfileQuery, [average, user_id]);

        return res.status(200).json({
            message: "Rating added and average updated!",
            average: average,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to update rating",
            error,
        });
    }
};

// let updateProficiency = async (req, res) => {
//     const { proficiency, user_id } = req.body;

//     if (proficiency === undefined || user_id === undefined) {
//         return res.status(400).json({ message: 'Missing proficiency or user_id parameter' });
//     }

//     try {
//         const query = 'UPDATE UserProfile SET proficiency = ? WHERE id = ?';
//         await pool.execute(query, [proficiency, user_id]);
//         return res.status(200).json({ message: 'Proficiency updated successfully!' });
//     } catch (error) {
//         return res.status(500).json({ message: 'Failed to update proficiency', error });
//     }
// };

const addComment = async (req, res) => {
    const { comment, user_id } = req.body;

    if (!comment || !user_id) {
        return res.status(400).json({ message: 'Missing comment or user_id parameter' });
    }

    try {
        const query = 'UPDATE UserProfile SET comments = ? WHERE id = ?';
        await pool.execute(query, [String(comment), user_id]);  // Explicitly cast comment to string
        return res.status(200).json({ message: 'Comment added successfully!' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add comment', error });
    }
};

let getUserProficiencyAndRating = async (req, res) => {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({
            message: 'Missing userId parameter'
        });
    }
    try {
        const [rows] = await pool.execute('SELECT target_language_proficiency, rating FROM UserProfile WHERE id = ?', [userId]);
        if (rows.length > 0) {
            return res.status(200).json({
                message: 'ok',
                data: rows[0]
            });
        } else {
            return res.status(404).json({
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving user proficiency and rating:', error);
        return res.status(500).json({
            message: 'Error retrieving user proficiency and rating',
            error: error.message
        });
    }
};

let addToFriendsList = async (req, res) => {
  let { userId, friendsList } = req.body; // friendsList can be array or JSON string

  if (!userId || friendsList == null) {
    return res.status(400).json({ message: 'Missing userId or friendsList' });
  }

  // Normalize to an array
  try {
    if (typeof friendsList === 'string') {
      friendsList = JSON.parse(friendsList); // if frontend sent a JSON string
    }
  } catch (e) {
    return res.status(400).json({ message: 'friendsList must be a JSON array or array' });
  }

  if (!Array.isArray(friendsList)) {
    return res.status(400).json({ message: 'friendsList must be an array' });
  }

  // Optional: dedupe + coerce to numbers/strings consistently
  const normalized = Array.from(new Set(friendsList.map(v => Number.isNaN(Number(v)) ? String(v) : Number(v))));

  try {
    // IMPORTANT: pass valid JSON into a JSON column
    await pool.execute(
      isPostgres
        ? 'UPDATE UserProfile SET friends_list = ?::jsonb WHERE id = ?'
        : 'UPDATE UserProfile SET friends_list = CAST(? AS JSON) WHERE id = ?',
      [JSON.stringify(normalized), userId]
    );

    return res.status(200).json({ message: 'Friends list updated successfully' });
  } catch (error) {
    console.error('Error updating friends list:', error);
    return res.status(500).json({ message: 'Error updating friends list', error: error.message });
  }
};

let getFriendsList = async (req, res) => {
  const { id: userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT friends_list FROM UserProfile WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const raw = rows[0].friends_list;

    // mysql2 will usually give you back a JS object/array for JSON columns.
    // But if your driver returns a string, parse it.
    const friendsList = Array.isArray(raw)
      ? raw
      : raw
        ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
        : [];

    return res.status(200).json({ friendsList });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    return res.status(500).json({ message: 'Error fetching friends list', error: error.message });
  }
};

let removeFriend = async (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) {
    return res.status(400).json({ message: 'Missing userId or friendId' });
  }

  try {
    // Get current list
    const [rows] = await pool.execute(
      'SELECT friends_list FROM UserProfile WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let list = rows[0].friends_list;
    list = Array.isArray(list)
      ? list
      : list
        ? (typeof list === 'string' ? JSON.parse(list) : list)
        : [];

    const updated = list.filter(id => id != friendId);

    await pool.execute(
      isPostgres
        ? 'UPDATE UserProfile SET friends_list = ?::jsonb WHERE id = ?'
        : 'UPDATE UserProfile SET friends_list = CAST(? AS JSON) WHERE id = ?',
      [JSON.stringify(updated), userId]
    );

    return res.status(200).json({ message: 'Friend removed successfully', friendsList: updated });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
};


let addTrueFriend = async (req, res) => {
  try {
      let { userId1, userId2 } = req.body;
      userId1 = Number(userId1);
      userId2 = Number(userId2);

      if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'userId1 and userId2 are required' });
      }
      if (userId1 === userId2) {
        return res.status(400).json({ error: 'Cannot friend yourself' });
      }

      const requesterProfile = await getProfileByUserId(userId1);
      if (!isProfileComplete(requesterProfile)) {
        return res.status(403).json({
          error: 'Complete your profile before sending friend requests.',
          code: 'PROFILE_INCOMPLETE',
        });
      }

      const [users] = await pool.execute(
        'SELECT id FROM useraccount WHERE id IN (?, ?)',
        [userId1, userId2]
      );
      if (users.length !== 2) {
        return res.status(404).json({ error: 'One or both users do not exist' });
      }

      const { a, b } = sortedPair(userId1, userId2);

      const [friendRows] = await pool.execute(
        'SELECT user1_ID, user2_ID FROM FriendsModel WHERE user1_ID = ? AND user2_ID = ?',
        [a, b]
      );
      if (friendRows.length > 0) {
        return res.status(409).json({ error: 'Friendship already exists' });
      }

      const [requestRows] = await pool.execute(
        'SELECT * FROM FriendRequest WHERE pairUser1Id = ? AND pairUser2Id = ? LIMIT 1',
        [a, b]
      );
      const existing = requestRows[0];
      if (existing) {
        if (existing.status === 'pending') {
          if (Number(existing.requesterId) === userId1 && Number(existing.recipientId) === userId2) {
            return res.status(409).json({ error: 'Friend request already pending' });
          }
          return res.status(409).json({ error: 'You already have an incoming friend request from this user' });
        }
        if (existing.status === 'removed' && existing.blockedUntil && new Date(existing.blockedUntil) > new Date()) {
          return res.status(429).json({
            error: `You must wait ${READD_COOLDOWN_HOURS} hours after removing before re-adding`,
            code: 'READD_COOLDOWN',
            blockedUntil: existing.blockedUntil,
          });
        }
      }

      await pool.execute(
        isPostgres
          ? `
          INSERT INTO FriendRequest
            (requesterId, recipientId, pairUser1Id, pairUser2Id, status, respondedAt, lastActionBy, blockedUntil, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'pending', NULL, ?, NULL, NOW(), NOW())
          ON CONFLICT (pairUser1Id, pairUser2Id) DO UPDATE SET
            requesterId = EXCLUDED.requesterId,
            recipientId = EXCLUDED.recipientId,
            status = 'pending',
            respondedAt = NULL,
            lastActionBy = EXCLUDED.lastActionBy,
            blockedUntil = NULL,
            updatedAt = NOW()
          `
          : `
          INSERT INTO FriendRequest
            (requesterId, recipientId, pairUser1Id, pairUser2Id, status, respondedAt, lastActionBy, blockedUntil, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'pending', NULL, ?, NULL, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            requesterId = VALUES(requesterId),
            recipientId = VALUES(recipientId),
            status = 'pending',
            respondedAt = NULL,
            lastActionBy = VALUES(lastActionBy),
            blockedUntil = NULL,
            updatedAt = NOW()
          `,
        [userId1, userId2, a, b, userId1]
      );

      return res.status(201).json({
        message: 'Friend request sent',
        requesterId: userId1,
        recipientId: userId2,
      });
  } catch (err) {
    console.error('addTrueFriend error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let removeTrueFriend = async (req, res) => {
  try {
    const userId1 = Number(req.body.userId1);
    const userId2 = Number(req.body.userId2);
    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'userId1 and userId2 are required' });
    }
    const { a, b } = sortedPair(userId1, userId2);

    const sql = isPostgres
      ? `DELETE FROM FriendsModel WHERE user1_ID = ? AND user2_ID = ? RETURNING *`
      : `DELETE FROM FriendsModel WHERE user1_ID = ? AND user2_ID = ?`;
    const [result] = await pool.execute(sql, [a, b]);

    const didDelete = isPostgres ? result.length > 0 : result.affectedRows > 0;
    if (didDelete) {
      const { a, b } = sortedPair(userId1, userId2);
      await pool.execute(
        isPostgres
          ? `
          INSERT INTO FriendRequest
            (requesterId, recipientId, pairUser1Id, pairUser2Id, status, respondedAt, lastActionBy, blockedUntil, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'removed', NOW(), ?, NOW() + INTERVAL '${READD_COOLDOWN_HOURS} hours', NOW(), NOW())
          ON CONFLICT (pairUser1Id, pairUser2Id) DO UPDATE SET
            requesterId = EXCLUDED.requesterId,
            recipientId = EXCLUDED.recipientId,
            status = 'removed',
            respondedAt = NOW(),
            lastActionBy = EXCLUDED.lastActionBy,
            blockedUntil = NOW() + INTERVAL '${READD_COOLDOWN_HOURS} hours',
            updatedAt = NOW()
          `
          : `
          INSERT INTO FriendRequest
            (requesterId, recipientId, pairUser1Id, pairUser2Id, status, respondedAt, lastActionBy, blockedUntil, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'removed', NOW(), ?, DATE_ADD(NOW(), INTERVAL ${READD_COOLDOWN_HOURS} HOUR), NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            requesterId = VALUES(requesterId),
            recipientId = VALUES(recipientId),
            status = 'removed',
            respondedAt = NOW(),
            lastActionBy = VALUES(lastActionBy),
            blockedUntil = DATE_ADD(NOW(), INTERVAL ${READD_COOLDOWN_HOURS} HOUR),
            updatedAt = NOW()
          `,
        [userId1, userId2, a, b, userId1]
      );

      res.status(200).json({
        message: 'Friend removed successfully',
        readdAvailableInHours: READD_COOLDOWN_HOURS,
      });
    } else {
      res.status(404).json({ message: 'No friendship found' });
    }
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

let getTrueFriendsList = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [rows] = await pool.query(
      `
      SELECT u.id, u.firstName, u.lastName, u.email, u.profileImage, p.native_language AS nativeLanguage
      FROM FriendsModel f
      JOIN useraccount u ON u.id = f.user2_ID
      LEFT JOIN UserProfile p ON p.id = u.id
      WHERE f.user1_ID = ? AND f.status = 'accepted'
      UNION
      SELECT u.id, u.firstName, u.lastName, u.email, u.profileImage, p.native_language AS nativeLanguage
      FROM FriendsModel f
      JOIN useraccount u ON u.id = f.user1_ID
      LEFT JOIN UserProfile p ON p.id = u.id
      WHERE f.user2_ID = ? AND f.status = 'accepted'
      `,
      [userId, userId]
    );

    // Convert BinaryRows → plain objects
    const friends = rows.map(r => ({ ...r }));

    //console.log('Final plain friends list:', friends);
    return res.status(200).json({ friendsList: friends });
  } catch (err) {
    console.error('Error retrieving friends:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let getFriendsLeaderboard = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [rows] = await pool.query(
      `
      SELECT u.id, u.firstName, u.lastName, u.profileImage,
             COALESCE(u.xp, 0) AS xp, COALESCE(u.level, 1) AS level
      FROM useraccount u
      WHERE u.id = ?
         OR u.id IN (SELECT user2_ID FROM FriendsModel WHERE user1_ID = ? AND status = 'accepted')
         OR u.id IN (SELECT user1_ID FROM FriendsModel WHERE user2_ID = ? AND status = 'accepted')
      ORDER BY xp DESC, u.id ASC
      `,
      [userId, userId, userId]
    );

    const entries = rows.map((r, idx) => ({
      userId: Number(r.id),
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      profileImage: r.profileImage ?? null,
      xp: Number(r.xp || 0),
      level: Number(r.level || 1),
      rank: idx + 1,
      isMe: Number(r.id) === userId,
    }));
    const me = entries.find((e) => e.isMe) || null;

    return res.status(200).json({
      total: entries.length,
      myRank: me ? me.rank : null,
      myXp: me ? me.xp : 0,
      entries,
    });
  } catch (err) {
    console.error('Error fetching friends leaderboard:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let getFriendRequests = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [incoming] = await pool.query(
      `
      SELECT fr.id, fr.requesterId, fr.recipientId, fr.status, fr.createdAt, fr.updatedAt,
             ua.id as requesterUserId, ua.firstName as requesterFirstName, ua.lastName as requesterLastName, ua.email as requesterEmail, ua.profileImage as requesterProfileImage
      FROM FriendRequest fr
      JOIN useraccount ua ON ua.id = fr.requesterId
      WHERE fr.recipientId = ? AND fr.status = 'pending'
      ORDER BY fr.createdAt DESC
      `,
      [userId]
    );

    const [outgoing] = await pool.query(
      `
      SELECT fr.id, fr.requesterId, fr.recipientId, fr.status, fr.createdAt, fr.updatedAt,
             ua.id as recipientUserId, ua.firstName as recipientFirstName, ua.lastName as recipientLastName, ua.email as recipientEmail, ua.profileImage as recipientProfileImage
      FROM FriendRequest fr
      JOIN useraccount ua ON ua.id = fr.recipientId
      WHERE fr.requesterId = ? AND fr.status = 'pending'
      ORDER BY fr.createdAt DESC
      `,
      [userId]
    );

    return res.status(200).json({ incoming, outgoing });
  } catch (err) {
    console.error('Error retrieving friend requests:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let acceptFriendRequest = async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const userId = Number(req.body.userId);
    if (!requestId || !userId) {
      return res.status(400).json({ error: 'requestId and userId are required' });
    }

    const request = await db.FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: 'Friend request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Friend request is already ${request.status}` });
    }
    if (Number(request.recipientId) !== userId) {
      return res.status(403).json({ error: 'Only the recipient can accept this request' });
    }

    const { a, b } = sortedPair(request.requesterId, request.recipientId);
    await db.sequelize.transaction(async (transaction) => {
      await db.sequelize.query(
        isPostgres
          ? 'INSERT INTO "FriendsModel" ("user1_ID", "user2_ID") VALUES (?, ?) ON CONFLICT ("user1_ID", "user2_ID") DO NOTHING'
          : 'INSERT INTO FriendsModel (user1_ID, user2_ID) VALUES (?, ?) ON DUPLICATE KEY UPDATE user1_ID = user1_ID',
        { replacements: [a, b], transaction }
      );
      await request.update(
        {
          status: 'accepted',
          respondedAt: new Date(),
          lastActionBy: userId,
          blockedUntil: null,
        },
        { transaction }
      );
    });

    return res.status(200).json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error accepting friend request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let rejectFriendRequest = async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const userId = Number(req.body.userId);
    if (!requestId || !userId) {
      return res.status(400).json({ error: 'requestId and userId are required' });
    }

    const request = await db.FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ error: 'Friend request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Friend request is already ${request.status}` });
    }
    if (Number(request.recipientId) !== userId) {
      return res.status(403).json({ error: 'Only the recipient can reject this request' });
    }

    await request.update({
      status: 'rejected',
      respondedAt: new Date(),
      lastActionBy: userId,
    });

    return res.status(200).json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('Error rejecting friend request:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let getUserAvailability = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId parameter" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, day_of_week, start_time, end_time FROM UserAvailability WHERE user_id = ? ORDER BY start_time ASC",
      [userId]
    );

    return res.status(200).json({
      message: "Availability fetched successfully",
      availability: rows,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return res.status(500).json({
      message: "Failed to fetch availability",
      error,
    });
  }
};

/** MySQL TIME + Sequelize model table name (meetingmodel) vs raw SQL (MeetingModel) caused failures on Linux/Plesk. */
function normalizeMeetingTime(t) {
  if (t == null || t === "") return t;
  const s = String(t).trim();
  const parts = s.split(":").map((p) => p.trim());
  if (parts.length >= 2) {
    const h = (parts[0] || "0").padStart(2, "0");
    const m = (parts[1] || "0").slice(0, 2).padStart(2, "0");
    const sec =
      parts.length >= 3 ? (parts[2] || "0").replace(/\D/g, "").slice(0, 2).padStart(2, "0") : "00";
    return `${h}:${m}:${sec}`;
  }
  return s;
}

let createMeeting = async (req, res) => {
  try {
    const { user1_id, user2_id, day_of_week, start_time, end_time, topic, zoom_link } = req.body;

    const u1 = Number(user1_id);
    const u2 = Number(user2_id);
    if (!u1 || !u2 || !day_of_week || start_time == null || end_time == null || `${start_time}` === "" || `${end_time}` === "") {
      return res.status(400).json({
        message: "Missing required fields (user1_id, user2_id, day_of_week, start_time, end_time)",
      });
    }
    if (u1 === u2) {
      return res.status(400).json({
        message: "Cannot schedule a meeting with yourself. Pick a friend.",
        code: "MEETING_SAME_USER",
      });
    }

    const [profileRows] = await pool.query(
      "SELECT id FROM UserProfile WHERE id IN (?, ?)",
      [u1, u2]
    );
    if (!Array.isArray(profileRows) || profileRows.length < 2) {
      return res.status(400).json({
        message:
          "Cannot schedule: both users need a saved profile (UserProfile row). Ask the other person to finish profile setup, or complete yours.",
        code: "MEETING_MISSING_PROFILE",
      });
    }

    const st = normalizeMeetingTime(start_time);
    const et = normalizeMeetingTime(end_time);

    let row;
    try {
      row = await db.Meeting.create({
        user1_id: u1,
        user2_id: u2,
        day_of_week: String(day_of_week),
        start_time: st,
        end_time: et,
        topic: topic ? String(topic).slice(0, 200) : null,
        zoom_link: zoom_link ? String(zoom_link).slice(0, 2000) : null,
      });
    } catch (createErr) {
      const rawCreate = createErr?.message || String(createErr);
      if (/Unknown column\s+'topic'|Unknown column\s+'zoom_link'|ER_BAD_FIELD_ERROR/i.test(rawCreate)) {
        row = await db.Meeting.create({
          user1_id: u1,
          user2_id: u2,
          day_of_week: String(day_of_week),
          start_time: st,
          end_time: et,
        });
      } else {
        throw createErr;
      }
    }

    return res.status(201).json({
      message: "Meeting created successfully",
      id: row.id,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    const raw = error?.message || String(error);
    let message = "Failed to create meeting";
    if (/Duplicate|1062|ER_DUP_ENTRY/i.test(raw)) {
      return res.status(409).json({
        message: "A meeting already exists for that time slot.",
        code: "MEETING_DUPLICATE",
        error: raw,
      });
    }
    if (/foreign key|ER_NO_REFERENCED|Cannot add or update a child row|1452/i.test(raw)) {
      message =
        "Cannot save meeting (database constraint). Both accounts need a UserProfile; run migrations if the meetings table is missing.";
    } else if (/doesn't exist|Unknown table|1146/i.test(raw)) {
      message =
        "Meetings table is missing or the name does not match on this server. Run DB migrations and restart the app.";
    } else {
      message = `Failed to create meeting: ${raw}`;
    }
    return res.status(500).json({
      message,
      error: raw,
    });
  }
};

let createZoomMeetingLink = async (req, res) => {
  try {
    const { topic, start_time_iso, timezone, duration_minutes } = req.body || {};
    if (!start_time_iso) {
      return res.status(400).json({
        message: 'Missing required field: start_time_iso',
      });
    }
    if (!hasZoomConfig()) {
      return res.status(501).json({
        message: 'Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_USER_ID.',
        code: 'ZOOM_NOT_CONFIGURED',
      });
    }
    const meeting = await createZoomMeeting({
      topic: topic ? String(topic) : 'Language exchange',
      startTimeIso: String(start_time_iso),
      durationMinutes: Number(duration_minutes || 60),
      timezone: timezone ? String(timezone) : 'UTC',
    });
    return res.status(200).json({
      message: 'ok',
      meetingId: meeting.id,
      joinUrl: meeting.join_url,
      startUrl: meeting.start_url,
      password: meeting.password || null,
    });
  } catch (error) {
    const raw = error?.message || String(error);
    console.error('Error creating Zoom meeting:', raw);
    return res.status(500).json({
      message: 'Failed to create Zoom meeting',
      error: raw,
    });
  }
};

let createAgoraRtcToken = async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID || '';
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
    if (!appId) {
      return res.status(501).json({
        message: 'Agora is not configured. Set AGORA_APP_ID (and AGORA_APP_CERTIFICATE for token mode).',
        code: 'AGORA_NOT_CONFIGURED',
      });
    }

    const { channelName, uid } = req.body || {};
    if (!channelName) {
      return res.status(400).json({ message: 'Missing required field: channelName' });
    }
    const uidNum = Number(uid || 0);
    const expireSec = Number(process.env.AGORA_TOKEN_EXPIRE_SECONDS || 3600);
    const currentTs = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTs + expireSec;
    const token = appCertificate
      ? RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          String(channelName),
          Number.isFinite(uidNum) ? uidNum : 0,
          RtcRole.PUBLISHER,
          privilegeExpireTs
        )
      : null;
    return res.status(200).json({
      appId,
      channelName: String(channelName),
      uid: Number.isFinite(uidNum) ? uidNum : 0,
      token,
      expiresAt: privilegeExpireTs,
      mode: appCertificate ? 'token' : 'appIdOnly',
      warning: appCertificate
        ? null
        : 'AGORA_APP_CERTIFICATE is missing. Using appId-only mode (works only if your Agora project allows token-free access).',
    });
  } catch (error) {
    const raw = error?.message || String(error);
    console.error('Error creating Agora token:', raw);
    return res.status(500).json({
      message: 'Failed to create Agora token',
      error: raw,
    });
  }
};

let deleteMeeting = async (req, res) => {
  try {
    const { user1_id, user2_id, day_of_week, start_time } = req.body;

    const u1 = Number(user1_id);
    const u2 = Number(user2_id);
    if (!u1 || !u2 || !day_of_week || start_time == null || `${start_time}` === "") {
      return res.status(400).json({
        message: "Missing required fields (user1_id, user2_id, day_of_week, start_time)",
      });
    }

    const st = normalizeMeetingTime(start_time);

    const n = await db.Meeting.destroy({
      where: {
        user1_id: u1,
        user2_id: u2,
        day_of_week: String(day_of_week),
        start_time: st,
      },
    });

    return res.status(200).json({
      message: "Meeting removed successfully",
      affectedRows: n,
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return res.status(500).json({
      message: "Failed to delete meeting",
      error: error.message,
    });
  }
};

/** Reschedule an existing meeting (drag-and-drop on calendar). Caller must be user1 or user2. */
let moveMeeting = async (req, res) => {
  try {
    const { meetingId, userId, day_of_week, start_time, end_time } = req.body;
    const mid = Number(meetingId);
    const uid = Number(userId);
    if (!mid || !uid || !day_of_week || start_time == null || end_time == null || `${start_time}` === "" || `${end_time}` === "") {
      return res.status(400).json({
        message: "Missing required fields (meetingId, userId, day_of_week, start_time, end_time)",
      });
    }

    const row = await db.Meeting.findByPk(mid);
    if (!row) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    if (row.user1_id !== uid && row.user2_id !== uid) {
      return res.status(403).json({
        message: "You can only reschedule your own meetings.",
        code: "MEETING_FORBIDDEN",
      });
    }

    const st = normalizeMeetingTime(start_time);
    const et = normalizeMeetingTime(end_time);

    await row.update({
      day_of_week: String(day_of_week),
      start_time: st,
      end_time: et,
    });

    return res.status(200).json({
      message: "Meeting rescheduled",
      id: mid,
    });
  } catch (error) {
    console.error("Error moving meeting:", error);
    const raw = error?.message || String(error);
    if (/Duplicate|1062|ER_DUP_ENTRY/i.test(raw)) {
      return res.status(409).json({
        message: "That time slot is already taken.",
        code: "MEETING_DUPLICATE",
        error: raw,
      });
    }
    return res.status(500).json({
      message: "Failed to reschedule meeting",
      error: raw,
    });
  }
};

const APIController = {
    addFriend, getAllUsers, createNewUser, updateUser, deleteUser, getUserNames, getDiscoverUsers, getUserPreferences, getUserProfile, getProfileCustomizationOptions, updateRating,
    addComment, getUserProficiencyAndRating, addToFriendsList, getFriendsList, removeFriend, addTrueFriend, removeTrueFriend,
    getTrueFriendsList, getFriendsLeaderboard, getUserAvailability, createMeeting, deleteMeeting, moveMeeting, createZoomMeetingLink, createAgoraRtcToken,
    getFriendRequests, acceptFriendRequest, rejectFriendRequest
};
export default APIController;
