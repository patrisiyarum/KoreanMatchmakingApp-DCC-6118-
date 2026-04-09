import db from "../models/index.js";
import { Op } from "sequelize";

export const getMeetingsForUser = async (req, res) => {

  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    console.log("Fetching meetings for user:", userId);

    const meetings = await db.Meeting.findAll({
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

    return res.json(meetings);
  } catch (err) {
    console.error("GET MEETINGS ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch meetings",
      details: err.toString()
    });
  }
};
