import axios from '../Utils/axios';
 
export const handleTeamCreateApi = async (userId, teamName, logo) => {
  const response = await axios.post('/api/teams/create', { userId, teamName, logo });
  return response;
};
 
export const handleJoinTeamApi = async (userId, inviteCode) => {
  const response = await axios.post('/api/teams/join', { userId, inviteCode });
  return response;
};
 
export const handleSearchTeamsApi = async (name) => {
  const response = await axios.get(`/api/teams/search?name=${encodeURIComponent(name)}`);
  return response;
};
 
export const handleGetInviteCodeApi = async (ownerId) => {
  const response = await axios.post('/api/teams/invite', { ownerId });
  return response;
};
 
export const handleGetMyTeamApi = async (userId) => {
  const response = await axios.get(`/api/teams/my-team/${userId}`);
  return response;
};
 
export const handleUpdateTeamApi = async (userId, teamName, logo) => {
  const response = await axios.put('/api/teams/update', { userId, teamName, logo });
  return response;
};
 
export const handleKickMemberApi = async (ownerId, targetUserId) => {
  const response = await axios.delete('/api/teams/kick', { data: { ownerId, targetUserId } });
  return response;
};
 
export const handleLeaveTeamApi = async (userId) => {
  const response = await axios.delete('/api/teams/leave', { data: { userId } });
  return response;
};
 
export const handleDisbandTeamApi = async (ownerId) => {
  const response = await axios.delete('/api/teams/disband', { data: { ownerId } });
  return response;
};

export const handleSendTeamInviteApi = async (inviterId, inviteeId) => {
  const response = await axios.post('/api/teams/send-invite', { inviterId, inviteeId });
  return response;
};

export const handleGetTeamInvitesApi = async (userId) => {
  const response = await axios.get(`/api/teams/invites/${userId}`);
  return response;
};

export const handleAcceptTeamInviteApi = async (inviteId, userId) => {
  const response = await axios.post(`/api/teams/invites/${inviteId}/accept`, { userId });
  return response;
};

export const handleDeclineTeamInviteApi = async (inviteId, userId) => {
  const response = await axios.post(`/api/teams/invites/${inviteId}/decline`, { userId });
  return response;
};