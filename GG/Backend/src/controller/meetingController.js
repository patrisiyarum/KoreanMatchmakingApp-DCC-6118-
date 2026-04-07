import db from "../models/index.js";
import { Op } from "sequelize";

export const getMeetingsForUser = async (req, res) => {

  try {
    const userId = req.params.userId;
    console.log("Fetching meetings for user:", userId);

    const meetings = await db.Meeting.findAll({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      }
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
