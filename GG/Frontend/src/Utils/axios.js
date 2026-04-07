import axios from 'axios';
import { getApiBase } from './apiBase';

const instance = axios.create({
    baseURL: getApiBase(),
    withCredentials: true,
});

instance.interceptors.response.use(
    (response) => {
        const{data} = response;
        return response.data;

    }

)

export default instance;