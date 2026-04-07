
 
import axios from '../Utils/axios';
 
export const handleGetUserStatsApi = async (userId) => {
  const response = await axios.get(`/api/games/user-stats/${userId}`);
  return response;
};
 
export const handleAwardXpApi = async (userId, xpAmount) => {
  const response = await axios.post('/api/games/award-xp', { userId, xpAmount });
  return response;
};
 

