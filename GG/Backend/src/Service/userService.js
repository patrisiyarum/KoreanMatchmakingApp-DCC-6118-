import db, { sequelize } from '../models/index.js';
import bcrypt from 'bcryptjs';

let user_id = null
const errorMessage = "Invalid username or password!";
let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try{
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist){
                //use already exists
                //Then, compare password
                //1. Check again if later there someone delete that user in the database after we check
                let UserAccount = await db.UserAccount.findOne({
                    where: {email: email}
                });
                if (UserAccount){
                    //Compare password, using bycrypt lib
                    let check = await bcrypt.compareSync(password, UserAccount.password);
                    if (check){
                        userData.errCode = 0;
                        userData.errMessage = 'Correct username and password'
                        userData.UserAccount = UserAccount;
                        user_id = UserAccount['dataValues']['id']
                        userData.id =  user_id
                        UserAccount.loggedIn = true;
                        await UserAccount.save();
                        userData.loggedIn = true;
                        console.log(user_id)
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = errorMessage;
                    }
                }else {
                    userData.errCode = 2;
                    userData.errMessage = errorMessage;
                }
            }else {
                userData.errCode = 1;
                userData.errMessage = errorMessage;
            }
            resolve(userData);
        }catch(e){
            reject(e)
        }
    })
}

let handleUserRegister = (firstName, lastName, email, password, save) => {
    return new Promise(async (resolve, reject) => {
        try{
            // Return obj to Controller and the Controller will response to the user
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist){
                console.log("Email taken")
                //user already exists
                //Then, compare password
                //1. Check again if later there someone delete that user in the database after we check
                userData.errCode = 1;
                userData.errMessage = 'User already exists';
            }
            else {
                /*userDate object {
                errCode: 1
                errMessage: "username not exist"
                }
                */
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);
                let UserAccount = await db.UserAccount.build({
                    email: email,
                    password: hash,
                    firstName: firstName,
                    lastName: lastName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    loggedIn: true
                });
                if (save) {
                    await UserAccount.save()
                }
                //console.log("tenth check")
                console.log("name: ", UserAccount.firstName)
                //console.log("id: ", UserAccount.id);
                userData.errCode = 0;
                userData.errMessage = 'Successfully Registered';
                //user_id = UserAccount['dataValues']['id']
                let user_id = UserAccount.get('id')
                console.log("id: ", user_id);
                userData.id = user_id
                }
            resolve(userData);
    
        }catch(e){
            reject(e)
        }
    })
}


let checkUserEmail = (userEmail) => {
    return new Promise (async (resolve, reject) => {
        //findOne() --> return undefine if no user found
        try{
            let user = await db.UserAccount.findOne({
                where: {email : userEmail}
            })
            console.log(userEmail)
            if (user){
                resolve(true)
            }else {
                resolve(false)
            }
        }catch(e){
            reject(e);
        }
    })
}

let handleProfileCreation = (id, native_language, target_language, target_language_proficiency, age, gender, profession, mbti, zodiac, default_time_zone, visibility, save) => {
    return new Promise(async (resolve, reject) => {
        try{
            let userData = {};
            console.log("id passed to user service is: ", id)
            let userProfile = await db.UserProfile.build({
                id: id,
                native_language: native_language,
                target_language: target_language,
                target_language_proficiency: target_language_proficiency,
                age: age,
                gender: gender,
                profession: profession,
                mbti: mbti,
                zodiac: zodiac,
                default_time_zone: default_time_zone,
                visibility: visibility
            });
            if(save) {
                await userProfile.save()
            } 
            console.log("Id passed to profile is: ", userProfile.id)
            console.log(userProfile);
            userData.errCode = 0;
            userData.errMessage = 'Profile Successfully Created!';
            resolve(userData);
        }catch(e){
            reject(e)
        }
    })
}

