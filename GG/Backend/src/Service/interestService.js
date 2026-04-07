import db from '../models/index.js';

let listInterests = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const interests = await db.Interest.findAll({ order: [['interest_name', 'ASC']] });
            resolve(interests);
        } catch (e) {
            reject(e);
        }
    })
}

let createInterest = (interest_name) => {
    return new Promise(async (resolve, reject) => {
        try {
            const [interest] = await db.Interest.findOrCreate({ where: { interest_name } });
            resolve(interest);
        } catch (e) {
            reject(e);
        }
    })
}

const interestService = { listInterests, createInterest };
export default interestService;


