import axios from '../Utils/axios';

export const handleGetUserBadgesApi = async (userId) => {
  const response = await axios.get(`/api/badges/user/${userId}`);
  return response;
};

export const handleGetAllBadgesWithProgressApi = async (userId) => {
  const response = await axios.get(`/api/badges/user/${userId}/all`);
  return response;
};

export const handleCheckBadgesApi = async (userId) => {
  const response = await axios.post(`/api/badges/user/${userId}/check`);
  return response;
};
