import React, { useState, useEffect, useMemo, useRef } from 'react';
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

/** Collapsible filter panel on embedded Discover (matches reference app UX). */
function partnerBioText(user) {
  const b = user?.bio != null && String(user.bio).trim() !== '' ? String(user.bio).trim() : '';
  if (b) return b;
  return user?.learning_goal != null && String(user.learning_goal).trim() !== ''
    ? String(user.learning_goal).trim()
    : '';
}

function DiscoverFiltersCardWrapper({ embedded, summaryLabel, children }) {
  if (embedded) {
    return (
      <details className="lm-embed-filters">
        <summary className="lm-embed-filters-summary">{summaryLabel}</summary>
        {children}
      </details>
    );
  }
  return children;
}

function commitmentHintText(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return '';
  if (n <= 2) return 'Casual';
  if (n >= 4) return 'Very committed';
  return 'Moderate';
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

const FILTER_TABS = [
  'How it works',
  'Personality & interests',
  'Schedule',
  'Match profile',
];

/** Must match FILTER_TABS order (used when deep-linking e.g. from Availability picker) */
const FILTER_IDX = { guide: 0, personality: 1, schedule: 2, match: 3 };

const COMMITMENT_FLEX_OPTIONS = [
  { value: 0, label: 'Exact level' },
  { value: 1, label: '±1 level' },
  { value: 2, label: '±2 levels' },
];

const selectStyles = {
  container: (base) => ({ ...base, width: '100%' }),
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 6,
    borderColor: state.isFocused ? '#111827' : '#d1d5db',
    backgroundColor: '#fff',
    boxShadow: state.isFocused ? '0 0 0 1px #111827' : 'none',
    fontSize: 13,
    '&:hover': { borderColor: '#9ca3af' },
  }),
  multiValue: (base) => ({ ...base, background: '#ede9fe' }),
  multiValueLabel: (base) => ({ ...base, color: 'var(--dl-primary)', fontSize: 12 }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--dl-primary)',
    ':hover': { background: 'var(--dl-primary)', color: '#fff' },
  }),
  menu: (base) => ({ ...base, zIndex: 20 }),
  placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: 13 }),
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

  /** Skip the first match-filter effect run after mount / id change (initial load handles fetch). */
  const skipMatchFilterRefetch = useRef(true);
  const discoverListLenRef = useRef(0);

  /** Embedded Friends → Discover: one card at a time (Language Exchange Matchmaker App / Discover.tsx). */
  const [discoverSwipeIndex, setDiscoverSwipeIndex] = useState(0);

  const clearPersonalityInterestSelections = () => {
    setSelectedMbti([]);
    setSelectedZodiac([]);
    setSelectedInterests([]);
  };

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
        skipMatchFilterRefetch.current = true;
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
          setActiveFilter(FILTER_IDX.schedule);
        }
      } catch {
        /* ignore */
      }
    }
  }, [search]);

  const flash = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 2500); };

  const scrollDiscoverResultsIntoView = () => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 959px)').matches) return;
    requestAnimationFrame(() => {
      document.getElementById('fs-discover-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const getRequestStatusForUser = (userId) => {
    const incoming = friendRequests.incoming.find(r => Number(r.requesterId) === Number(userId));
    if (incoming) return { status: 'pending_received', requestId: incoming.id };
    const outgoing = friendRequests.outgoing.find(r => Number(r.recipientId) === Number(userId));
    if (outgoing) return { status: 'pending_sent', requestId: outgoing.id };
    return { status: 'none', requestId: null };
  };

  const bumpDiscoverSwipeIndex = () => {
    window.setTimeout(() => {
      setDiscoverSwipeIndex((i) => {
        const len = discoverListLenRef.current;
        if (len <= 1) return 0;
        return i >= len - 1 ? 0 : i + 1;
      });
    }, 300);
  };

  const handleSendRequest = async (user, opts = {}) => {
    const { fromSwipe = false } = opts;
    try {
      await handleAddTrueFriend(Number(id), Number(user.id));
      flash(`Friend request sent to ${user.firstName} ${user.lastName}`);
      if (embedded && fromSwipe) {
        bumpDiscoverSwipeIndex();
      }
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
  });

  useEffect(() => {
    skipMatchFilterRefetch.current = true;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (skipMatchFilterRefetch.current) {
      skipMatchFilterRefetch.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const visibleUsers = await fetchDiscoverAndEnrich(discoverRequestOpts(sortDiscover));
        if (!cancelled) setAllUserNames(visibleUsers);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit sortDiscover: sorting is client-side only (no refetch on sort toggle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filterMatchLearningGoal, filterMatchCommunicationStyle, filterMatchCommitment, filterCommitmentFlex]);

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
    if (qNorm) {
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
    } else {
      base = [...base].sort((a, b) => {
        const c = (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
        if (c !== 0) return c;
        return (a.lastName || '').localeCompare(b.lastName || '', undefined, { sensitivity: 'base' });
      });
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

  discoverListLenRef.current = displayedUsers.length;

  useEffect(() => {
    if (!embedded) return;
    setDiscoverSwipeIndex((i) => {
      if (displayedUsers.length === 0) return 0;
      return i >= displayedUsers.length ? 0 : i;
    });
  }, [embedded, displayedUsers.length]);

  const applySortDiscover = (nextSort) => {
    setSortDiscover(nextSort);
  };

  const clearAll = async () => {
    skipMatchFilterRefetch.current = true;
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
      scrollDiscoverResultsIntoView();
    }
  };

  const getField = (user, fields) => {
    for (let f of fields) { if (user[f] != null) return user[f]; }
    return null;
  };

  const swipeUser =
    embedded && displayedUsers.length > 0
      ? displayedUsers[Math.min(discoverSwipeIndex, displayedUsers.length - 1)]
      : null;

  const renderEmbeddedSwipeDeck = () => {
    const user = swipeUser;
    if (!user) return null;
    const nativeL = getField(user, ['nativeLanguage', 'native_language']);
    const targetL = getField(user, ['targetLanguage', 'target_language']);
    const prof = getField(user, ['targetLanguageProficiency', 'target_language_proficiency']);
    const emailLine = typeof user.email === 'string' && user.email.trim()
      ? user.email.trim()
      : '';
    const subLine = emailLine
      || [user.profession, user.age != null && user.age !== '' ? String(user.age) : null]
        .filter(Boolean)
        .join(' · ')
      || null;

    const commitmentRaw = user.commitment_level;
    const commitmentNum = commitmentRaw === '' || commitmentRaw == null
      ? null
      : Number(commitmentRaw);
    const hasCommitment = commitmentNum != null && !Number.isNaN(commitmentNum);

    const showLearningStyle = Boolean(
      user.learning_goal
      || user.communication_style
      || hasCommitment
    );
    const matchPct = user.matchScore != null && !Number.isNaN(Number(user.matchScore))
      ? Math.round(Number(user.matchScore))
      : null;
    const showMatchHighlight = sortDiscover === 'best_match' && matchPct != null;

    const langLine = [
      nativeL ? `Native ${nativeL}` : null,
      targetL ? `Target ${targetL}` : null,
      prof || null,
    ].filter(Boolean).join(' · ');

    const aboutLine = [
      user.age != null && user.age !== '' ? String(user.age) : null,
      user.gender || null,
      user.profession || null,
      user.mbti || null,
      user.zodiac || null,
    ].filter(Boolean).join(' · ');

    const learnLine = [
      user.learning_goal || null,
      user.communication_style || null,
    ].filter(Boolean).join(' · ');

    const profileMerged = [langLine, aboutLine].filter(Boolean).join(' · ');
    const hasLearningBlock = Boolean(
      showLearningStyle && (learnLine || hasCommitment)
    );
    const badgeCount = user.badgeCount != null ? Number(user.badgeCount) : 0;
    const badgeIcons = typeof user.badgeIcons === 'string' && user.badgeIcons.trim()
      ? user.badgeIcons.trim().split(/\s+/).filter(Boolean)
      : [];
    const showBadges = badgeCount > 0 || badgeIcons.length > 0;
    const userInterestNames = (Array.isArray(user.Interests) ? user.Interests : [])
      .map((it) => (it?.interest_name ?? it?.name ?? it)?.toString())
      .filter(Boolean);
    const viewerInterestLc = new Set(selectedInterests.map((s) => String(s).toLowerCase()));
    const sharedInterestCount = userInterestNames.filter((n) =>
      viewerInterestLc.has(String(n).toLowerCase())
    ).length;

    const bioText = partnerBioText(user);
    const hasBodyContent = Boolean(
      profileMerged
      || hasLearningBlock
      || showBadges
      || user.target_language_proficiency
      || userInterestNames.length > 0
      || bioText
      || sharedInterestCount > 0
      || getRequestStatusForUser(user.id).status !== 'none'
    );

    const reqStatus = getRequestStatusForUser(user.id);
    const requesterName = `${user.firstName} ${user.lastName || ''}`.trim();

    const onHeart = () => {
      if (reqStatus.status === 'pending_sent') {
        bumpDiscoverSwipeIndex();
        return;
      }
      if (reqStatus.status === 'pending_received') return;
      handleSendRequest(user, { fromSwipe: true });
    };

    return (
      <div className="lm-discover-swipe-wrap">
        <div className="fs-profile-card fs-discover-card--minimal lm-discover-card--swipe">
          <div className="fs-discover-hero">
            <div className="fs-discover-avatar-wrap lm-discover-avatar-hero">
              <Avatar src={user.profileImage} name={user.firstName} size={88} />
            </div>
            <div className="fs-discover-hero-body">
              <h2 className="fs-discover-name">{user.firstName} {user.lastName}</h2>
              {(nativeL || targetL) ? (
                <p className="fs-discover-meta lm-discover-lang-pair" lang="en">
                  <span>{nativeL || '—'}</span>
                  <span className="lm-discover-lang-arrow" aria-hidden>↔</span>
                  <span>{targetL || '—'}</span>
                </p>
              ) : subLine ? <p className="fs-discover-meta">{subLine}</p> : null}
              {showMatchHighlight ? (
                <p
                  className="fs-discover-match-note"
                  title="Match score from your profiles and shared interests."
                >
                  <span className="fs-discover-match-label">Match</span>{' '}
                  <span lang="ko" className="fs-discover-match-ko">매칭</span> {matchPct}%
                </p>
              ) : null}
            </div>
          </div>

          {hasBodyContent ? (
            <div className="fs-discover-body">
              {reqStatus.status === 'pending_received' && reqStatus.requestId ? (
                <div className="lm-discover-request-bar">
                  <p className="lm-discover-request-label">They invited you to connect</p>
                  <div className="fs-request-actions">
                    <button type="button" className="fs-btn-accept" onClick={() => handleAccept(reqStatus.requestId, requesterName)}>Accept</button>
                    <button type="button" className="fs-btn-decline" onClick={() => handleDecline(reqStatus.requestId, requesterName)}>Decline</button>
                  </div>
                </div>
              ) : null}
              {reqStatus.status === 'pending_sent' ? (
                <p className="lm-discover-pending-note">Request sent — tap ✕ to see the next person.</p>
              ) : null}
              {user.target_language_proficiency ? (
                <div className="lm-discover-section">
                  <div className="lm-discover-label">Level</div>
                  <div className="lm-discover-value">{user.target_language_proficiency}</div>
                </div>
              ) : null}
              {userInterestNames.length > 0 ? (
                <div className="lm-discover-section">
                  <div className="lm-discover-label">Interests</div>
                  <div className="lm-interest-pills">
                    {userInterestNames.slice(0, 10).map((name, j) => (
                      <span
                        key={j}
                        className={`lm-interest-pill${
                          viewerInterestLc.has(String(name).toLowerCase())
                            ? ' lm-interest-pill--hot'
                            : ''
                        }`}
                      >
                        {name}
                        {viewerInterestLc.has(String(name).toLowerCase()) ? ' ✨' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {bioText ? (
                <div className="lm-discover-section">
                  <div className="lm-discover-label">Bio</div>
                  <div className="lm-discover-value lm-discover-bio">{bioText}</div>
                </div>
              ) : null}
              {sharedInterestCount > 0 ? (
                <div className="lm-shared-banner lm-shared-banner--target" role="status">
                  🎯 You have {sharedInterestCount} shared interest
                  {sharedInterestCount !== 1 ? 's' : ''}!
                </div>
              ) : null}
              {profileMerged &&
              !user.target_language_proficiency &&
              userInterestNames.length === 0 &&
              !bioText ? (
                <p className="fs-discover-line">{profileMerged}</p>
              ) : null}
              {hasLearningBlock ? (
                <>
                  {learnLine ? <p className="fs-discover-line">{learnLine}</p> : null}
                  {hasCommitment ? (
                    <p className="fs-discover-commit">
                      <span className="fs-discover-stars" aria-label={`Commitment ${commitmentNum} of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={n <= commitmentNum ? 'fs-disc-star fs-disc-star-on' : 'fs-disc-star'}
                          >
                            &#9733;
                          </span>
                        ))}
                      </span>
                      <span className="fs-discover-commit-hint">{commitmentHintText(commitmentNum)}</span>
                    </p>
                  ) : null}
                </>
              ) : null}
              {showBadges ? (
                <p className="fs-discover-badges-line">
                  {badgeIcons.map((icon, j) => (
                    <span key={j} className="fs-badge-emoji" title="Badge">{icon}</span>
                  ))}
                  {badgeCount > 0 ? (
                    <span className="fs-discover-badge-suffix">
                      {badgeIcons.length ? ' · ' : ''}{badgeCount} earned
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="lm-discover-swipe-actions">
          <button
            type="button"
            className="lm-swipe-btn lm-swipe-btn--pass"
            onClick={bumpDiscoverSwipeIndex}
            aria-label="Pass"
          >
            <span className="lm-swipe-btn-x" aria-hidden>✕</span>
          </button>
          <button
            type="button"
            className="lm-swipe-btn lm-swipe-btn--like"
            onClick={onHeart}
            aria-label="Send friend request"
            disabled={reqStatus.status === 'pending_received'}
          >
            <span className="lm-swipe-btn-heart" aria-hidden>♥</span>
          </button>
        </div>
      </div>
    );
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

      <div className={`fs-center fs-center--discover${embedded ? ' fs-center--discover-embedded lm-discover-embed-column' : ''}`}>
        <div className={`fs-discover-layout${embedded ? ' fs-discover-layout--embedded fs-discover-layout--embed-solo' : ''}`}>
          {!embedded ? (
          <div className="fs-discover-sidebar">
        <DiscoverFiltersCardWrapper embedded={false} summaryLabel="Search & filters">
        <div className="fs-card fs-card--discover-filters">
          {!embedded && (
            <button className="back-to-dashboard" onClick={() => navigate({ pathname: '/Dashboard', search: createSearchParams({ id }).toString() })}>Dashboard</button>
          )}
          {!embedded ? <h1 className="fs-card-title">Find Friends</h1> : null}

          {/* Search bar — Instagram-style */}
          <div className="fs-search-wrap">
            <input
              className="fs-input"
              type="text"
              placeholder="Search by first or last name"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              title="Filters the list below as you type"
            />
          </div>

          {/* Filters — shopping-style accordion */}
          <div className="fs-shop-filters" aria-label="Discover filters">
            <div className="fs-shop-filters-header">
              <span className="fs-shop-filters-title">Filters</span>
            </div>
            {FILTER_TABS.map((tab, i) => (
              <div
                key={tab}
                className={`fs-shop-filter-section${activeFilter === i ? ' fs-shop-filter-section--open' : ''}`}
              >
                <button
                  type="button"
                  className="fs-shop-filter-trigger"
                  onClick={() => setActiveFilter(activeFilter === i ? -1 : i)}
                  aria-expanded={activeFilter === i}
                >
                  <span className="fs-shop-filter-trigger-label">{tab}</span>
                  <span className="fs-shop-filter-chevron" aria-hidden="true" />
                </button>
                {activeFilter === i && (
                  <div className="fs-shop-filter-body">
                    {i === 0 && (
                      <div className="fs-filter-panel-tip fs-filter-panel-tip--in-accordion">
                        <p className="fs-help-lead">How Discover works</p>
                        <ol className="fs-help-list">
                          <li><strong>Search</strong> finds people by name (tap Search or Enter).</li>
                          <li>
                            <strong>Personality &amp; interests</strong> update the list as you choose; use <em>Clear</em> to reset.
                          </li>
                          <li>
                            <strong>Schedule.</strong>{' '}
                            Choose when you are usually free. We list people who have at least one overlapping hour on the same day
                            (times can differ slightly; we match overlap, not exact copies).
                          </li>
                          <li>
                            <strong>Match profile</strong> optionally limits the server list by goal, style, and commitment (same fields as your profile).
                            <strong> Best profile match</strong> sorts by a match score: learning goal, communication style, commitment, MBTI and zodiac when both of you have them, and overlapping interests from your profiles (the Interests filter still only narrows who appears).
                          </li>
                        </ol>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="fs-filter-panel fs-filter-panel--shop">
                        <div className="fs-shop-filter-group">
                          <div className="fs-shop-filter-group-title">Personality</div>
                          <div className="fs-filter-row">
                            <div>
                              <div className="fs-filter-label">MBTI</div>
                              <Select
                                isMulti
                                options={MBTI_OPTIONS}
                                value={MBTI_OPTIONS.filter((o) => selectedMbti.includes(o.value))}
                                onChange={(vals) => setSelectedMbti((vals || []).map((v) => v.value))}
                                placeholder="Any type"
                                styles={selectStyles}
                              />
                            </div>
                            <div>
                              <div className="fs-filter-label">Zodiac</div>
                              <Select
                                isMulti
                                options={ZODIAC_OPTIONS}
                                value={ZODIAC_OPTIONS.filter((o) => selectedZodiac.includes(o.value))}
                                onChange={(vals) => setSelectedZodiac((vals || []).map((v) => v.value))}
                                placeholder="Any sign"
                                styles={selectStyles}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="fs-shop-filter-group">
                          <div className="fs-shop-filter-group-title">Interests</div>
                          <Select
                            isMulti
                            options={allInterests.map((n) => ({ value: n, label: n }))}
                            value={allInterests
                              .map((n) => ({ value: n, label: n }))
                              .filter((o) => selectedInterests.includes(o.value))}
                            onChange={(vals) => setSelectedInterests((vals || []).map((v) => v.value))}
                            placeholder="Select interests…"
                            styles={selectStyles}
                          />
                        </div>
                        <div className="fs-filter-actions fs-filter-actions--shop fs-filter-actions--single">
                          <button
                            type="button"
                            className="fs-btn-secondary fs-btn-shop fs-btn-shop-block"
                            onClick={clearPersonalityInterestSelections}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="fs-filter-panel fs-filter-panel--shop">
                        <p className="fs-panel-desc">
                          Choose when you are usually free. We list people who have at least one overlapping hour on the same day
                          (times can differ slightly; we match overlap, not exact copies).
                        </p>
                        <button
                          type="button"
                          className="fs-btn-primary fs-btn-shop fs-btn-shop-block"
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
                              {selectedAvailability.map((slot, j) => {
                                const day = slot.day_of_week || slot.day || '';
                                const start = (slot.start_time || '').toString().slice(0, 5);
                                const end = (slot.end_time || '').toString().slice(0, 5);
                                const label = end ? `${day} ${start}–${end}` : `${day} ${start}`;
                                return (
                                  <span key={j} className="fs-avail-slot">{label}</span>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              className="fs-btn-secondary fs-btn-shop fs-btn-shop-block"
                              onClick={() => setSelectedAvailability(null)}
                            >
                              Clear schedule filter
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {i === 3 && (
                      <div className="fs-filter-panel fs-filter-panel--shop">
                        <div className="fs-filter-label">Learning objective</div>
                        <Select
                          styles={selectStyles}
                          isClearable
                          placeholder="Any goal"
                          options={matchFieldOptions.learningGoals.map((g) => ({ value: g, label: g }))}
                          value={filterMatchLearningGoal ? { value: filterMatchLearningGoal, label: filterMatchLearningGoal } : null}
                          onChange={(o) => setFilterMatchLearningGoal(o?.value ?? '')}
                        />
                        <div className="fs-filter-label fs-filter-label--spaced">Communication style</div>
                        <Select
                          styles={selectStyles}
                          isClearable
                          placeholder="Any style"
                          options={matchFieldOptions.communicationStyles.map((g) => ({ value: g, label: g }))}
                          value={filterMatchCommunicationStyle ? { value: filterMatchCommunicationStyle, label: filterMatchCommunicationStyle } : null}
                          onChange={(o) => setFilterMatchCommunicationStyle(o?.value ?? '')}
                        />
                        <div className="fs-filter-label fs-filter-label--spaced">Commitment level</div>
                        <Select
                          styles={selectStyles}
                          isClearable
                          placeholder="Any level"
                          options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} star${n > 1 ? 's' : ''}` }))}
                          value={filterMatchCommitment === '' ? null : { value: Number(filterMatchCommitment), label: String(filterMatchCommitment) }}
                          onChange={(o) => setFilterMatchCommitment(o == null ? '' : String(o.value))}
                        />
                        <div className="fs-filter-label fs-filter-label--spaced">Commitment match</div>
                        <Select
                          styles={selectStyles}
                          options={COMMITMENT_FLEX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                          value={COMMITMENT_FLEX_OPTIONS.map((o) => ({ value: o.value, label: o.label })).find((o) => o.value === filterCommitmentFlex)}
                          onChange={(o) => setFilterCommitmentFlex(o?.value ?? 0)}
                        />
                        <div className="fs-filter-actions fs-filter-actions--shop fs-filter-actions--single">
                          <button type="button" className="fs-btn-secondary fs-btn-shop fs-btn-shop-block" onClick={clearAll}>
                            Clear all
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        </DiscoverFiltersCardWrapper>
          </div>
          ) : null}

          <div className={`fs-discover-main${embedded ? ' fs-discover-main--embed' : ''}`}>
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
        <div id="fs-discover-results" className={`fs-card fs-results-card fs-results-card--discover${embedded ? ' fs-results-card--embed' : ''}`}>
            {!embedded ? (
            <div className={`fs-results-header${displayedUsers.length === 0 ? ' fs-results-header--empty' : ''}`}>
            {displayedUsers.length > 0 ? (
              <span className="fs-results-count">
                {displayedUsers.length} {displayedUsers.length === 1 ? 'person' : 'people'}
              </span>
            ) : (
              <span className="fs-results-count fs-results-count--placeholder" aria-hidden="true" />
            )}
            <div className="fs-sort-group">
              <div className="fs-sort-toggle" role="group" aria-label="Sort discovery results">
                <button
                  type="button"
                  className={`fs-btn-sort${sortDiscover === 'best_match' ? ' fs-btn-sort-active' : ''}`}
                  onClick={() => applySortDiscover('best_match')}
                  title="Sort by match score or A–Z (no reload). Match profile filters refetch in the background; other filters update the list instantly."
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
          </div>
            ) : null}
          {!embedded && displayedUsers.length > 0 ? (
            <p className="fs-results-sort-hint">
              {sortDiscover === 'best_match' ? (
                <>
                  Sorted by match score: <strong>goal, style, commitment</strong>, <strong>shared interests</strong>, and when both of you set them, <strong>MBTI</strong> and <strong>zodiac</strong>.
                </>
              ) : (
                <>Sorted alphabetically by first name.</>
              )}
            </p>
          ) : null}

          {displayedUsers.length === 0 ? (
            <div className={`fs-empty-block fs-empty-block--minimal${embedded ? ' fs-empty-block--embed-discover' : ''}`}>
              <p className="fs-empty">{embedded ? 'No more partners to show right now!' : 'No matches yet'}</p>
              {!embedded && normalizeSelectedAvailabilitySlots(
                selectedAvailability,
                currentUser?.default_time_zone || getUserData()?.default_time_zone || 'UTC'
              ).length > 0 ? (
                <>
                  <p className="fs-empty-hint">No one overlaps those hours. Try different times or clear the schedule filter.</p>
                  <button
                    type="button"
                    className="fs-btn-secondary fs-empty-clear-schedule"
                    onClick={() => setSelectedAvailability(null)}
                  >
                    Clear schedule filter
                  </button>
                </>
              ) : null}
              {!embedded && normalizeSelectedAvailabilitySlots(
                selectedAvailability,
                currentUser?.default_time_zone || getUserData()?.default_time_zone || 'UTC'
              ).length === 0 ? (
                <p className="fs-empty-hint">Adjust filters or search to see people here.</p>
              ) : null}
            </div>
          ) : embedded ? (
            renderEmbeddedSwipeDeck()
          ) : (
            <div className="fs-results-list fs-results-cards">
              {displayedUsers.map((user, i) => {
                const nativeL = getField(user, ['nativeLanguage', 'native_language']);
                const targetL = getField(user, ['targetLanguage', 'target_language']);
                const prof = getField(user, ['targetLanguageProficiency', 'target_language_proficiency']);
                const emailLine = typeof user.email === 'string' && user.email.trim()
                  ? user.email.trim()
                  : '';
                const subLine = emailLine
                  || [user.profession, user.age != null && user.age !== '' ? String(user.age) : null]
                    .filter(Boolean)
                    .join(' · ')
                  || null;

                const commitmentRaw = user.commitment_level;
                const commitmentNum = commitmentRaw === '' || commitmentRaw == null
                  ? null
                  : Number(commitmentRaw);
                const hasCommitment = commitmentNum != null && !Number.isNaN(commitmentNum);

                const showLearningStyle = Boolean(
                  user.learning_goal
                  || user.communication_style
                  || hasCommitment
                );
                const matchPct = user.matchScore != null && !Number.isNaN(Number(user.matchScore))
                  ? Math.round(Number(user.matchScore))
                  : null;
                const showMatchHighlight = sortDiscover === 'best_match' && matchPct != null;

                const langLine = [
                  nativeL ? `Native ${nativeL}` : null,
                  targetL ? `Target ${targetL}` : null,
                  prof || null,
                ].filter(Boolean).join(' · ');

                const aboutLine = [
                  user.age != null && user.age !== '' ? String(user.age) : null,
                  user.gender || null,
                  user.profession || null,
                  user.mbti || null,
                  user.zodiac || null,
                ].filter(Boolean).join(' · ');

                const learnLine = [
                  user.learning_goal || null,
                  user.communication_style || null,
                ].filter(Boolean).join(' · ');

                const profileMerged = [langLine, aboutLine].filter(Boolean).join(' · ');
                const hasLearningBlock = Boolean(
                  showLearningStyle && (learnLine || hasCommitment)
                );
                const badgeCount = user.badgeCount != null ? Number(user.badgeCount) : 0;
                const badgeIcons = typeof user.badgeIcons === 'string' && user.badgeIcons.trim()
                  ? user.badgeIcons.trim().split(/\s+/).filter(Boolean)
                  : [];
                const showBadges = badgeCount > 0 || badgeIcons.length > 0;
                const userInterestNames = (Array.isArray(user.Interests) ? user.Interests : [])
                  .map((it) => (it?.interest_name ?? it?.name ?? it)?.toString())
                  .filter(Boolean);
                const viewerInterestLc = new Set(selectedInterests.map((s) => String(s).toLowerCase()));
                const sharedInterestCount = userInterestNames.filter((n) =>
                  viewerInterestLc.has(String(n).toLowerCase())
                ).length;

                const listBioText = partnerBioText(user);
                const hasBodyContent = Boolean(
                  profileMerged
                  || hasLearningBlock
                  || showBadges
                  || user.target_language_proficiency
                  || userInterestNames.length > 0
                  || listBioText
                  || sharedInterestCount > 0
                );

                return (
                  <div key={i} className="fs-profile-card fs-discover-card--minimal">
                    <div className="fs-discover-hero">
                      <div className="fs-discover-avatar-wrap">
                        <Avatar src={user.profileImage} name={user.firstName} size={64} />
                      </div>
                      <div className="fs-discover-hero-body">
                        <h2 className="fs-discover-name">{user.firstName} {user.lastName}</h2>
                        {subLine ? <p className="fs-discover-meta">{subLine}</p> : null}
                        {showMatchHighlight ? (
                          <p
                            className="fs-discover-match-note"
                            title="Language-exchange match: rewards a perfect tandem (you speak what they learn and vice versa), plus goals, style, commitment, shared interests, and MBTI/zodiac when both sides have them. Schedule filters do not change this score."
                          >
                            <span className="fs-discover-match-label">Match</span>{' '}
                            <span lang="ko" className="fs-discover-match-ko">매칭</span> {matchPct}%
                          </p>
                        ) : null}
                      </div>
                      <div className="fs-discover-hero-cta">
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
                            <button
                              type="button"
                              className="fs-btn-follow"
                              onClick={(e) => { e.stopPropagation(); handleSendRequest(user); }}
                            >
                              Follow
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {hasBodyContent ? (
                      <div className="fs-discover-body">
                        {user.target_language_proficiency ? (
                          <div className="lm-discover-section">
                            <div className="lm-discover-label">Level</div>
                            <div className="lm-discover-value">{user.target_language_proficiency}</div>
                          </div>
                        ) : null}
                        {userInterestNames.length > 0 ? (
                          <div className="lm-discover-section">
                            <div className="lm-discover-label">Interests</div>
                            <div className="lm-interest-pills">
                              {userInterestNames.slice(0, 10).map((name, j) => (
                                <span
                                  key={j}
                                  className={`lm-interest-pill${
                                    viewerInterestLc.has(String(name).toLowerCase())
                                      ? ' lm-interest-pill--hot'
                                      : ''
                                  }`}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {listBioText ? (
                          <div className="lm-discover-section">
                            <div className="lm-discover-label">Bio</div>
                            <div className="lm-discover-value lm-discover-bio">{listBioText}</div>
                          </div>
                        ) : null}
                        {sharedInterestCount > 0 ? (
                          <div className="lm-shared-banner lm-shared-banner--target" role="status">
                            🎯 You have {sharedInterestCount} shared interest
                            {sharedInterestCount !== 1 ? 's' : ''}!
                          </div>
                        ) : null}
                        {profileMerged &&
                        !user.target_language_proficiency &&
                        userInterestNames.length === 0 &&
                        !listBioText ? (
                          <p className="fs-discover-line">{profileMerged}</p>
                        ) : null}
                        {hasLearningBlock ? (
                          <>
                            {learnLine ? <p className="fs-discover-line">{learnLine}</p> : null}
                            {hasCommitment ? (
                              <p className="fs-discover-commit">
                                <span className="fs-discover-stars" aria-label={`Commitment ${commitmentNum} of 5`}>
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <span
                                      key={n}
                                      className={n <= commitmentNum ? 'fs-disc-star fs-disc-star-on' : 'fs-disc-star'}
                                    >
                                      &#9733;
                                    </span>
                                  ))}
                                </span>
                                <span className="fs-discover-commit-hint">{commitmentHintText(commitmentNum)}</span>
                              </p>
                            ) : null}
                          </>
                        ) : null}
                        {showBadges ? (
                          <p className="fs-discover-badges-line">
                            {badgeIcons.map((icon, j) => (
                              <span key={j} className="fs-badge-emoji" title="Badge">{icon}</span>
                            ))}
                            {badgeCount > 0 ? (
                              <span className="fs-discover-badge-suffix">
                                {badgeIcons.length ? ' · ' : ''}{badgeCount} earned
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        </div>
      </div>

      {successMessage && <div className="fs-toast">{successMessage}</div>}
    </div>
  );
};

export default FriendSearch;
