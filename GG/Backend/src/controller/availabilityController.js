import availabilityService from '../Service/availabilityService.js';

let getAvailability = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const slots = await availabilityService.getAvailability(userId);
        return res.status(200).json(slots);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to fetch availability' });
    }
}

let addAvailability = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const { slots } = req.body; // array or single
        if (!slots) return res.status(400).json({ message: 'time slots required' });
        const created = await availabilityService.addAvailability(userId, slots);
        // If the availability table is missing, treat as no-op but not an error
        if (!created || created.length === 0) {
            return res.status(200).json({ message: 'Availability feature not enabled yet, saved 0 slots.' });
        }
        return res.status(201).json(created);
    } catch (e) {
        console.error('Failed to add availability:', e);
        return res.status(200).json({ message: 'Availability feature not enabled yet, saved 0 slots.' });
    }
}

let removeAvailability = async (req, res) => {
    try {
        const id = +req.params.id;
        await availabilityService.removeAvailability(id);
        return res.status(204).send();
    } catch (e) {
        return res.status(500).json({ message: 'Failed to remove availability' });
    }
}

let replaceAvailability = async (req, res) => {
    try {
        const userId = +req.params.userId;
        const { slots } = req.body;
        if (!Array.isArray(slots)) return res.status(400).json({ message: 'time slots array required' });
        const created = await availabilityService.replaceAvailability(userId, slots);
        return res.status(200).json(created);
    } catch (e) {
        return res.status(500).json({ message: 'Failed to replace availability' });
    }
}

const availabilityController = { getAvailability, addAvailability, removeAvailability, replaceAvailability };
export default availabilityController;


