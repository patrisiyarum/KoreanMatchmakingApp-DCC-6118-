import interestService from '../Service/interestService.js';

let listInterests = async (req, res) => {
    try {
        const interests = await interestService.listInterests();
        return res.status(200).json(interests);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to list interests' });
    }
}

let createInterest = async (req, res) => {
    try {
        const { interest_name } = req.body;
        if (!interest_name) return res.status(400).json({ message: 'interest_name is required' });
        const interest = await interestService.createInterest(interest_name);
        return res.status(201).json(interest);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to create interest' });
    }
}

const interestController = { listInterests, createInterest };
export default interestController;


