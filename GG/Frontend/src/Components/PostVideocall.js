import React, { useState, useEffect } from 'react';
import './Postvideocall.css';
import { createSearchParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import { handleGetAllUsersApi } from '../Services/findFriendsService';
import Select from "react-select";
import {
  handleUpdateRating,
  handleUpdateProficiency,
  handleAddComment,
  handleGetUser,
  handleGetProfile,
  handleGetTrueFriendsList,   // ✅ TRUE methods
  handleAddTrueFriend,        // ✅
} from '../Services/userService';
import { createChat } from '../Services/chatService.js';

function PostVideocall() {
  const [friends, setFriends] = useState([]); // array of { id, firstName, lastName, email }
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id"); // current userId (string)
  const selfId = search.get("selfId");     // same thing as id, but explicit
  const partnerId = search.get("partnerId");

  const [users, setUsers] = useState([]);
  const [chatPartnerId, setPartner] = useState(null);
  const [rating, setRating] = useState(0);
  const [targetLanguageProficiency, setTargetLanguageProficiency] = useState('');
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const recordingFilename = useLocation();

  const TargetLanguageProficiency = [
    { value: "Beginner", label: "Beginner" },
    { value: "Elementary", label: "Elementary" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Proficient", label: "Proficient" },
    { value: "Fluent", label: "Fluent" },
  ];

  // 1) Find chat partner + load all users
  useEffect(() => {
    const participants = JSON.parse(localStorage.getItem('participantData')) || {};
    console.log("Participants in the call:", participants);

    setPartner(partnerId || null);
    console.log("Chat Partner ID:", partnerId);

    const fetchPartnerProfile = async () => {
      if (!partnerId) return;
      try {
        console.log("Fetching first and last name from the database for user ID:", partnerId);
        const response = await handleGetProfile(partnerId);
        console.log('Partner profile:', response);
      } catch (error) {
        console.error('Error fetching name:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const userData = await handleGetAllUsersApi();
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchPartnerProfile();
    fetchUsers();
  }, [id]);

  // 2) Fetch TRUE friends from friendsmodel
  useEffect(() => {
    const fetchFriendsFromDB = async () => {
      if (!id) {
        console.error('User ID is missing in the query string.');
        return;
      }

      try {
        console.log("Fetching TRUE friends list from the database for user ID:", id);
        const response = await handleGetTrueFriendsList(id);
        console.log("Full TRUE friends API Response:", response);

        if (response?.friendsList && Array.isArray(response.friendsList)) {
          setFriends(response.friendsList); // [{ id, firstName, lastName, email }, ...]
          console.log("TRUE friends list from database:", response.friendsList);
        } else {
          console.error('Unexpected TRUE friends response structure:', response);
          setFriends([]);
        }
      } catch (error) {
        console.error('Error fetching TRUE friends list:', error);
        setFriends([]);
      }
    };

    fetchFriendsFromDB();
  }, [id]);

  // 3) Add friend using addTrueFriend
  const handleAddFriend = async () => {

    console.log('handleAddFriend clicked');   // <--- add this
    console.log('current user id:', id);
    console.log('partnerId:', partnerId);

    if (!partnerId) {
      console.error("No chat partner ID.");
      return;
    }

    const friend = users.find(user => String(user.id) === String(partnerId));
    if (!friend) {
      console.error("No user found with partnerId:", partnerId);
      return;
    }

    // Check if already TRUE friends
    const alreadyFriend = friends.some(
      (f) => String(f.id) === String(friend.id)
    );
    if (alreadyFriend) {
      setSuccessMessage('User is already on your friends list!');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      console.log(`Calling addTrueFriend for userId1=${id}, userId2=${friend.id}`);
      await handleAddTrueFriend(Number(id), Number(friend.id));
      setSuccessMessage('Friend request sent successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      if (error.response) {
        console.error('API Error:', error.response.data);
        if (error.response.status === 409) {
          setSuccessMessage(error.response.data?.error || 'Request already pending or friendship already exists.');
          setTimeout(() => setSuccessMessage(''), 3000);
          return;
        }
        if (error.response.status === 429) {
          setSuccessMessage(error.response.data?.error || 'You cannot re-add this user yet.');
          setTimeout(() => setSuccessMessage(''), 3000);
          return;
        }
      } else {
        console.error('Request Error:', error.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Creating chat in database");
      if (users.length >= 2) {
        createChat(users[0].id, users[1].id);
      }

      console.log(
        "Submitting rating:", rating,
        "proficiency:", targetLanguageProficiency,
        //"and comment:", comment,
        "for user ID:", partnerId
      );

      await handleUpdateRating(partnerId, rating);
      //await handleUpdateProficiency(chatPartnerId, targetLanguageProficiency);

      // if (comment != null){
      //   await handleAddComment(partnerId, comment);
      // }


      setSuccessMessage('Thanks for submitting a User Review!');
      setTimeout(() => setSuccessMessage(''), 3000);
      handleBack()
    } catch (error) {
      console.error("Failed to update rating or add comment:", error);
    }
  };

  const handleBack = () => {
    navigate({
      pathname: "/Dashboard",
      search: createSearchParams({ id }).toString()
    });
  };

  return (
    <div className="videocall-Background">
      <div className="videocall-container">
        <h2 className="feedback-title">Please Provide your Feedback!</h2>
        <div className="form-container">
          <form className="videocall-form">
            <div className="form-group">
              <label>Leave comment for chat partner</label>
              <input
                placeholder="Enter Comment"
                onChange={(e) => setComment(e.target.value)}
                className="input"
                type="text"
              />
            </div>

            {/* <div className="form-group">
              <label>Rank chat partner&apos;s proficiency in their target language</label>
              <Select
                className="form-group"
                classNamePrefix="react-select"
                options={TargetLanguageProficiency}
                onChange={(selectedOption) =>
                  setTargetLanguageProficiency(selectedOption.value)
                }
              />
            </div> */}

            <div className="form-group">
              <label>Rate chat partner&apos;s ability as a study partner</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((num) => (
                  <span
                    key={num}
                    onClick={() => setRating(num)}
                    className={`star ${rating >= num ? 'selected' : ''}`}
                  >
                    &#9733;
                  </span>
                ))}
              </div>
              <p className="rating-output">Rating is: {rating}/5</p>
            </div>
          </form>
        </div>

        <div className="buttons-container">
          <button className="back-to-dashboard" onClick={handleBack}>Dashboard</button>
          <Button className="btn-submit" onClick={handleSubmit}>
            Submit
          </Button>
          <Button className="btn-add-friend" onClick={handleAddFriend}>Add Friend</Button>
        </div>

        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostVideocall;