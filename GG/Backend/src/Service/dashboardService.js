import db from '../models/index.js';

let handleUserDashBoard = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};

            // Fetch user data from UserAccount
            let userAccount = await db.UserAccount.findOne({
                where: { id: id },
                attributes: ['firstName', 'lastName', 'email']
            });

            // Fetch user profile data (age, gender, profession, mbti, zodiac, default_time_zone) from UserProfile
            let userProfile = await db.UserProfile.findOne({
                where: { id: id },
                attributes: ['age', 'gender', 'profession', 'mbti', 'zodiac', 'default_time_zone']
            });

            if (userAccount) {
                userData.user = {
                    firstName: userAccount.firstName,
                    lastName: userAccount.lastName,
                    email: userAccount.email,
                    age: userProfile ? userProfile.age : null,
                    gender: userProfile ? userProfile.gender : null,
                    profession: userProfile ? userProfile.profession : null,
                    mbti: userProfile ? userProfile.mbti : null,
                    zodiac: userProfile ? userProfile.zodiac : null,
                    default_time_zone: userProfile ? userProfile.default_time_zone : 'UTC'
                };
                userData.errCode = 0;
                userData.errMessage = 'OK';
            } else {
                userData.errCode = 2;
                userData.errMessage = 'User not found!';
            }
            resolve(userData);
        } catch (e) {
            reject(e);
        }
    });
};

const dashboardService = { handleUserDashBoard };
export default dashboardService;