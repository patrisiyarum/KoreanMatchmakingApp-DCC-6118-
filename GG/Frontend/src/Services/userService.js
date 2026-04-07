import axios from '../Utils/axios';

const handleLoginApi = (userEmail, userPassword) => {
    return axios.post('/api/login', {email: userEmail, password: userPassword}) ;
}

const handleUserLogout = (id) => {
    return axios.post('/api/logout', {id: id})
}

const handleRegisterApi= (firstName, lastName, Email, userPassword) => {
    return axios.post('/Register', {firstName: firstName, lastName: lastName, email: Email, password: userPassword}) ;
}

const handleProfileCreationAPI = (id, native_language, target_language, target_language_proficiency, age, gender, profession, mbti, zodiac, default_time_zone, visibility, learning_goal, communication_style, commitment_level) => {
    return axios.post('/CreateProfile', {
        id,
        native_language,
        target_language,
        target_language_proficiency,
        age,
        gender,
        profession,
        mbti,
        zodiac,
        default_time_zone,
        visibility,
        learning_goal,
        communication_style,
        commitment_level,
    });
}

const handleProfileUpdateAPI = (id, native_language, target_language, target_language_proficiency, age, gender, profession, mbti, zodiac, default_time_zone, visibility, learning_goal, communication_style, commitment_level) => {
    return axios.put('/UpdateProfile', {id, native_language, target_language, target_language_proficiency, age, gender, profession, mbti, zodiac, default_time_zone, visibility, learning_goal, communication_style, commitment_level}) ;
}

//return
const handleChatApi = (senderId) => {
    return axios.get(`/Chats/${senderId}`)
}

const handleGetUser = (receiverId) => {
    return axios.get(`/api/getUser/${receiverId}`)
}

const getMessages = (chatId) => {
    return axios.get(`/Message/${chatId}`)
}

const addMessage = (data) => {
    return axios.post(`/Message/`, data)
}

const handleTranslator = (en, ko) => {
    return axios.post('/Translator', {en: en, ko: ko});
}

const handleMatch = (userId, userNative, userTarget) => {
    return axios.get(`/api/findMatch/${userId}/${userNative}/${userTarget}`)
}

const handleGetProfile = (receiverId) => {
    return axios.get(`/api/getProfile/${receiverId}`)
}

const handleDataPopulation = () => {
    return axios.get(`/populateData`)
}

const handleUpdateRating = (userId, rating) => {
    return axios.post('/api/v1/update-rating', {
        user_id: userId,
        rating: rating
    });
}

const handleUpdateProficiency = (userId, proficiency) => {
    return axios.post('/api/v1/update-proficiency', {
        user_id: userId,
        proficiency: proficiency
    });
};

const handleAddComment = (userId, comment) => {
    return axios.post('/api/v1/add-comment', {
        user_id: userId,
        comment: comment
    });
};

const handleAddToFriendsList = (userId, friendsList) => {
    return axios.post('/api/v1/addToFriendsList', {
        userId: userId,
        friendsList: friendsList, // Expecting an array or a formatted string
    });
};

const handleGetFriendsList = (userId) => {
    return axios.get(`/api/v1/getFriendsList?id=${userId}`);
};

const handleGetAllInterests = () => {
    return axios.get('/api/v1/interests');
};

const handleCreateInterest = (interestName) => {
    return axios.post('/api/v1/interests', { interest_name: interestName });
};

const handleGetUserInterests = (userId) => {
    return axios.get(`/api/v1/users/${userId}/interests`);
};

const handleAddUserInterest = (userId, interest) => {
    return axios.post(`/api/v1/users/${userId}/interests`, { interest });
};

const handleRemoveUserInterest = (userId, interestId) => {
    return axios.delete(`/api/v1/users/${userId}/interests/${interestId}`);
};

const handleReplaceUserInterests = (userId, interestIds) => {
    return axios.put(`/api/v1/users/${userId}/interests`, { interest_ids: interestIds });
};

const handleGetUserAvailability = (userId) => {
    return axios.get(`/api/v1/users/${userId}/availability`);
};

const handleAddUserAvailability = (userId, slots) => {
    // If a single time slot is passed, wrap it in an array
    const formattedSlots = Array.isArray(slots) ? slots : [slots];
    return axios.post(`/api/v1/users/${userId}/availability`, { slots: formattedSlots });
};

const handleRemoveUserAvailability = (userId, availabilityId) => {
    return axios.delete(`/api/v1/users/${userId}/availability/${availabilityId}`);
};

const handleReplaceUserAvailability = (userId, slots) => {
    return axios.put(`/api/v1/users/${userId}/availability`, { slots });
};


export const handleAddTrueFriend = (userId1, userId2) => {
  return axios.post('/api/v1/addTrueFriend', { userId1, userId2 });
};

export const handleGetFriendRequests = async (userId) => {
  return axios.get(`/api/v1/friendRequests/${userId}`);
};

export const handleAcceptFriendRequest = async (requestId, userId) => {
  return axios.put(`/api/v1/friendRequests/${requestId}/accept`, { userId });
};

export const handleRejectFriendRequest = async (requestId, userId) => {
  return axios.put(`/api/v1/friendRequests/${requestId}/reject`, { userId });
};

// Aliases for newer UI components (requestId-based flow).
export const handleAcceptFriendRequestByRequestId = handleAcceptFriendRequest;
export const handleRejectFriendRequestByRequestId = handleRejectFriendRequest;

export const handleRemoveTrueFriend = async (userId1, userId2) => {
  const { data } = await axios.delete('/api/v1/removeTrueFriend', {
    data: { userId1, userId2 }
  });
  return data; // { message: 'Friend removed successfully' } or 404/500
};

export const handleGetTrueFriendsList = async (userId) => {
  const url = `/api/v1/friends/${userId}`;
  const r = await fetch(url, { credentials: 'include' }); 
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return data;
};

export const handleGetUserProficiencyAndRating = async (userId) => {
    try {
        const response = await axios.get(`/api/v1/getUserProfile/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user proficiency and rating:', error);
        throw error;
    }
};

export const handleGetTrueUserAvailability = (userId) => {
  return axios.get(`/api/v1/users/${userId}/availability`);
  // this directly resolves to { availability: [...] }
};

export const handleCreateMeeting = (user1_id, user2_id, day_of_week, start_time, end_time) =>
  axios.post("/api/v1/createMeeting", {
    user1_id,
    user2_id,
    day_of_week,
    start_time,
    end_time
  });

export const handleGetMeetings = (userId) => {
  return axios.get(`/api/v1/meetings/${userId}`);
};

export const handleDeleteMeeting = (
  user1_id,
  user2_id,
  day_of_week,
  start_time,
  end_time
) => {
  // axios delete with body: use `data` field
  return axios.delete('/api/v1/deleteMeeting', {
    data: { user1_id, user2_id, day_of_week, start_time, end_time },
  });
};
export {
        handleLoginApi, handleRegisterApi, handleProfileCreationAPI, handleProfileUpdateAPI, handleChatApi, 
        handleGetUser, getMessages, addMessage, handleTranslator, handleMatch, handleGetProfile,
        handleDataPopulation, handleUserLogout, handleUpdateRating, handleUpdateProficiency,
        handleAddComment, handleAddToFriendsList, handleGetFriendsList,
        handleGetAllInterests,
        handleCreateInterest,
        handleGetUserInterests,
        handleAddUserInterest,
        handleRemoveUserInterest,
        handleReplaceUserInterests,
        handleGetUserAvailability,
        handleAddUserAvailability,
        handleRemoveUserAvailability,
        handleReplaceUserAvailability
};