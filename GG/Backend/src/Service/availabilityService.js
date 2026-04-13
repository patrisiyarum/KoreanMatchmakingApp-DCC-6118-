import db from '../models/index.js';

let getAvailability = (user_id) => {
    if (!db.UserAvailability) return Promise.resolve([]);
    return db.UserAvailability.findAll({
        where: { user_id },
        order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });
}

let addAvailability = async (user_id, slots) => {
    // slots: array of { day_of_week, start_time, end_time }
    if (!db.UserAvailability) return [];
    const profile = await db.UserProfile.findByPk(user_id);
    if (!profile) {
        const err = new Error(
            'No profile found for this account. Open Profile and save your profile first, then try again.'
        );
        err.code = 'PROFILE_REQUIRED';
        err.status = 400;
        throw err;
    }
    const created = [];
    for (const s of (Array.isArray(slots) ? slots : [slots])) {
        const rec = await db.UserAvailability.create({
            user_id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
        });
        created.push(rec);
    }
    return created;
}

let removeAvailability = (id) => {
    if (!db.UserAvailability) return Promise.resolve(0);
    return db.UserAvailability.destroy({ where: { id } });
}

let replaceAvailability = async (user_id, slots) => {
    if (!db.UserAvailability) return [];
    const profile = await db.UserProfile.findByPk(user_id);
    if (!profile) {
        const err = new Error(
            'No profile found for this account. Open Profile and save your profile first, then try again.'
        );
        err.code = 'PROFILE_REQUIRED';
        err.status = 400;
        throw err;
    }
    const rows = (Array.isArray(slots) ? slots : []).map((s) => ({
        user_id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
    }));
    const t = await db.sequelize.transaction();
    try {
        await db.UserAvailability.destroy({ where: { user_id }, transaction: t });
        const created =
            rows.length > 0
                ? await db.UserAvailability.bulkCreate(rows, { transaction: t })
                : [];
        await t.commit();
        return created;
    } catch (e) {
        await t.rollback();
        throw e;
    }
}

const availabilityService = { getAvailability, addAvailability, removeAvailability, replaceAvailability };
export default availabilityService;


