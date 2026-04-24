import db from "../models/index.js";
import { Op } from "sequelize";
import { pool } from "../config/connectDB.js";

export const getMeetingsForUser = async (req, res) => {

  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    console.log("Fetching meetings for user:", userId);

    let meetings;
    try {
      meetings = await db.Meeting.findAll({
        where: {
          [Op.or]: [
            { user1_id: userId },
            { user2_id: userId }
          ]
        },
        order: [
          ["day_of_week", "ASC"],
          ["start_time", "ASC"],
        ],
      });
    } catch (ormErr) {
      const raw = ormErr?.message || String(ormErr);
      if (!/Unknown column|does not exist/i.test(raw)) throw ormErr;
      // Backward-compatible fallback for DBs missing newer Meeting columns.
      const [rows] = await pool.execute(
        `SELECT id, user1_id, user2_id, day_of_week, start_time, end_time, created_at AS createdAt, updated_at AS updatedAt
         FROM MeetingModel
         WHERE user1_id = ? OR user2_id = ?
         ORDER BY day_of_week ASC, start_time ASC`,
        [userId, userId]
      );
      meetings = rows;
    }

    return res.json(meetings);
  } catch (err) {
    console.error("GET MEETINGS ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch meetings",
      details: err.toString()
    });
  }
};