let handleProfileUpdate = (id, native_language, target_language, target_language_proficiency, age, gender, profession, mbti, zodiac, default_time_zone, visibility, learning_goal, communication_style, commitment_level) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            console.log("Updating profile for user ID:", id);
            const existing = await db.UserProfile.findOne({ where: { id } });
            const keepIfEmpty = (incoming, current) => {
                if (incoming === undefined || incoming === null) return current ?? null;
                if (typeof incoming === 'string' && incoming.trim() === '') return current ?? null;
                return incoming;
            };

            await db.UserProfile.upsert({
                id: id,
                native_language: keepIfEmpty(native_language, existing?.native_language),
                target_language: keepIfEmpty(target_language, existing?.target_language),
                target_language_proficiency: keepIfEmpty(target_language_proficiency, existing?.target_language_proficiency),
                age: keepIfEmpty(age, existing?.age),
                gender: keepIfEmpty(gender, existing?.gender),
                profession: keepIfEmpty(profession, existing?.profession),
                mbti: keepIfEmpty(mbti, existing?.mbti),
                zodiac: keepIfEmpty(zodiac, existing?.zodiac),
                default_time_zone: keepIfEmpty(default_time_zone, existing?.default_time_zone || 'UTC'),
                visibility: keepIfEmpty(visibility, existing?.visibility),
                learning_goal: keepIfEmpty(learning_goal, existing?.learning_goal),
                communication_style: keepIfEmpty(communication_style, existing?.communication_style),
                commitment_level: keepIfEmpty(commitment_level, existing?.commitment_level),
            });
 
            userData.errCode = 0;
            userData.errMessage = 'Profile successfully updated!';
            resolve(userData);
        } catch (e) {
            reject(e);
        }
    });
};
 

let handleDataPopulation = (fName, lName, email, pass, native, target, age, gender, proficiency, profession, mbti, zodiac, default_time_zone, visibility) => {
    return new Promise(async (resolve, reject) => {
        try{
            //await db.UserAccount.truncate()
            //await db.UserProfile.truncate()
            let userData = {};
            let account = await handleUserRegister(fName, lName, email, pass, true)
            let id = account.id
            console.log("id from account is: ", id)
            let profile = await handleProfileCreation(id, native, target, proficiency, age, gender, profession, mbti, zodiac, default_time_zone, visibility, true)
            console.log("hi");
            userData.errCode = 0;
            userData.errMessage = 'Data Successfully Populated!';
            resolve(userData);
        }catch(e){
            reject(e)
        }
    })
}

let getUserInfoById = (userId) => {
    return new Promise (async (resolve, reject) => {
        try{
            console.log("Third Check")
            let user = await db.UserAccount.findOne({
                where: {id: userId}
            })
            console.log(userId)
            if (user){
                resolve(user);
            }else {
                resolve([]);
            }
        }catch(e){
            reject(e);
        }
    })
}

let getProfileById = (userId) => {
    return new Promise (async (resolve, reject) => {
        try{
            console.log("Fifth Check")
            let user = await db.UserProfile.findOne({
                where: {id: userId},
                include: [
                    { model: db.Interest, through: { attributes: [] } },
                    { model: db.UserAvailability }
                ]
            })
            console.log(userId)
            if (user){
                resolve(user);
            }else {
                resolve([]);
            }
        }catch(e){
            reject(e);
        }
    })
}

let handleTranslator = (en, ko) => {
    return new Promise (async (resolve, reject) => {
        try {
            let userTranslation = await db.UserTranslations.create({
                en: en,
                ko: ko
            });
            console.log("translation");
        } catch(e) {
            reject(e);
        }
    })
}

let handleUserLogout = (id) => {
    return new Promise(async (resolve, reject) => {
        let userData = {};
        try {
            let UserAccount = await db.UserAccount.findOne({
                where: {id: id}
            });
            if (UserAccount) {
                userData.errCode = 0
                userData.UserAccount = UserAccount
                user_id = UserAccount['dataValues']['id']
                userData.id = user_id
                UserAccount.loggedIn = false
                await UserAccount.save()
                userData.loggedIn = false
                console.log('Log out ' + user_id)
            }
            resolve(userData)
        } catch(e) {
            reject(e)
        }
    })
}

const userService = {
    handleUserLogin,
    checkUserEmail,
    handleUserRegister,
    handleProfileCreation,
    handleProfileUpdate,
    getUserInfoById,
    handleTranslator,
    getProfileById,
    handleDataPopulation,
    handleUserLogout
  };
  
  export default userService;
