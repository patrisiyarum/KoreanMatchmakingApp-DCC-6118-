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
    await db.UserAvailability.destroy({ where: { user_id } });
    return addAvailability(user_id, slots);
}

const availabilityService = { getAvailability, addAvailability, removeAvailability, replaceAvailability };
export default availabilityService;


