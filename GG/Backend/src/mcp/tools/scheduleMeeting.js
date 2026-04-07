import dotenv from 'dotenv';
dotenv.config();
import db from "../../models/index.js";
import { Op } from "sequelize";
import { pool } from "../../config/connectDB.js";
import availabilityService from "../../Service/availabilityService.js";

const isPostgres = (process.env.DB_DIALECT || 'mysql') === 'postgres';

/**
 * Schedule Meeting Tool
 * Schedules a meeting between two users who are friends.
 * Requirements:
 * - Both users must be friends
 * - Both users must have overlapping availability (normalized by timezone)
 * - If multiple slots are available, picks the first available slot
 */
export async function scheduleMeeting(args) {
  try {
    const { userId, targetUserName, preferredDay, preferredTime } = args;

    console.log(`[scheduleMeeting] Called with userId: ${userId}, targetUserName: ${targetUserName}`);

    if (!userId) {
      return {
        error: "userId is required",
      };
    }

    if (!targetUserName) {
      return {
        error: "targetUserName is required. Please provide the name of the user you want to schedule with.",
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

    // Find the target user by name
    const [userRows] = await pool.execute(
      isPostgres
        ? `SELECT id, "firstName", "lastName" FROM "UserAccount" WHERE "firstName" || ' ' || "lastName" ILIKE ? OR "firstName" ILIKE ? OR "lastName" ILIKE ?`
        : `SELECT id, firstName, lastName FROM useraccount WHERE CONCAT(firstName, ' ', lastName) LIKE ? OR firstName LIKE ? OR lastName LIKE ?`,
      [`%${targetUserName}%`, `%${targetUserName}%`, `%${targetUserName}%`]
    );

    if (!userRows || userRows.length === 0) {
      return {
        error: "User not found",
        details: `Could not find a user with name matching "${targetUserName}"`
      };
    }

    // If multiple matches, prefer exact match, otherwise take first
    let targetUser = userRows.find(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase() === targetUserName.toLowerCase()
    ) || userRows[0];

    const targetUserId = targetUser.id;

    if (targetUserId === numericUserId) {
      return {
        error: "Cannot schedule meeting with yourself",
      };
    }

    console.log(`[scheduleMeeting] Found target user: ${targetUserId} (${targetUser.firstName} ${targetUser.lastName})`);

    // Verify they are friends using FriendsModel
    try {
      const [friendshipRows] = await pool.execute(
        `SELECT user1_ID, user2_ID FROM FriendsModel 
        WHERE (user1_ID = ? AND user2_ID = ?) 
            OR (user1_ID = ? AND user2_ID = ?)
        LIMIT 1`,
        [numericUserId, targetUserId, targetUserId, numericUserId]
      );
      
      console.log(`[scheduleMeeting] Friendship check - Query params: user1=${numericUserId}, user2=${targetUserId}`);
      console.log(`[scheduleMeeting] Friendship check result:`, friendshipRows.length > 0 ? 'Found' : 'Not found');
      
      if (!friendshipRows || friendshipRows.length === 0) {
        console.log(`[scheduleMeeting] No friendship found in FriendsModel table between user ${numericUserId} and ${targetUserId}`);
        return {
          error: "Users are not friends",
          details: `You are not friends with ${targetUser.firstName} ${targetUser.lastName}. Please add them as a friend first.`
        };
      }
      console.log(`[scheduleMeeting] Friendship verified - found friendship record`);
    } catch (friendshipError) {
      console.error(`[scheduleMeeting] Error checking friendship:`, friendshipError);
      return {
        error: "Error checking friendship",
        details: `Failed to verify friendship status: ${friendshipError.message}`
      };
    }

    // Get both users' profiles (for timezone info)
    const user1Profile = await db.UserProfile.findByPk(numericUserId);
    const user2Profile = await db.UserProfile.findByPk(targetUserId);

    if (!user1Profile || !user2Profile) {
      return {
        error: "User profile not found",
        details: "Could not find user profiles"
      };
    }

    const user1Timezone = user1Profile.default_time_zone || 'UTC';
    const user2Timezone = user2Profile.default_time_zone || 'UTC';

    // Get both users' availability
    const user1Availability = await availabilityService.getAvailability(numericUserId);
    const user2Availability = await availabilityService.getAvailability(targetUserId);

    if (!user1Availability || user1Availability.length === 0) {
      return {
        error: "No availability found",
        details: "You don't have any available time slots set. Please set your availability first."
      };
    }

    if (!user2Availability || user2Availability.length === 0) {
      return {
        error: "No availability found",
        details: `${targetUser.firstName} ${targetUser.lastName} doesn't have any available time slots set.`
      };
    }

    console.log(`[scheduleMeeting] User1 has ${user1Availability.length} slots, User2 has ${user2Availability.length} slots`);

    // Find overlapping availability slots
    const overlappingSlots = findOverlappingSlots(
      user1Availability,
      user2Availability,
      user1Timezone,
      user2Timezone,
      preferredDay,
      preferredTime
    );

    if (overlappingSlots.length === 0) {
      return {
        error: "No overlapping availability",
        details: `You and ${targetUser.firstName} ${targetUser.lastName} don't have any overlapping available time slots.`
      };
    }

    // Pick the first available slot (or preferred if specified)
    const selectedSlot = overlappingSlots[0];

    console.log(`[scheduleMeeting] Selected slot: ${selectedSlot.day_of_week} ${selectedSlot.start_time} - ${selectedSlot.end_time}`);
    
    // Check if either user already has a meeting during this time slot
    try {
        const [existingMeetings] = await pool.execute(
        `SELECT * FROM meetingmodel 
        WHERE ((user1_id = ? OR user2_id = ?) OR (user1_id = ? OR user2_id = ?))
            AND day_of_week = ?
            AND NOT (end_time <= ? OR start_time >= ?)`,
        [
            numericUserId, numericUserId, targetUserId, targetUserId,
            selectedSlot.day_of_week,
            selectedSlot.start_time, selectedSlot.end_time
        ]
        );
    
        if (existingMeetings && existingMeetings.length > 0) {
        // Determine who has the conflict
        const userHasConflict = existingMeetings.some(m => 
            m.user1_id === numericUserId || m.user2_id === numericUserId
        );
        const targetHasConflict = existingMeetings.some(m => 
            m.user1_id === targetUserId || m.user2_id === targetUserId
        );
    
        let conflictMsg = '';
        if (userHasConflict && targetHasConflict) {
            conflictMsg = `Both you and ${targetUser.firstName} ${targetUser.lastName} already have meetings scheduled during this time slot.`;
        } else if (userHasConflict) {
            conflictMsg = `You already have a meeting scheduled during this time slot.`;
        } else {
            conflictMsg = `${targetUser.firstName} ${targetUser.lastName} already has a meeting scheduled during this time slot.`;
        }
    
        return {
            error: "Time slot conflict",
            details: conflictMsg,
            conflictingSlot: {
            day_of_week: selectedSlot.day_of_week,
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time
            }
        };
        }
    
        console.log(`[scheduleMeeting] No scheduling conflicts found`);
    } catch (conflictError) {
        console.error(`[scheduleMeeting] Error checking for conflicts:`, conflictError);
        return {
        error: "Error checking for scheduling conflicts",
        details: `Failed to verify if time slot is available: ${conflictError.message}`
        };
    }
    
    // Create the meeting
    try {
      const [results] = await db.sequelize.query(
        `
        INSERT INTO meetingmodel (user1_id, user2_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
        `,
        {
          replacements: [
            numericUserId,
            targetUserId,
            selectedSlot.day_of_week,
            selectedSlot.start_time,
            selectedSlot.end_time
          ]
        }
      );

      return {
        success: true,
        message: `Meeting scheduled successfully with ${targetUser.firstName} ${targetUser.lastName}!`,
        meeting: {
          day_of_week: selectedSlot.day_of_week,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          user1_id: numericUserId,
          user2_id: targetUserId
        },
        targetUser: {
          id: targetUserId,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName
        }
      };
    } catch (createError) {
      // Check if it's a duplicate meeting error
      if (createError.message && createError.message.includes('Duplicate')) {
        return {
          error: "Meeting already exists",
          details: `A meeting with ${targetUser.firstName} ${targetUser.lastName} at this time already exists.`
        };
      }
      throw createError;
    }

  } catch (error) {
    console.error("scheduleMeeting error:", error);
    return {
      error: "Failed to schedule meeting",
      details: error.message,
    };
  }
}

/**
 * Find overlapping availability slots between two users
 * Normalizes times to UTC for comparison
 */
function findOverlappingSlots(user1Slots, user2Slots, user1Timezone, user2Timezone, preferredDay = null, preferredTime = null) {
  const overlapping = [];

  for (const slot1 of user1Slots) {
    for (const slot2 of user2Slots) {
      // Must be same day of week
      if (slot1.day_of_week !== slot2.day_of_week) continue;

      // If preferred day is specified, filter by it
      if (preferredDay && slot1.day_of_week.toLowerCase() !== preferredDay.toLowerCase()) continue;

      // Convert times to UTC for comparison
      const slot1StartUTC = convertToUTC(slot1.start_time, user1Timezone);
      const slot1EndUTC = convertToUTC(slot1.end_time, user1Timezone);
      const slot2StartUTC = convertToUTC(slot2.start_time, user2Timezone);
      const slot2EndUTC = convertToUTC(slot2.end_time, user2Timezone);

      // Check for overlap
      if (slot1StartUTC < slot2EndUTC && slot1EndUTC > slot2StartUTC) {
        // Calculate the overlapping time window
        const overlapStart = slot1StartUTC > slot2StartUTC ? slot1StartUTC : slot2StartUTC;
        const overlapEnd = slot1EndUTC < slot2EndUTC ? slot1EndUTC : slot2EndUTC;

        // Convert back to user1's timezone for storage
        const overlapStartLocal = convertFromUTC(overlapStart, user1Timezone);
        const overlapEndLocal = convertFromUTC(overlapEnd, user1Timezone);

        // If preferred time is specified, check if it overlaps
        if (preferredTime) {
          const preferredTimeUTC = convertToUTC(preferredTime, user1Timezone);
          if (preferredTimeUTC < overlapStart || preferredTimeUTC >= overlapEnd) {
            continue; // Skip this slot if preferred time doesn't overlap
          }
        }

        overlapping.push({
          day_of_week: slot1.day_of_week,
          start_time: overlapStartLocal,
          end_time: overlapEndLocal
        });
      }
    }
  }

  // Sort by day of week and time
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  overlapping.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  return overlapping;
}

/**
 * Convert a time string (HH:mm:ss or HH:mm) in a given timezone to minutes since midnight UTC
 * This allows us to compare times across timezones
 */
function convertToUTC(timeStr, timezone) {
  try {
    // Parse time string
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    
    // Convert to minutes since midnight in local timezone
    const localMinutes = hours * 60 + minutes;
    
    // Get timezone offset in minutes
    const offsetMinutes = getTimezoneOffset(timezone);
    
    // Convert to UTC minutes (subtract offset because offset is positive when ahead of UTC)
    const utcMinutes = localMinutes - offsetMinutes;
    
    // Handle day rollover (negative or > 1440)
    const normalizedMinutes = ((utcMinutes % 1440) + 1440) % 1440;
    
    // Return as a Date object for easier comparison (using a reference date)
    const refDate = new Date('2000-01-01T00:00:00Z');
    return new Date(refDate.getTime() + normalizedMinutes * 60000);
  } catch (error) {
    console.error(`Error converting ${timeStr} from ${timezone} to UTC:`, error);
    // Fallback: treat as UTC
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    return new Date(`2000-01-01T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  }
}

/**
 * Convert a UTC Date object (representing a time) back to a time string in the given timezone
 */
function convertFromUTC(utcDate, timezone) {
  try {
    // Get minutes since midnight UTC
    const utcMinutes = utcDate.getUTCHours() * 60 + utcDate.getUTCMinutes();
    
    // Get timezone offset
    const offsetMinutes = getTimezoneOffset(timezone);
    
    // Convert to local minutes
    const localMinutes = utcMinutes + offsetMinutes;
    
    // Normalize to 0-1439 range
    const normalizedMinutes = ((localMinutes % 1440) + 1440) % 1440;
    
    const hours = Math.floor(normalizedMinutes / 60);
    const minutes = normalizedMinutes % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  } catch (error) {
    console.error(`Error converting from UTC to ${timezone}:`, error);
    // Fallback: return UTC time
    const hours = String(utcDate.getUTCHours()).padStart(2, '0');
    const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  }
}

/**
 * Get timezone offset in minutes for a given timezone string
 * Positive offset means timezone is ahead of UTC
 */
function getTimezoneOffset(timezone) {
  try {
    // Use a reference date (today) to get the current offset
    const now = new Date();
    
    // Create formatter for the timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    // Get the offset by comparing UTC and timezone representations
    // Create two dates: one interpreted as UTC, one as the timezone
    const utcTime = now.getTime();
    
    // Format the same UTC time in the target timezone and parse it back
    // This gives us the offset
    const tzString = now.toLocaleString('en-US', { timeZone: timezone });
    const utcString = now.toLocaleString('en-US', { timeZone: 'UTC' });
    
    // Calculate offset by comparing the hour differences
    // This is a simplified approach - for production, use a library
    const tzDate = new Date(tzString);
    const utcDate = new Date(utcString);
    
    // The difference tells us the offset
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    const offsetMinutes = offsetMs / (1000 * 60);
    
    return offsetMinutes;
  } catch (error) {
    // Fallback: use a simpler method
    try {
      const now = new Date();
      // Create a date string in the timezone
      const tzDateStr = now.toLocaleString('en-US', { 
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Create equivalent UTC string
      const utcDateStr = now.toLocaleString('en-US', { 
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Parse and compare
      const tzDate = new Date(tzDateStr);
      const utcDate = new Date(utcDateStr);
      
      return (tzDate - utcDate) / (1000 * 60);
    } catch (e) {
      console.error(`Error getting timezone offset for ${timezone}:`, e);
      return 0; // Default to UTC
    }
  }
}

