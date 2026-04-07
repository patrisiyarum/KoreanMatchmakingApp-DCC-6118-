import axios from '../Utils/axios';

export const createChallenge = async (challengerId, challengedId, gameType, difficulty = 'Beginner') => {
  const response = await axios.post('/api/challenges', { challengerId, challengedId, gameType, difficulty });
  return response;
};

export const getChallengeFriends = async (userId) => {
  const response = await axios.get(`/api/challenges/friends/${userId}`);
  return response;
};

export const getUserChallenges = async (userId, status) => {
  const params = status ? `?status=${status}` : '';
  const response = await axios.get(`/api/challenges/user/${userId}${params}`);
  return response;
};

export const getChallenge = async (challengeId) => {
  const response = await axios.get(`/api/challenges/${challengeId}`);
  return response;
};

export const acceptChallenge = async (challengeId) => {
  const response = await axios.put(`/api/challenges/${challengeId}/accept`);
  return response;
};

export const declineChallenge = async (challengeId) => {
  const response = await axios.put(`/api/challenges/${challengeId}/decline`);
  return response;
};

export const submitChallengeScore = async (challengeId, userId, score) => {
  const response = await axios.post(`/api/challenges/${challengeId}/submit-score`, { userId, score });
  return response;
};

export const getChallengeStats = async (userId) => {
  const response = await axios.get(`/api/challenges/user/${userId}/stats`);
  return response;
};
