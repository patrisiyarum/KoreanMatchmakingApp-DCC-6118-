import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { createSearchParams, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from './NavBar';
import './UserReport.css';
import { handleGetAllUsersApi, handleGetUserProfileApi } from '../Services/findFriendsService';

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: 8,
    borderColor: '#d4d4d8',
    fontSize: 14,
    fontFamily: "var(--dl-font)",
  }),
  option: (base) => ({
    ...base,
    fontSize: 14,
    fontFamily: "var(--dl-font)",
  }),
};

function UserReport() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const id = search.get('id');

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [reportError, setReportError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await handleGetAllUsersApi();
        const userOptions = userData.map((user) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName}`,
        }));
        setUsers(userOptions);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFetchUser = async () => {
    if (!selectedUser) return;
    try {
      setReportError('');
      const response = await handleGetUserProfileApi(selectedUser.value);
      const userProfile = response.data ?? response;

      if (userProfile?.message && /not found/i.test(userProfile.message)) {
        setHidden(false);
        setUserInfo(null);
        setReportError('That user has not completed their profile yet.');
        return;
      }

      if (userProfile.visibility === 'Hide') {
        setHidden(true);
        setUserInfo(null);
      } else {
        setHidden(false);
        setUserInfo({
          rating: userProfile.rating ?? 'N/A',
          proficiency: userProfile.target_language_proficiency ?? 'N/A',
          comments: userProfile.comments ?? 'N/A',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setReportError('Could not fetch that user profile.');
    }
  };

  const handleBack = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id }).toString(),
    });
  };

  return (
    <div className="ur-page">
      <Navbar id={id} />
      <div className="ur-center">
        <div className="ur-card">
          <h1 className="ur-title">User Report</h1>
          <p className="ur-subtitle">
            Look up a learner and see their rating, proficiency, and feedback.
          </p>

          <div>
            <div className="ur-select-label">Select user</div>
            <Select
              styles={selectStyles}
              options={users}
              value={selectedUser}
              isLoading={loading}
              onChange={setSelectedUser}
              placeholder="Search by name..."
            />
          </div>

          {hidden && (
            <div className="ur-hidden">
              This user has chosen to hide their information.
            </div>
          )}

          {!hidden && userInfo && (
            <>
              <div className="ur-info-card">
                <div className="ur-info-label">Rating</div>
                <div className="ur-info-value">{userInfo.rating}</div>
              </div>
              <div className="ur-info-card">
                <div className="ur-info-label">Target Language Proficiency</div>
                <div className="ur-info-value">{userInfo.proficiency}</div>
              </div>
              <div className="ur-info-card">
                <div className="ur-info-label">Comments</div>
                <div className="ur-info-value">{userInfo.comments}</div>
              </div>
            </>
          )}

          <div className="ur-buttons">
            <button className="ur-btn-primary" type="button" onClick={handleFetchUser}>
              Fetch User
            </button>
            <button className="back-to-dashboard" type="button" onClick={handleBack}>Dashboard</button>
          </div>

          {reportError && (
            <div style={{ color: '#dc2626', marginTop: 12, textAlign: 'center' }}>
              {reportError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserReport;

