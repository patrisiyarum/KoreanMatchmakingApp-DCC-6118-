import axios from '../Utils/axios';

const handleGetTranscripts = (userId) => {
    return axios.get(`/api/v1/getTranscripts/${userId}`);
};

export {
    handleGetTranscripts
};
