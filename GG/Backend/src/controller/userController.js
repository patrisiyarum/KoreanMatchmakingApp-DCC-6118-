import userService from '../Service/userService.js';
import { validateProfileCustomizationFields } from '../Service/profileValidation.js';

let currUser = null

let handleLogin = async (req, res) => {
    try {
        let email = req.body.email;
        let password = req.body.password;
        if (!email || !password) {
            return res.status(400).json({
                errorCode: 1,
                message: "Missing username or/and password",
            });
        }
        let userData = await userService.handleUserLogin(email, password);
        currUser = userData;

        return res.status(200).json({
            errorCode: userData.errCode,
            message: userData.errMessage,
            id: userData.id,
            user: userData.user ? userData.user : {},
        });
    } catch (err) {
        console.error("handleLogin:", err);
        return res.status(500).json({
            errorCode: 1,
            message: err.message || "Login failed (server error).",
        });
    }
};

let handleRegister = async (req, res) => {
    try {
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let email = req.body.email;
        let password = req.body.password;
        if (!email || !password) {
            return res.status(400).json({
                errorCode: 1,
                message: "Missing username or/and password",
            });
        }
        if (
            firstName === undefined ||
            firstName === null ||
            String(firstName).trim() === "" ||
            lastName === undefined ||
            lastName === null ||
            String(lastName).trim() === ""
        ) {
            return res.status(400).json({
                errorCode: 1,
                message: "First name and last name are required.",
            });
        }
        let save = true;
        let userData = await userService.handleUserRegister(
            firstName,
            lastName,
            email,
            password,
            save
        );
        currUser = userData;
        console.log(userData.id);

        return res.status(200).json({
            errorCode: userData.errCode,
            message: userData.errMessage,
            id: userData.id,
            user: userData.user ? userData.user : {},
        });
    } catch (err) {
        console.error("handleRegister:", err);
        return res.status(500).json({
            errorCode: 1,
            message: err.message || "Registration failed (server error).",
        });
    }
};

let handleProfileCreation = async (req, res) => {
    try {
        let native_language = req.body.native_language;
        let target_language = req.body.target_language;
        let target_language_proficiency = req.body.target_language_proficiency;
        let age = req.body.age;
        let gender = req.body.gender;
        let profession = req.body.profession;
        let mbti = req.body.mbti;
        let zodiac = req.body.zodiac;
        let default_time_zone = req.body.default_time_zone;
        let visibility = req.body.visibility;
        let learning_goal = req.body.learning_goal;
        let communication_style = req.body.communication_style;
        let commitment_level = req.body.commitment_level;
        let id = req.body.id;
        const pv = validateProfileCustomizationFields(
            { learning_goal, communication_style, commitment_level },
            { requireAll: true }
        );
        if (!pv.ok) {
            return res.status(400).json({
                errorCode: 2,
                message: pv.errors.join(' '),
                validationErrors: pv.errors,
            });
        }
        let save = true;
        let userData = await userService.handleProfileCreation(
            id,
            native_language,
            target_language,
            target_language_proficiency,
            age,
            gender,
            profession,
            mbti,
            zodiac,
            default_time_zone,
            visibility,
            learning_goal,
            communication_style,
            commitment_level,
            save
        );
        return res.status(200).json({
            errorCode: userData.errCode,
            message: userData.errMessage,
            user: userData.user ? userData.user : {},
        });
    } catch (err) {
        console.error("handleProfileCreation:", err);
        return res.status(500).json({
            errorCode: 1,
            message: err.message || "Profile creation failed (server error).",
        });
    }
};

