import axios from '../Utils/axios';

export const uploadRecording = (formData) => {
    return axios.post('/api/v1/upload-recording', formData);
};
