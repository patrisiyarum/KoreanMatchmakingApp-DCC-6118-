import axios from '../Utils/axios';

const handleFindFriendsApi = (id) => {
    return axios.post('/findFriends', {id: id});
};

const handleCreateFriendsApi = (id1, id2) => {
    return axios.post('/createFriends', {id1: id1, id2: id2});
};

export const handleGetAllUsersApi = async () => {
    try {
        const response = await axios.get('/api/v1/user-names'); // Fetch all users
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

const handleGetUserPreferencesApi = () => {
    return axios.get('/api/v1/user-preferences');
};

const handleGetProfileCustomizationOptionsApi = () => axios.get('/api/v1/profile-customization-options');

const handleGetUserNamesApi = (requesterId) => {
    const q = requesterId ? `?requesterId=${requesterId}` : '';
    return axios.get(`/api/v1/user-names${q}`); // Fetch all user names
};

/** Backend-sorted/filtered list for Find Friends (learning goal, communication style, commitment). */
const handleDiscoverUsersApi = (requesterId, opts = {}) => {
    if (!requesterId) return Promise.reject(new Error('requesterId required'));
    const p = new URLSearchParams();
    p.set('requesterId', String(requesterId));
    p.set('sort', opts.sort === 'name' ? 'name' : 'best_match');
    if (opts.learningGoal) p.set('learningGoal', String(opts.learningGoal));
    if (opts.communicationStyle) p.set('communicationStyle', String(opts.communicationStyle));
    if (opts.commitmentLevel !== undefined && opts.commitmentLevel !== null && opts.commitmentLevel !== '') {
        p.set('commitmentLevel', String(opts.commitmentLevel));
    }
    if (opts.commitmentFlex !== undefined && opts.commitmentFlex !== null) {
        p.set('commitmentFlex', String(opts.commitmentFlex));
    }
    if (opts.search != null && String(opts.search).trim() !== '') {
        p.set('search', String(opts.search).trim().slice(0, 120));
    }
    return axios.get(`/api/v1/discover-users?${p.toString()}`);
};

const handleAddFriendApi = (userId1, userId2, userInfo) => {
    return axios.post('/api/addFriend', {
        user_id_2: userId2,
        user_2_first_name: userInfo.firstName,
        user_2_last_name: userInfo.lastName
    });
};

// New function to fetch an individual user profile by ID
const handleGetUserProfileApi = (userId) => {
    return axios.get(`/api/v1/getUserProfile/${userId}`);
};

export {
    handleFindFriendsApi,
    handleAddFriendApi,
    handleCreateFriendsApi,
    handleGetUserNamesApi,
    handleDiscoverUsersApi,
    handleGetProfileCustomizationOptionsApi,
    handleGetUserPreferencesApi,
    handleGetUserProfileApi // Export the new function
};