let handleProfileUpdate = async (req, res) => {
    try {
        let native_language = req.body.native_language;
        let target_language = req.body.target_language;
        let target_language_proficiency = req.body.target_language_proficiency;
        let age = req.body.age;
        let gender = req.body.gender;
        let profession = req.body.profession;
        let mbti = req.body.mbti;
        let zodiac = req.body.zodiac;
        let default_time_zone = req.body.default_time_zone;
        let visibility = req.body.visibility;
        let learning_goal = req.body.learning_goal;
        let communication_style = req.body.communication_style;
        let commitment_level = req.body.commitment_level;
        let bio = req.body.bio;
        let id = req.body.id;
        if (bio != null && String(bio).length > 2000) {
            return res.status(400).json({
                errorCode: 2,
                message: 'bio must be 2000 characters or less',
                validationErrors: ['bio too long'],
            });
        }
        const pv = validateProfileCustomizationFields({ learning_goal, communication_style, commitment_level });
        if (!pv.ok) {
            return res.status(400).json({
                errorCode: 2,
                message: pv.errors.join(' '),
                validationErrors: pv.errors,
            });
        }
        let userData = await userService.handleProfileUpdate(
            id,
            native_language,
            target_language,
            target_language_proficiency,
            age,
            gender,
            profession,
            mbti,
            zodiac,
            default_time_zone,
            visibility,
            learning_goal,
            communication_style,
            commitment_level,
            bio
        );
        return res.status(200).json({
            errorCode: userData.errCode,
            message: userData.errMessage,
            user: userData.user ? userData.user : {},
        });
    } catch (err) {
        console.error("handleProfileUpdate:", err);
        return res.status(500).json({
            errorCode: 1,
            message: err.message || "Profile update failed (server error).",
        });
    }
};

let handleDataPopulation = async (req, res) => {
    let languages = ["English", "Korean"];
    let genders = ["Male", "Female", "Other"];
    let professions = ["Education", "Engineering", "Retail", "Finance", "Law", "Medicine", "Scientist", "Marketing"];
    let mbtis = ["INTJ", "INFJ", "ISTJ", "ISTP", "INTP", "INFP", "ISFJ", "ISFP", "ENTJ", "ENFJ", "ESTJ", "ESTP", "ENTP", "ENFP", "ESFJ", "ESFP"];
    let zodiacs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Capricorn", "Aquarius", "Pisces"];
    let visibilities = ["Show", "Hide"];
    let proficiencies = ["Beginner", "Elementary", "Intermediate", "Proficient", "Fluent"];
    for (let i=0; i<100; i++) {
        let fName = "SampleUser_" + i
        let lName = "SampleUser_" + i
        let email = "DummyDataEmail_" + i
        let pass = "Password"
        let random_index = Math.floor(Math.random() * 2);
        let native = languages[random_index];
        let target = languages[((random_index+1)%2)];
        let age = 18 + Math.floor(Math.random() * 18);
        let gender = genders[Math.floor(Math.random() * 3)];
        let profession = professions[Math.floor(Math.random() * 6)];
        let zodiac = zodiacs[Math.floor(Math.random() * 12)];
        let default_time_zone = "UTC";
        let mbti = mbtis[Math.floor(Math.random() * 16)];
        let visibility = visibilities[Math.floor(Math.random() * 2)];
        let proficiency = proficiencies[Math.floor(Math.random() * 5)];
        let userData = await userService.handleDataPopulation(fName, lName, email, pass, native, target, age, gender, proficiency, profession, mbti, zodiac, default_time_zone, visibility)
    }
}

let handleGetUser = async (req, res) => {
    console.log("Second Check")
    const userId = req.params.userId
    if (userId) {
        let userData = await userService.getUserInfoById(userId)
        return res.send(userData)

    }else {
        return res.send("User not found !");
    }
}

let handleGetProfile = async (req, res) => {
    console.log("Fourth Check")
    const userId = req.params.userId
    if (userId) {
        let userData = await userService.getProfileById(userId)
        return res.send(userData)

    }else {
        return res.send("User not found !");
    }
}

let handleTranslator = async (req, res) => {
    let en = req.body.en;
    let ko = req.body.ko;
    let userData = await userService.handleTranslator(en, ko);
    console.log(userData);
    return res.status(200).json({
        errorCode: userData.errCode,
        message: userData.errMessage,
        user: userData.user? userData.user : {}
    });
}

let handleLogout = async (req, res) => {
    try {
        if (currUser && currUser.id) {
            await userService.handleUserLogout(currUser.id);
        }
    } catch (e) {
        console.error('Logout error (non-fatal):', e.message);
    } finally {
        currUser = null;
        return res.status(200).json({
            errorCode: 0,
            message: 'Logged out',
        });
    }
}

const userController = {
    handleLogin: handleLogin,
    handleRegister: handleRegister,
    handleProfileCreation: handleProfileCreation,
    handleProfileUpdate: handleProfileUpdate,
    handleGetUser : handleGetUser,
    handleTranslator : handleTranslator,
    handleGetProfile : handleGetProfile,
    handleDataPopulation : handleDataPopulation,
    handleLogout : handleLogout
};
export default userController;