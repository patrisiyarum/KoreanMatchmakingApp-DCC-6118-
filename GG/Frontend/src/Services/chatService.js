import axios from '../Utils/axios';

export const createChat = (senderId, receiverId) => {
    return axios.put(`/api/v1/createChat/${senderId}/${receiverId}`);
};
