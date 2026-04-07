// questService.js
// Place in: GG/Frontend/src/Services/questService.js

import axios from '../Utils/axios';

// ── Fetch all active individual quests for a user (with their progress) ──
export const handleGetUserQuestsApi = async (userId) => {
  const response = await axios.get(`/api/quests/user/${userId}`);
  return response;
};

// ── Fetch all active team quests for a team (with team's progress) ──
export const handleGetTeamQuestsApi = async (teamId) => {
  const response = await axios.get(`/api/quests/team/${teamId}`);
  return response;
};

// ── Called when a user completes a game action ──
// gameType should match the quest's gameType e.g. 'term-matching'
// Call this at the end of each game to update both individual + team progress
export const handleIncrementQuestApi = async (userId, gameType) => {
  const [individual, team] = await Promise.all([
    axios.post('/api/quests/user/increment', { userId, gameType }),
    axios.post('/api/quests/team/increment', { userId, gameType }),
  ]);
  return { individual, team };
};

// ── Admin: get all quests ──
export const handleGetAllQuestsApi = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await axios.get(`/api/quests?${params}`);
  return response;
};

// ── Admin: create a new quest ──
export const handleCreateQuestApi = async (questData) => {
  const response = await axios.post('/api/quests', questData);
  return response;
};

// ── Admin: update a quest ──
export const handleUpdateQuestApi = async (id, questData) => {
  const response = await axios.put(`/api/quests/${id}`, questData);
  return response;
};

// ── Admin: deactivate a quest ──
export const handleDeactivateQuestApi = async (id) => {
  const response = await axios.delete(`/api/quests/${id}`);
  return response;
};
