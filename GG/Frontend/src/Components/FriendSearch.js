import React, { useState, useEffect, useMemo } from 'react';
import { DateTime } from "luxon";
import Select from "react-select";

import {
  handleDiscoverUsersApi,
  handleGetProfileCustomizationOptionsApi,
} from '../Services/findFriendsService';
import './FriendSearch.css';
import {
  createSearchParams,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { getUserData } from '../Utils/userData';
import {
  handleGetAllInterests,
  handleGetUserInterests,
  handleGetUserAvailability,
  handleAddTrueFriend,
  handleGetFriendRequests,
  handleAcceptFriendRequestByRequestId,
  handleRejectFriendRequestByRequestId,
} from '../Services/userService';
import { getImageUrl } from '../Services/uploadImageService';
import Navbar from './NavBar';

function Avatar({ src, name, size = 44 }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="fs-avatar" style={{ width: size, height: size }}>
      {src ? (
        <img src={getImageUrl(src)} alt={name} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function parseGameStats(raw) {
  if (raw == null || raw === '') return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function activityFromGameStats(raw) {
  const o = parseGameStats(raw);
  if (!o) return null;
  const term = o.term_matching_played || 0;
  const grammar = o.grammar_quiz_played || 0;
  const pron = o.pronunciation_played || 0;
  const played = o.games_played ?? term + grammar + pron;
  if (!played && !o.perfect_score) return null;
  return { gamesPlayed: played, perfectRounds: o.perfect_score || 0 };
}

/** "Monday" / "monday" → canonical weekday name for comparison */
function normalizeDayName(d) {
  if (d == null) return '';
  const s = String(d).trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Parse HH:MM or HH:MM:SS to minutes from midnight */
function timeToMinutes(t) {
  if (t == null || t === '') return 0;
  const parts = String(t).trim().slice(0, 8).split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (Number.isNaN(h)) return 0;
  return h * 60 + m;
}

function intervalsOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/**
 * Selected slots from AvailabilityPicker use day_of_week + start_time/end_time.
 * Legacy shapes used day + time ("8 am"). We normalize to { day, startMin, endMin }.
 */
function normalizeSelectedAvailabilitySlots(slots, viewerTimeZone) {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const zone = viewerTimeZone || 'UTC';
  const out = [];
  for (const slot of slots) {
    const day = normalizeDayName(slot.day_of_week || slot.day);
    if (!day) continue;

    let startMin;
    let endMin;
    if (slot.start_time != null && String(slot.start_time).trim() !== '') {
      startMin = timeToMinutes(slot.start_time);
      endMin =
        slot.end_time != null && String(slot.end_time).trim() !== ''
          ? timeToMinutes(slot.end_time)
          : startMin + 60;
    } else if (slot.time) {
      const dt = DateTime.fromFormat(String(slot.time).trim(), 'h a', { zone });
      if (!dt.isValid) continue;
      startMin = dt.hour * 60 + dt.minute;
      endMin = startMin + 60;
    } else {
      continue;
    }
    if (endMin <= startMin) endMin = startMin + 60;
    out.push({ day, startMin, endMin });
  }
  return out;
}

function userOverlapsSelectedSchedule(user, normalizedSlots) {
  if (!normalizedSlots.length) return true;
  if (!Array.isArray(user.Availability) || user.Availability.length === 0) return false;

  return normalizedSlots.some((sel) =>
    user.Availability.some((us) => {
      const uDay = normalizeDayName(us.day_of_week);
      if (uDay !== sel.day) return false;
      const uStart = timeToMinutes(us.start_time);
      let uEnd =
        us.end_time != null && String(us.end_time).trim() !== ''
          ? timeToMinutes(us.end_time)
          : uStart + 60;
      if (uEnd <= uStart) uEnd = uStart + 60;
      return intervalsOverlap(sel.startMin, sel.endMin, uStart, uEnd);
    })
  );
}

const MBTI_OPTIONS = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP'
].map(v => ({ value: v, label: v }));

const ZODIAC_OPTIONS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
].map(v => ({ value: v, label: v }));

const FILTER_TABS = ['Guide', 'Personality', 'Interests', 'Schedule', 'Match filters'];

const COMMITMENT_FLEX_OPTIONS = [
  { value: 0, label: 'Exact level' },
  { value: 1, label: '±1 level' },
  { value: 2, label: '±2 levels' },
];

const selectStyles = {
  container: (base) => ({ ...base, width: '100%' }),
  control:   (base, state) => ({
    ...base, minHeight: 38, borderRadius: 8,
    borderColor: state.isFocused ? '#6344A6' : '#d4d4d8',
    boxShadow: 'none', fontSize: 13,
    '&:hover': { borderColor: '#6344A6' }
  }),
  multiValue:       (base) => ({ ...base, background: '#ede9fe' }),
  multiValueLabel:  (base) => ({ ...base, color: '#6344A6', fontSize: 12 }),
  multiValueRemove: (base) => ({ ...base, color: '#6344A6', ':hover': { background: '#6344A6', color: '#fff' } }),
  menu: (base) => ({ ...base, zIndex: 5 })
};

const FriendSearch = ({ embedded = false }) => {
  const [search] = useSearchParams();
  const id = search.get('id');
  const navigate = useNavigate();
  const currentUserEmail = getUserData()?.email;

  const [filterInput, setFilterInput] = useState('');
  const [allUserNames, setAllUserNames] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileBlockedMessage, setProfileBlockedMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedMbti, setSelectedMbti] = useState([]);
  const [selectedZodiac, setSelectedZodiac] = useState([]);
  /** -1 = no filter panel open (avoid jumping to Guide after availability / reload) */
  const [activeFilter, setActiveFilter] = useState(-1);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [] });
  const [sortDiscover, setSortDiscover] = useState('best_match');
  const [filterMatchLearningGoal, setFilterMatchLearningGoal] = useState('');
  const [filterMatchCommunicationStyle, setFilterMatchCommunicationStyle] = useState('');
  const [filterMatchCommitment, setFilterMatchCommitment] = useState('');
  const [filterCommitmentFlex, setFilterCommitmentFlex] = useState(0);
  const [matchFieldOptions, setMatchFieldOptions] = useState({ learningGoals: [], communicationStyles: [] });

  const fetchDiscoverAndEnrich = async (opts) => {
    const discoverRes = await handleDiscoverUsersApi(id, opts);
    const usersArr = discoverRes?.data ?? [];
    const mergedUsers = await Promise.all(
      (usersArr || []).map(async (user) => {
        let userInterests = [];
        try {
          const r = await handleGetUserInterests(user.id);
          userInterests = r || [];
        } catch { /* ignore */ }
        let userAvailability = [];
        try {
          const r = await handleGetUserAvailability(user.id);
          const av = r?.availability ?? r;
          userAvailability = Array.isArray(av) ? av : [];
        } catch { /* ignore */ }
        return {
          ...user,
          Interests: userInterests,
          Availability: userAvailability,
          score: user.matchScore != null ? Number(user.matchScore) : null,
        };
      })
    );
    const visibleUsers = mergedUsers.filter((u) => {
      const isSelfById = id && String(u.id) === String(id);
      const isSelfByEmail = currentUserEmail && u.email === currentUserEmail;
      const isSelf = Boolean(isSelfById || isSelfByEmail);
      return (u.visibility ? u.visibility === 'Show' : true) && !isSelf;
    });
    return visibleUsers;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setFilterMatchLearningGoal('');
        setFilterMatchCommunicationStyle('');
        setFilterMatchCommitment('');
        setFilterCommitmentFlex(0);
        setSortDiscover('best_match');
        const visibleUsers = await fetchDiscoverAndEnrich({ sort: 'best_match' });
        setAllUserNames(visibleUsers);
        setCurrentUser(getUserData());
        setLoading(false);
      } catch (err) {
        const code = err?.response?.data?.code;
        if (code === 'PROFILE_INCOMPLETE') {
          setProfileBlockedMessage(
            err?.response?.data?.message || 'Complete your profile before finding friends.'
          );
          setError(null);
        } else {
          setError(err);
        }
        setLoading(false);
      }
    };
    fetchUserData();

    const fetchInterests = async () => {
      try {
        const res = await handleGetAllInterests();
        const raw = res?.data ?? res;
        const names = Array.isArray(raw)
          ? raw.map(i => i?.interest_name ?? i?.name ?? i).filter(Boolean)
          : [];
        setAllInterests(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
      } catch { setAllInterests([]); }
    };
    fetchInterests();

    const fetchRequests = async () => {
      if (!id) return;
      try {
        const res = await handleGetFriendRequests(id);
        setFriendRequests({
          incoming: Array.isArray(res?.incoming) ? res.incoming : [],
          outgoing: Array.isArray(res?.outgoing) ? res.outgoing : [],
        });
      } catch { }
    };
    fetchRequests();
  // Intentionally [id] only: initial discover + interests load; fetchDiscoverAndEnrich closes over id.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const loadMatchOptions = async () => {
      try {
        const raw = await handleGetProfileCustomizationOptionsApi();
        const cfg = raw?.data ?? raw;
        setMatchFieldOptions({
          learningGoals: Array.isArray(cfg?.learningGoals) ? cfg.learningGoals : [],
          communicationStyles: Array.isArray(cfg?.communicationStyles) ? cfg.communicationStyles : [],
        });
      } catch {
        setMatchFieldOptions({ learningGoals: [], communicationStyles: [] });
      }
    };
    loadMatchOptions();
  }, []);

  useEffect(() => {
    const availabilityParam = search.get('availability');
    if (availabilityParam) {
      try {
        const parsed = JSON.parse(availabilityParam);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedAvailability(parsed);
          setActiveFilter(3);
        }
      } catch {
        /* ignore */
      }
    }
  }, [search]);

  const flash = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 2500); };

  const getRequestStatusForUser = (userId) => {
    const incoming = friendRequests.incoming.find(r => Number(r.requesterId) === Number(userId));
    if (incoming) return { status: 'pending_received', requestId: incoming.id };
    const outgoing = friendRequests.outgoing.find(r => Number(r.recipientId) === Number(userId));
    if (outgoing) return { status: 'pending_sent', requestId: outgoing.id };
    return { status: 'none', requestId: null };
  };

  const handleSendRequest = async (user) => {
    try {
      await handleAddTrueFriend(Number(id), Number(user.id));
      flash(`Friend request sent to ${user.firstName} ${user.lastName}`);
      await refreshRequests();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Could not send request';
      flash(`Could not add friend: ${msg}`);
    }
  };

  const refreshRequests = async () => {
    if (!id) return;
    try {
      const res = await handleGetFriendRequests(id);
      setFriendRequests({
        incoming: Array.isArray(res?.incoming) ? res.incoming : [],
        outgoing: Array.isArray(res?.outgoing) ? res.outgoing : [],
      });
    } catch { }
  };

  const handleAccept = async (requestId, requesterName) => {
    try {
      await handleAcceptFriendRequestByRequestId(requestId, Number(id));
      await refreshRequests();
      flash(`You are now friends with ${requesterName}!`);
    } catch (err) {
      flash('Could not accept request.');
    }
  };

  const handleDecline = async (requestId, requesterName) => {
    try {
      await handleRejectFriendRequestByRequestId(requestId, Number(id));
      await refreshRequests();
      flash(`Request from ${requesterName} declined.`);
    } catch (err) {
      flash('Could not decline request.');
    }
  };

  const discoverRequestOpts = (sortVal) => ({
    sort: sortVal,
    learningGoal: filterMatchLearningGoal || undefined,
    communicationStyle: filterMatchCommunicationStyle || undefined,
    commitmentLevel: filterMatchCommitment === '' ? undefined : Number(filterMatchCommitment),
    commitmentFlex: filterCommitmentFlex,
    search: (filterInput || '').trim() || undefined,
  });

  const applyClientOnlyFilters = (visibleUsers) => {
    let base = visibleUsers;
    if (selectedMbti.length) {
      const s = new Set(selectedMbti.map(v => v.toUpperCase()));
      base = base.filter(u => s.has(String(u.mbti || '').toUpperCase()));
    }
    if (selectedZodiac.length) {
      const s = new Set(selectedZodiac.map(v => v.toLowerCase()));
      base = base.filter(u => s.has(String(u.zodiac || '').toLowerCase()));
    }
    if (selectedInterests.length) {
      const wanted = new Set(selectedInterests.map(v => v.toLowerCase()));
      base = base.filter(u => {
        const names = [];
        if (Array.isArray(u.Interests)) {
          for (const it of u.Interests) {
            const n = (it?.interest_name ?? it)?.toString().toLowerCase();
            if (n) names.push(n);
          }
        }
        [u.interests, u.interest, u.hobby].filter(Boolean)
          .flatMap(v => Array.isArray(v) ? v : [v])
          .forEach(v => names.push(String(v).toLowerCase()));
        return names.some(x => wanted.has(x));
      });
    }
    return base;
  };

  const displayedUsers = useMemo(() => {
    let base = allUserNames;
    const qNorm = (filterInput || '').trim().toLowerCase();
    if (!id && qNorm) {
      base = base.filter(
        (u) =>
          (u.firstName || '').toLowerCase().includes(qNorm) ||
          (u.lastName || '').toLowerCase().includes(qNorm) ||
          (u.email || '').toLowerCase().includes(qNorm)
      );
    }
    base = applyClientOnlyFilters(base);
    const viewerTz = currentUser?.default_time_zone || getUserData()?.default_time_zone || 'UTC';
    const slots = normalizeSelectedAvailabilitySlots(selectedAvailability, viewerTz);
    if (slots.length) {
      base = base.filter((u) => userOverlapsSelectedSchedule(u, slots));
    }
    if (sortDiscover === 'best_match') {
      base = [...base].sort(
        (a, b) => (Number(b.matchScore) || 0) - (Number(a.matchScore) || 0)
      );
    }
    return base;
  }, [
    allUserNames,
    filterInput,
    id,
    selectedMbti,
    selectedZodiac,
    selectedInterests,
    selectedAvailability,
    currentUser?.default_time_zone,
    sortDiscover,
  ]);

  const applyMatchFilters = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const visibleUsers = await fetchDiscoverAndEnrich(discoverRequestOpts(sortDiscover));
      setAllUserNames(visibleUsers);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const applySortDiscover = async (nextSort) => {
    if (!id) return;
    setSortDiscover(nextSort);
    setLoading(true);
    setError(null);
    try {
      const visibleUsers = await fetchDiscoverAndEnrich(discoverRequestOpts(nextSort));
      setAllUserNames(visibleUsers);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const visibleUsers = await fetchDiscoverAndEnrich(discoverRequestOpts(sortDiscover));
      setAllUserNames(visibleUsers);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    setFilterInput('');
    setSelectedMbti([]);
    setSelectedZodiac([]);
    setSelectedInterests([]);
    setSelectedAvailability(null);
    setFilterMatchLearningGoal('');
    setFilterMatchCommunicationStyle('');
    setFilterMatchCommitment('');
    setFilterCommitmentFlex(0);
    setSortDiscover('best_match');
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const visibleUsers = await fetchDiscoverAndEnrich({
        sort: 'best_match',
        commitmentFlex: 0,
      });
      setAllUserNames(visibleUsers);
    } catch {
      /* keep list */
    } finally {
      setLoading(false);
    }
  };

  const getField = (user, fields) => {
    for (let f of fields) { if (user[f] != null) return user[f]; }
    return null;
  };

  if (loading) {
    return (
      <div className={`fs-page${embedded ? ' fs-page-embedded' : ''}`}>
        {!embedded && <Navbar id={id} />}
        <p style={{ textAlign: 'center', marginTop: embedded ? 24 : 60 }}>Loading...</p>
      </div>
    );
  }
  if (profileBlockedMessage) {
    return (
      <div className={`fs-page${embedded ? ' fs-page-embedded' : ''}`}>
        {!embedded && <Navbar id={id} />}
        <p style={{ textAlign: 'center', marginTop: embedded ? 24 : 60, color: '#b45309' }}>{profileBlockedMessage}</p>
      </div>
    );
  }
  if (error) {
    const detail =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      '';
    return (
      <div className={`fs-page${embedded ? ' fs-page-embedded' : ''}`}>
        {!embedded && <Navbar id={id} />}
        <p style={{ textAlign: 'center', marginTop: embedded ? 24 : 60, color: '#dc2626' }}>
          Error loading users.{detail ? ` ${detail}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className={`fs-page${embedded ? ' fs-page-embedded' : ''}`}>
      {!embedded && <Navbar id={id} />}

      <div className="fs-center">
        <div className="fs-card">
          {!embedded && (
            <button className="back-to-dashboard" onClick={() => navigate({ pathname: '/Dashboard', search: createSearchParams({ id }).toString() })}>Dashboard</button>
          )}
          <h1 className="fs-card-title">{embedded ? 'Discover' : 'Find Friends'}</h1>

          {/* Search bar — Instagram-style */}
          <div className="fs-search-wrap">
            <input
              className="fs-input"
              type="text"
              placeholder="Search by first or last name"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <button type="button" className="fs-btn-follow" onClick={applyFilters} title="Runs search on the server (case-insensitive)">
              Search
            </button>
          </div>

          {/* Filter tabs */}
          <div className="fs-filter-tabs">
            {FILTER_TABS.map((tab, i) => (
              <button
                key={tab}
                className={`fs-filter-tab ${activeFilter === i ? 'fs-filter-tab-active' : ''}`}
                onClick={() => setActiveFilter(activeFilter === i ? -1 : i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeFilter === 0 && (
            <div className="fs-filter-panel fs-filter-panel-tip">
              <p className="fs-help-lead">Quick tips</p>
              <ul className="fs-help-list fs-help-list--short">
                <li>
                  <strong>Search</strong> and filters (tap <em>Apply</em> where needed).{' '}
                  <strong>Schedule</strong> uses overlapping hours on the same day.
                </li>
                <li>
                  <strong>Best profile match</strong> sorts by goal, style, and commitment; other filters only narrow the list.
                </li>
              </ul>
            </div>
          )}

          {/* MBTI / Zodiac panel */}
          {activeFilter === 1 && (
            <div className="fs-filter-panel">
              <div className="fs-filter-row">
                <div>
                  <div className="fs-filter-label">MBTI</div>
                  <Select isMulti options={MBTI_OPTIONS}
                    value={MBTI_OPTIONS.filter(o => selectedMbti.includes(o.value))}
                    onChange={(vals) => setSelectedMbti((vals || []).map(v => v.value))}
                    placeholder="Select..." styles={selectStyles} />
                </div>
                <div>
                  <div className="fs-filter-label">Zodiac</div>
                  <Select isMulti options={ZODIAC_OPTIONS}
                    value={ZODIAC_OPTIONS.filter(o => selectedZodiac.includes(o.value))}
                    onChange={(vals) => setSelectedZodiac((vals || []).map(v => v.value))}
                    placeholder="Select..." styles={selectStyles} />
                </div>
              </div>
              <div className="fs-filter-actions">
                <button className="fs-btn-secondary" onClick={clearAll}>Clear</button>
                <button className="fs-btn-primary" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}

          {/* Interests panel */}
          {activeFilter === 2 && (
            <div className="fs-filter-panel">
              <div className="fs-filter-label">Interests</div>
              <Select isMulti
                options={allInterests.map(n => ({ value: n, label: n }))}
                value={allInterests.map(n => ({ value: n, label: n })).filter(o => selectedInterests.includes(o.value))}
                onChange={(vals) => setSelectedInterests((vals || []).map(v => v.value))}
                placeholder="Select interests..." styles={selectStyles} />
              <div className="fs-filter-actions">
                <button type="button" className="fs-btn-secondary" onClick={() => setSelectedInterests([])}>Clear</button>
                <button className="fs-btn-primary" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}

          {/* Availability panel */}
          {activeFilter === 3 && (
            <div className="fs-filter-panel">
              <p className="fs-panel-desc fs-panel-desc--short">
                We match overlapping hours on the same day (not identical schedules).
              </p>
              <button
                type="button"
                className="fs-btn-primary"
                style={{ width: '100%' }}
                onClick={() => navigate({
                  pathname: '/AvailabilityPicker',
                  search: createSearchParams({ id, returnTo: 'Friends', friendsSub: 'discover' }).toString(),
                })}
              >
                Choose my free times
              </button>
              {selectedAvailability && selectedAvailability.length > 0 && (
                <>
                  <div className="fs-avail-display">
                    {selectedAvailability.map((slot, i) => {
                      const day = slot.day_of_week || slot.day || '';
                      const start = (slot.start_time || '').toString().slice(0, 5);
                      const end = (slot.end_time || '').toString().slice(0, 5);
                      const label = end ? `${day} ${start}–${end}` : `${day} ${start}`;
                      return (
                        <span key={i} className="fs-avail-slot">{label}</span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="fs-btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => setSelectedAvailability(null)}
                  >
                    Clear schedule filter
                  </button>
                </>
              )}
            </div>
          )}

          {/* Match profile — server-side filter + sort */}
          {activeFilter === 4 && (
            <div className="fs-filter-panel">
              <div className="fs-filter-label">Learning objective</div>
              <Select
                styles={selectStyles}
                isClearable
                placeholder="Any goal"
                options={matchFieldOptions.learningGoals.map((g) => ({ value: g, label: g }))}
                value={filterMatchLearningGoal ? { value: filterMatchLearningGoal, label: filterMatchLearningGoal } : null}
                onChange={(o) => setFilterMatchLearningGoal(o?.value ?? '')}
              />
              <div className="fs-filter-label" style={{ marginTop: 10 }}>Communication style</div>
              <Select
                styles={selectStyles}
                isClearable
                placeholder="Any style"
                options={matchFieldOptions.communicationStyles.map((g) => ({ value: g, label: g }))}
                value={filterMatchCommunicationStyle ? { value: filterMatchCommunicationStyle, label: filterMatchCommunicationStyle } : null}
                onChange={(o) => setFilterMatchCommunicationStyle(o?.value ?? '')}
              />
              <div className="fs-filter-label" style={{ marginTop: 10 }}>Commitment level</div>
              <Select
                styles={selectStyles}
                isClearable
                placeholder="Any level"
                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} star${n > 1 ? 's' : ''}` }))}
                value={filterMatchCommitment === '' ? null : { value: Number(filterMatchCommitment), label: String(filterMatchCommitment) }}
                onChange={(o) => setFilterMatchCommitment(o == null ? '' : String(o.value))}
              />
              <div className="fs-filter-label" style={{ marginTop: 10 }}>Commitment match</div>
              <Select
                styles={selectStyles}
                options={COMMITMENT_FLEX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={COMMITMENT_FLEX_OPTIONS.map((o) => ({ value: o.value, label: o.label })).find((o) => o.value === filterCommitmentFlex)}
                onChange={(o) => setFilterCommitmentFlex(o?.value ?? 0)}
              />
              <div className="fs-filter-actions">
                <button type="button" className="fs-btn-secondary" onClick={clearAll}>Clear all</button>
                <button type="button" className="fs-btn-primary" onClick={() => applyMatchFilters()}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Incoming requests card */}
        {friendRequests.incoming.length > 0 && (
          <div className="fs-card">
            <h2 className="fs-section-label">Requests</h2>
            <div className="fs-results-list">
              {friendRequests.incoming.map((req, i) => (
                <div key={i} className="fs-user-row">
                  <Avatar src={req.requesterProfileImage} name={req.requesterFirstName} />
                  <div className="fs-user-info">
                    <div className="fs-user-name">{req.requesterFirstName} {req.requesterLastName}</div>
                    <div className="fs-user-meta">{req.requesterEmail}</div>
                  </div>
                  <div className="fs-request-actions">
                    <button
                      className="fs-btn-accept"
                      onClick={() => handleAccept(req.id, `${req.requesterFirstName} ${req.requesterLastName || ''}`.trim())}
                    >
                      Accept
                    </button>
                    <button
                      className="fs-btn-decline"
                      onClick={() => handleDecline(req.id, `${req.requesterFirstName} ${req.requesterLastName || ''}`.trim())}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results card */}
        <div className="fs-card fs-results-card">
            <div className="fs-results-header">
            <span className="fs-results-count">
              {displayedUsers.length} {displayedUsers.length === 1 ? 'person' : 'people'}
            </span>
            <div className="fs-sort-group">
              <button
                type="button"
                className={`fs-btn-sort${sortDiscover === 'best_match' ? ' fs-btn-sort-active' : ''}`}
                onClick={() => applySortDiscover('best_match')}
                title="By goal, style, and commitment vs your profile. Filters only narrow the list."
              >
                Best profile match
              </button>
              <button
                type="button"
                className={`fs-btn-sort${sortDiscover === 'name' ? ' fs-btn-sort-active' : ''}`}
                onClick={() => applySortDiscover('name')}
                title="Alphabetical by first name"
              >
                Name A–Z
              </button>
            </div>
          </div>

          {displayedUsers.length === 0 ? (
            <div className="fs-empty-block">
              <p className="fs-empty">No one matches yet.</p>
              {normalizeSelectedAvailabilitySlots(
                selectedAvailability,
                currentUser?.default_time_zone || getUserData()?.default_time_zone || 'UTC'
              ).length > 0 ? (
                <p className="fs-empty-hint">
                  No one with overlapping hours for those times. Try clearing the Schedule filter, or pick more time slots.
                </p>
              ) : (
                <p className="fs-empty-hint">
                  Try clearing filters, searching a shorter name, or switching sort to Name A–Z.
                </p>
              )}
            </div>
          ) : (
            <div className="fs-results-list fs-results-cards">
              {displayedUsers.map((user, i) => {
                const nativeL = getField(user, ['nativeLanguage', 'native_language']);
                const targetL = getField(user, ['targetLanguage', 'target_language']);
                const prof = getField(user, ['targetLanguageProficiency', 'target_language_proficiency']);
                const activity = activityFromGameStats(user.gameStats);

                return (
                  <div key={i} className="fs-profile-card">
                    <div className="fs-profile-card-top">
                      <Avatar src={user.profileImage} name={user.firstName} size={52} />
                      <div className="fs-profile-card-head">
                        <div className="fs-user-name">{user.firstName} {user.lastName}</div>
                        <div className="fs-profile-card-sub">
                          {[user.profession, user.age ? `${user.age}` : null].filter(Boolean).join(' · ') || ' '}
                        </div>
                      </div>
                      <div className="fs-profile-card-cta">
                        {(() => {
                          const reqStatus = getRequestStatusForUser(user.id);
                          if (reqStatus.status === 'pending_sent') {
                            return <span className="fs-status-requested">Requested</span>;
                          }
                          if (reqStatus.status === 'pending_received' && reqStatus.requestId) {
                            const requesterName = `${user.firstName} ${user.lastName || ''}`.trim();
                            return (
                              <div className="fs-request-actions">
                                <button type="button" className="fs-btn-accept" onClick={(e) => { e.stopPropagation(); handleAccept(reqStatus.requestId, requesterName); }}>Accept</button>
                                <button type="button" className="fs-btn-decline" onClick={(e) => { e.stopPropagation(); handleDecline(reqStatus.requestId, requesterName); }}>Decline</button>
                              </div>
                            );
                          }
                          return (
                            <button type="button" className="fs-btn-follow"
                              onClick={(e) => { e.stopPropagation(); handleSendRequest(user); }}>
                              Follow
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {user.learning_goal ? (
                      <p className="fs-profile-one-line fs-profile-one-line--goal">{user.learning_goal}</p>
                    ) : null}

                    {(nativeL || targetL) ? (
                      <p className="fs-profile-one-line">
                        {nativeL || '—'} → {targetL || '—'}
                        {prof ? <span className="fs-profile-lang-prof"> · {prof}</span> : null}
                      </p>
                    ) : null}

                    <div className="fs-profile-stats-row">
                      {(user.level != null || user.xp != null) && (
                        <span className="fs-profile-stat-pill">
                          Lv {user.level ?? 1} · {user.xp ?? 0} XP
                        </span>
                      )}
                      {activity?.gamesPlayed ? (
                        <span className="fs-profile-stat-pill">{activity.gamesPlayed} games</span>
                      ) : null}
                      {user.matchScore != null && sortDiscover === 'best_match' ? (
                        <span
                          className="fs-profile-stat-pill fs-profile-match"
                          title="Goal, style, and commitment vs your profile."
                        >
                          {Math.round(Number(user.matchScore))}%
                        </span>
                      ) : null}
                    </div>

                    {(user.communication_style || user.commitment_level != null) ? (
                      <div className="fs-user-match-tags fs-profile-footer-tags">
                        {user.communication_style && <span className="fs-tag">{user.communication_style}</span>}
                        {user.commitment_level != null && user.commitment_level !== '' && (
                          <span className="fs-tag">Commitment {user.commitment_level}/5</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {successMessage && <div className="fs-toast">{successMessage}</div>}
    </div>
  );
};

export default FriendSearch;
