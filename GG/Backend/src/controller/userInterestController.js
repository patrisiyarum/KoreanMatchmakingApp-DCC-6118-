import userInterestService from '../Service/userInterestService.js';

let getUserInterests = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const interests = await userInterestService.getUserInterests(userId);
        return res.status(200).json(interests);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to get user interests' });
    }
}

let addUserInterest = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const { interest } = req.body; // id or name
        if (!interest) return res.status(400).json({ message: 'interest is required' });
        const rec = await userInterestService.addUserInterest(userId, interest);
        return res.status(201).json(rec);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to add user interest' });
    }
}

let removeUserInterest = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const interestId = +req.params.interestId;
        await userInterestService.removeUserInterest(userId, interestId);
        return res.status(204).send();
    } catch (e) {
        return res.status(500).json({ message: 'Failed to remove user interest' });
    }
}

let replaceUserInterests = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const { interest_ids } = req.body;
        if (!Array.isArray(interest_ids)) return res.status(400).json({ message: 'interest_ids array required' });
        await userInterestService.replaceUserInterests(userId, interest_ids);
        return res.status(200).json({ message: 'OK' });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to replace user interests' });
    }
}

const userInterestController = { getUserInterests, addUserInterest, removeUserInterest, replaceUserInterests };
export default userInterestController;


