import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getFriendsList, type FriendRow } from '@/api/friendsApi';
import { getUserAvailability, replaceUserAvailability } from '@/api/availabilityApi';
import { createMeetingApi, deleteMeetingApi, getMeetingsForUserApi, type MeetingRow } from '@/api/meetingsApi';
import {
  GRID_DAYS,
  GRID_HOURS,
  apiSlotsToGridKeys,
  gridKeysToApiSlots,
  gridTimeToApi,
  gridTimeEndApi,
  nextDateIsoForWeekday,
} from '@/lib/scheduleAvailability';

interface Meeting {
  id: string;
  partnerId: string;
  partnerName: string;
  dayOfWeek: string;
  date: string;
  time: string;
  duration: string;
  topic: string;
  user1Id: number;
  user2Id: number;
  startTimeApi: string;
}

const daysOfWeekKo = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatMeetingDate(isoDate: string, lang: 'en' | 'ko') {
  const d = new Date(`${isoDate}T12:00:00`);
  if (lang === 'ko') {
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

function mondayOf(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sunday..6 Saturday
  const mondayDiff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayDiff);
  return d;
}

function normalizeMeetingDayName(raw: string) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const lowered = value.toLowerCase();
  const exact = GRID_DAYS.find((d) => d.toLowerCase() === lowered);
  if (exact) return exact;
  const short = GRID_DAYS.find((d) => d.toLowerCase().slice(0, 3) === lowered.slice(0, 3));
  if (short) return short;
  return value;
}

function normalizeMeetingTimeLabel(raw: string) {
  const m = String(raw || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(raw || '').slice(0, 5);
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

export function Schedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useAuth();
  const { t, language } = useLanguage();
  const [view, setView] = useState<'availability' | 'meetings'>('availability');
  const [myKeys, setMyKeys] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loadAvail, setLoadAvail] = useState(false);
  const [isPaintingAvailability, setIsPaintingAvailability] = useState(false);
  const [paintAvailabilityTo, setPaintAvailabilityTo] = useState<boolean>(false);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalPartnerId, setModalPartnerId] = useState('');
  const [modalPartnerKeys, setModalPartnerKeys] = useState<Set<string>>(new Set());
  const [loadModalPartner, setLoadModalPartner] = useState(false);
  const [modalSelectedDay, setModalSelectedDay] = useState<string | null>(null);
  const [modalSelectedTime, setModalSelectedTime] = useState<string | null>(null);
  const [modalTopic, setModalTopic] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [isDraggingModalSlot, setIsDraggingModalSlot] = useState(false);
  const [highlightMeetingId, setHighlightMeetingId] = useState<string | null>(null);
  const [highlightSlotKey, setHighlightSlotKey] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const clickScheduleTimeoutRef = useRef<number | null>(null);
  const meetingCardClickTimeoutRef = useRef<number | null>(null);

  const loadMine = useCallback(async () => {
    if (!userId) return;
    setLoadAvail(true);
    try {
      const slots = await getUserAvailability(userId);
      setMyKeys(apiSlotsToGridKeys(slots));
    } catch {
      toast.error(t('Could not load your availability', '내 일정을 불러오지 못했습니다'));
    } finally {
      setLoadAvail(false);
    }
  }, [userId, t]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getFriendsList(userId);
      setFriends(list);
    } catch {
      setFriends([]);
    }
  }, [userId]);

  useEffect(() => {
    loadMine();
    loadFriends();
  }, [loadMine, loadFriends]);

  const mapMeetingRowsToCards = useCallback(
    (rows: MeetingRow[]) => {
      if (!userId) return [] as Meeting[];
      return rows.map((row) => {
        const normalizedDay = normalizeMeetingDayName(String(row.day_of_week || ''));
        const normalizedTime = normalizeMeetingTimeLabel(String(row.start_time || ''));
        const partnerId =
          Number(row.user1_id) === Number(userId) ? String(row.user2_id) : String(row.user1_id);
        const friend = friends.find((f) => String(f.id) === partnerId);
        const partnerName =
          [friend?.firstName, friend?.lastName].filter(Boolean).join(' ') ||
          friend?.email ||
          `User ${partnerId}`;
        return {
          id: String(row.id),
          partnerId,
          partnerName,
          dayOfWeek: normalizedDay,
          date: nextDateIsoForWeekday(normalizedDay),
          time: normalizedTime,
          duration: '60 min',
          topic: String(row.topic || t('Language exchange', '언어 교환')),
          user1Id: Number(row.user1_id),
          user2Id: Number(row.user2_id),
          startTimeApi: String(row.start_time || ''),
        };
      });
    },
    [friends, t, userId]
  );

  const loadMeetings = useCallback(async () => {
    if (!userId) {
      setMeetings([]);
      return;
    }
    try {
      const rows = await getMeetingsForUserApi(userId);
      setMeetings(mapMeetingRowsToCards(rows));
    } catch {
      setMeetings([]);
    }
  }, [mapMeetingRowsToCards, userId]);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    if (!userId) return;
    const intervalId = window.setInterval(() => {
      void loadMeetings();
    }, 10000);
    const onFocus = () => {
      void loadMeetings();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadMeetings, userId]);

  useEffect(() => {
    let cancelled = false;
    if (!showScheduleModal || !modalPartnerId) {
      if (!showScheduleModal) setModalPartnerKeys(new Set());
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      setLoadModalPartner(true);
      try {
        const slots = await getUserAvailability(modalPartnerId);
        if (!cancelled) setModalPartnerKeys(apiSlotsToGridKeys(slots));
      } catch {
        if (!cancelled) setModalPartnerKeys(new Set());
      } finally {
        if (!cancelled) setLoadModalPartner(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showScheduleModal, modalPartnerId]);

  const openScheduleModal = () => {
    const defaultPartner = friends.length ? String(friends[0].id) : '';
    setModalPartnerId(defaultPartner);
    setModalSelectedDay(null);
    setModalSelectedTime(null);
    setModalTopic(t('Language exchange', '언어 교환'));
    setShowScheduleModal(true);
  };

  const openScheduleModalForSlot = (day: string, time: string) => {
    const defaultPartner = modalPartnerId || (friends.length ? String(friends[0].id) : '');
    setModalPartnerId(defaultPartner);
    setModalSelectedDay(day);
    setModalSelectedTime(time);
    setModalTopic(t('Language exchange', '언어 교환'));
    setShowScheduleModal(true);
  };

  const modalPartnerLabel = useMemo(() => {
    const f = friends.find((x) => String(x.id) === modalPartnerId);
    if (!f) return '';
    return [f.firstName, f.lastName].filter(Boolean).join(' ') || f.email || '';
  }, [friends, modalPartnerId]);

  useEffect(() => {
    const requestedPartnerId = searchParams.get('partnerId');
    const shouldOpen = searchParams.get('open') === '1';
    if (!requestedPartnerId || !shouldOpen) return;
    if (!friends.length) return;
    const exists = friends.some((f) => String(f.id) === String(requestedPartnerId));
    setModalPartnerId(exists ? String(requestedPartnerId) : String(friends[0].id));
    setModalSelectedDay(null);
    setModalSelectedTime(null);
    setModalTopic(t('Language exchange', '언어 교환'));
    setShowScheduleModal(true);
    setSearchParams({}, { replace: true });
  }, [friends, searchParams, setSearchParams, t]);

  const weekStartDate = useMemo(() => {
    const baseMonday = mondayOf(new Date());
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(
    () =>
      GRID_DAYS.map((dayName, index) => {
        const d = new Date(weekStartDate);
        d.setDate(weekStartDate.getDate() + index);
        return {
          dayName,
          dateIso: d.toISOString().slice(0, 10),
          monthDay: language === 'ko'
            ? `${d.getMonth() + 1}/${d.getDate()}`
            : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        };
      }),
    [language, weekStartDate]
  );

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0]?.dateIso;
    const end = weekDays[6]?.dateIso;
    if (!start || !end) return '';
    const s = new Date(`${start}T12:00:00`);
    const e = new Date(`${end}T12:00:00`);
    if (language === 'ko') {
      return `${s.getFullYear()}년 ${s.getMonth() + 1}월 ${s.getDate()}일 - ${e.getMonth() + 1}월 ${e.getDate()}일`;
    }
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${e.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  }, [language, weekDays]);

  const monthPickerValue = useMemo(() => {
    const y = weekStartDate.getFullYear();
    const m = String(weekStartDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [weekStartDate]);

  const modalCellClass = (day: string, time: string) => {
    const key = `${day}-${time}`;
    const mine = myKeys.has(key);
    const theirs = modalPartnerKeys.has(key);
    const selected = modalSelectedDay === day && modalSelectedTime === time;
    let cls = '';
    if (mine && theirs) cls = 'bg-fuchsia-600 hover:bg-fuchsia-700';
    else if (mine) cls = 'bg-blue-600 hover:bg-blue-700';
    else if (theirs) cls = 'bg-amber-400 hover:bg-amber-500';
    else cls = 'bg-neutral-100 hover:bg-neutral-200';
    if (selected) return 'bg-red-600 hover:bg-red-700 ring-2 ring-red-300 ring-offset-1 ring-inset';
    return cls;
  };

  const pickModalSlot = (day: string, time: string, showRecommendationToast = true) => {
    const key = `${day}-${time}`;
    const bothFree = myKeys.has(key) && modalPartnerKeys.has(key);
    if (showRecommendationToast && !bothFree) {
      toast.message(
        t(
          'Scheduled anyway — highlighted both-free slots are recommended.',
          '선택한 시간으로 예약합니다. 강조된 색상은 둘 다 가능한 추천 시간입니다.'
        )
      );
    }
    setModalSelectedDay(day);
    setModalSelectedTime(time);
  };

  const submitScheduleMeeting = async () => {
    if (!userId || !modalPartnerId) {
      toast.error(t('Select a partner', '파트너를 선택하세요'));
      return;
    }
    if (!modalSelectedDay || !modalSelectedTime) {
      toast.error(t('Pick a time on the grid', '표에서 시간을 선택하세요'));
      return;
    }
    const u1 = parseInt(String(userId), 10);
    const u2 = parseInt(modalPartnerId, 10);
    if (!u1 || !u2) {
      toast.error(t('Invalid user or partner id', '사용자 정보가 올바르지 않습니다'));
      return;
    }
    setScheduling(true);
    try {
      const selectedDateIso =
        weekDays.find((d) => d.dayName === modalSelectedDay)?.dateIso ||
        nextDateIsoForWeekday(modalSelectedDay);
      const meetingTopic =
        modalTopic.trim() ||
        t('Language exchange', '언어 교환');

      const data = await createMeetingApi({
        user1_id: u1,
        user2_id: u2,
        day_of_week: modalSelectedDay,
        start_time: gridTimeToApi(modalSelectedTime),
        end_time: gridTimeEndApi(modalSelectedTime),
        topic: meetingTopic,
      });
      const dateIso = selectedDateIso;
      setMeetings((prev) => {
        if (data?.id == null) return prev;
        return [
          ...prev,
          {
            id: String(data.id),
            partnerId: modalPartnerId,
            partnerName: modalPartnerLabel || `User ${modalPartnerId}`,
            dayOfWeek: modalSelectedDay,
            date: dateIso,
            time: modalSelectedTime,
            duration: '60 min',
            topic: meetingTopic,
            user1Id: u1,
            user2Id: u2,
            startTimeApi: gridTimeToApi(modalSelectedTime),
          },
        ];
      });
      toast.success(t('Meeting scheduled', '미팅이 예약되었습니다'));
      setHighlightSlotKey(`${modalSelectedDay}-${modalSelectedTime}`);
      void loadMeetings();
      setShowScheduleModal(false);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg =
        ax?.response?.data?.message ||
        t('Could not schedule meeting', '미팅 예약에 실패했습니다');
      toast.error(msg);
    } finally {
      setScheduling(false);
    }
  };

  const beginAvailabilityPaint = (day: string, time: string) => {
    const key = `${day}-${time}`;
    const shouldEnable = !myKeys.has(key);
    setPaintAvailabilityTo(shouldEnable);
    setIsPaintingAvailability(true);
    setMyKeys((prev) => {
      const next = new Set(prev);
      if (shouldEnable) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const paintAvailabilityCell = (day: string, time: string) => {
    if (!isPaintingAvailability) return;
    const key = `${day}-${time}`;
    setMyKeys((prev) => {
      const next = new Set(prev);
      if (paintAvailabilityTo) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  useEffect(() => {
    if (!isPaintingAvailability) return;
    const endPaint = () => setIsPaintingAvailability(false);
    window.addEventListener('mouseup', endPaint);
    return () => window.removeEventListener('mouseup', endPaint);
  }, [isPaintingAvailability]);

  useEffect(() => {
    return () => {
      if (clickScheduleTimeoutRef.current) {
        window.clearTimeout(clickScheduleTimeoutRef.current);
      }
      if (meetingCardClickTimeoutRef.current) {
        window.clearTimeout(meetingCardClickTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteMeeting = useCallback(
    async (meeting: Meeting) => {
      try {
        await deleteMeetingApi({
          user1_id: meeting.user1Id,
          user2_id: meeting.user2Id,
          day_of_week: meeting.dayOfWeek,
          start_time: meeting.startTimeApi,
        });
        setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
        toast.success(t('Meeting deleted', '미팅이 삭제되었습니다'));
        void loadMeetings();
      } catch {
        toast.error(t('Could not delete meeting', '미팅 삭제에 실패했습니다'));
      }
    },
    [loadMeetings, t]
  );

  useEffect(() => {
    if (!isDraggingModalSlot) return;
    const endDrag = () => setIsDraggingModalSlot(false);
    window.addEventListener('mouseup', endDrag);
    return () => window.removeEventListener('mouseup', endDrag);
  }, [isDraggingModalSlot]);

  useEffect(() => {
    if (!userId || loadAvail) return;
    const timer = window.setTimeout(async () => {
      try {
        const slots = gridKeysToApiSlots(myKeys);
        await replaceUserAvailability(userId, slots);
      } catch {
        // Background autosave keeps the grid snappy; errors can be retried on next change.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [loadAvail, myKeys, userId]);

  const meetingKeys = useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((meeting) => {
      if (meeting.dayOfWeek && meeting.time) {
        set.add(`${meeting.dayOfWeek}-${meeting.time}`);
      }
    });
    return set;
  }, [meetings]);

  const meetingBySlot = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach((meeting) => {
      const key = `${meeting.dayOfWeek}-${meeting.time}`;
      const prev = map.get(key) || [];
      prev.push(meeting);
      map.set(key, prev);
    });
    return map;
  }, [meetings]);

  const meetingHoverLabel = (day: string, time: string) => {
    const entries = meetingBySlot.get(`${day}-${time}`) || [];
    if (!entries.length) return `${day} ${time}`;
    const names = [...new Set(entries.map((m) => m.partnerName).filter(Boolean))];
    return `${day} ${time} • ${names
      .map((name) => t('Scheduled with', '예약 상대') + ` ${name}`)
      .join(', ')}`;
  };

  const openMeetingFromSlot = (day: string, time: string) => {
    const entries = meetingBySlot.get(`${day}-${time}`) || [];
    const target = entries[0];
    if (!target) return;
    setView('meetings');
    setHighlightMeetingId(target.id);
  };

  const jumpBackToAvailabilityFromMeeting = (meeting: Meeting) => {
    const slotKey = `${meeting.dayOfWeek}-${meeting.time}`;
    setView('availability');
    setHighlightSlotKey(slotKey);
  };

  useEffect(() => {
    if (view !== 'meetings' || !highlightMeetingId) return;
    const el = document.getElementById(`meeting-card-${highlightMeetingId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = window.setTimeout(() => setHighlightMeetingId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightMeetingId, view]);

  useEffect(() => {
    if (view !== 'availability' || !highlightSlotKey) return;
    const timer = window.setTimeout(() => setHighlightSlotKey(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightSlotKey, view]);

  const cellClass = (day: string, time: string) => {
    const key = `${day}-${time}`;
    const mine = myKeys.has(key);
    const hasMeeting = meetingKeys.has(key);
    const isHighlightedSlot = highlightSlotKey === key;
    if (hasMeeting) return 'bg-red-600 hover:bg-red-700';
    if (mine) return isHighlightedSlot ? 'bg-blue-700 ring-2 ring-blue-300 ring-inset' : 'bg-blue-600 hover:bg-blue-700';
    if (isHighlightedSlot) return 'bg-neutral-200 ring-2 ring-blue-300 ring-inset';
    return 'bg-neutral-100 hover:bg-neutral-200';
  };

  return (
    <div className="size-full overflow-y-auto bg-neutral-50">
      <div className="max-w-5xl mx-auto p-2 sm:p-3">
        <div className="mb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">
            {t('Calls & meetings', '통화 · 미팅')}
          </h2>
          <p className="text-neutral-600">
            {t('Manage availability, meetings, and call links', '가능 시간 · 미팅 · 통화 링크 관리')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setView('availability')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              view === 'availability'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('Availability', '가능 시간')}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setView('meetings')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              view === 'meetings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('Meetings', '미팅')} ({meetings.length})
            </div>
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('Prev week', '이전 주')}
          </button>
          <div className="text-xs sm:text-sm font-medium text-neutral-800 opacity-0 select-none">{weekRangeLabel}</div>
          <div className="flex items-center gap-1">
            <input
              type="month"
              value={monthPickerValue}
              onChange={(e) => {
                const raw = e.target.value;
                const m = raw.match(/^(\d{4})-(\d{2})$/);
                if (!m) return;
                const year = Number(m[1]);
                const month = Number(m[2]) - 1;
                if (!Number.isFinite(year) || !Number.isFinite(month)) return;
                const baseMonday = mondayOf(new Date());
                const targetMonday = mondayOf(new Date(year, month, 1));
                const diffWeeks = Math.round((targetMonday.getTime() - baseMonday.getTime()) / ONE_WEEK_MS);
                setWeekOffset(diffWeeks);
              }}
              className="rounded-md border border-neutral-200 px-2 py-1 text-xs sm:text-sm text-neutral-700"
              aria-label={t('Jump to month', '월 이동')}
            />
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {t('Next week', '다음 주')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {view === 'availability' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-200 p-3"
          >
            <div className="mb-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {t('Set Your Available Times', '가능한 시간 설정')}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={loadAvail || !userId}
                  onClick={openScheduleModal}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('Schedule a meeting', '미팅 예약하기')}
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs sm:text-sm text-neutral-600 text-center">
              {weekRangeLabel}
            </p>

            <div className="overflow-x-auto">
              {loadAvail ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-0 table-fixed">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-neutral-700 border-b border-neutral-200 bg-[#f8f9fa]">
                        {t('Time', '시간')}
                      </th>
                      {weekDays.map((day, index) => (
                        <th
                          key={day.dayName}
                          className="px-1 py-1 text-center text-xs font-medium text-neutral-700 border-b border-neutral-200 bg-[#f8f9fa]"
                        >
                          <div>{language === 'ko' ? daysOfWeekKo[index] : day.dayName.slice(0, 3)}</div>
                          <div className="text-[10px] font-normal text-neutral-500">{day.monthDay}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GRID_HOURS.map((time) => (
                      <tr key={time}>
                        <td className="px-2 py-1 text-xs text-neutral-600 border-b border-neutral-200 whitespace-nowrap bg-white">
                          {time}
                        </td>
                        {weekDays.map((day) => (
                          <td key={`${day.dayName}-${time}`} className="p-0.5 border-b border-neutral-200 bg-white">
                            {(() => {
                              const slotMeetings = meetingBySlot.get(`${day.dayName}-${time}`) || [];
                              const hasMeeting = slotMeetings.length > 0;
                              return (
                            <button
                              type="button"
                              aria-label={meetingHoverLabel(day.dayName, time)}
                              onMouseDown={() => {
                                if (hasMeeting) return;
                                const isBlue = myKeys.has(`${day.dayName}-${time}`);
                                // Blue cells are reserved for scheduling on single click.
                                if (!isBlue) {
                                  beginAvailabilityPaint(day.dayName, time);
                                }
                              }}
                              onMouseEnter={() => paintAvailabilityCell(day.dayName, time)}
                              onMouseUp={() => setIsPaintingAvailability(false)}
                              onDoubleClick={() => {
                                if (clickScheduleTimeoutRef.current) {
                                  window.clearTimeout(clickScheduleTimeoutRef.current);
                                  clickScheduleTimeoutRef.current = null;
                                }
                                if (hasMeeting) {
                                  const target = slotMeetings[0];
                                  if (target) void handleDeleteMeeting(target);
                                  return;
                                }
                                const key = `${day.dayName}-${time}`;
                                if (!myKeys.has(key)) return;
                                setMyKeys((prev) => {
                                  const next = new Set(prev);
                                  next.delete(key);
                                  return next;
                                });
                                toast.message(t('Availability removed', '가능 시간이 삭제되었습니다'));
                              }}
                              onClick={() => {
                                if (hasMeeting) {
                                  if (clickScheduleTimeoutRef.current) {
                                    window.clearTimeout(clickScheduleTimeoutRef.current);
                                  }
                                  clickScheduleTimeoutRef.current = window.setTimeout(() => {
                                    openMeetingFromSlot(day.dayName, time);
                                    clickScheduleTimeoutRef.current = null;
                                  }, 220);
                                  return;
                                }
                                if (myKeys.has(`${day.dayName}-${time}`) && friends.length > 0) {
                                  if (clickScheduleTimeoutRef.current) {
                                    window.clearTimeout(clickScheduleTimeoutRef.current);
                                  }
                                  clickScheduleTimeoutRef.current = window.setTimeout(() => {
                                    openScheduleModalForSlot(day.dayName, time);
                                    clickScheduleTimeoutRef.current = null;
                                  }, 220);
                                }
                              }}
                              className={`group w-full h-5 sm:h-6 rounded transition-colors cursor-pointer relative ${cellClass(day.dayName, time)}`}
                            >
                              {hasMeeting ? (
                                <span className="pointer-events-none absolute left-1/2 top-0 z-20 hidden -translate-x-1/2 -translate-y-full rounded bg-neutral-900 px-2 py-1 text-[10px] text-white shadow-md group-hover:block whitespace-nowrap">
                                  {[...new Set(slotMeetings.map((m) => m.partnerName).filter(Boolean))]
                                    .map((name) => `${t('With', '상대')}: ${name}`)
                                    .join(' | ')}
                                </span>
                              ) : null}
                            </button>
                              );
                            })()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded" />
                <span className="text-neutral-600">{t('Available (click to schedule)', '가능 (클릭해 미팅 예약)')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded" />
                <span className="text-neutral-600">{t('Scheduled meeting', '예약된 미팅')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-neutral-100 rounded border border-neutral-200" />
                <span className="text-neutral-600">{t('Not available', '불가')}</span>
              </div>
            </div>

          </motion.div>
        )}

        {view === 'meetings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
          >
            <button
              type="button"
              onClick={openScheduleModal}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('Schedule New Call/Meeting', '새 통화/미팅 예약')}
            </button>

            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                id={`meeting-card-${meeting.id}`}
                className={`bg-white rounded-2xl border p-4 transition-all ${
                  highlightMeetingId === meeting.id
                    ? 'border-red-400 ring-2 ring-red-200'
                    : 'border-neutral-200 hover:border-blue-300'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (meetingCardClickTimeoutRef.current) {
                    window.clearTimeout(meetingCardClickTimeoutRef.current);
                  }
                  meetingCardClickTimeoutRef.current = window.setTimeout(() => {
                    jumpBackToAvailabilityFromMeeting(meeting);
                    meetingCardClickTimeoutRef.current = null;
                  }, 220);
                }}
                onDoubleClick={() => {
                  if (meetingCardClickTimeoutRef.current) {
                    window.clearTimeout(meetingCardClickTimeoutRef.current);
                    meetingCardClickTimeoutRef.current = null;
                  }
                  void handleDeleteMeeting(meeting);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    jumpBackToAvailabilityFromMeeting(meeting);
                  } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    void handleDeleteMeeting(meeting);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">{meeting.partnerName}</h3>
                    <p className="text-sm text-neutral-600">{meeting.topic}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Users className="w-4 h-4" />
                    <span>{t('1-on-1', '1:1')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatMeetingDate(meeting.date, language)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {meeting.time} ({meeting.duration})
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/call/${meeting.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    {t('Join in-app call', '앱 내 통화 참여')}
                  </Link>
                </div>
              </div>
            ))}

            {meetings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">
                  {t('No scheduled meetings yet', '예정된 미팅이 없습니다')}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {showScheduleModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-3 sm:p-4 max-w-5xl w-full max-h-[90vh] overflow-y-auto my-auto shadow-xl"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                if (
                  scheduling ||
                  !userId ||
                  !modalPartnerId ||
                  !modalSelectedDay ||
                  !modalSelectedTime ||
                  !friends.length
                ) {
                  return;
                }
                e.preventDefault();
                void submitScheduleMeeting();
              }}
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-1">
                {t('Schedule Call/Meeting', '통화/미팅 예약')}
              </h3>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('Partner', '파트너')}
                  </label>
                  <select
                    value={modalPartnerId}
                    onChange={(e) => {
                      setModalPartnerId(e.target.value);
                      setModalSelectedDay(null);
                      setModalSelectedTime(null);
                    }}
                    className="w-full max-w-md px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('— Select friend —', '— 친구 선택 —')}</option>
                    {friends.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {[f.firstName, f.lastName].filter(Boolean).join(' ') || f.email || `User ${f.id}`}
                      </option>
                    ))}
                  </select>
                  {!friends.length ? (
                    <p className="text-xs text-amber-700 mt-1">
                      {t('Add friends first to schedule a meeting.', '미팅을 잡으려면 먼저 친구를 추가하세요.')}
                    </p>
                  ) : null}
                  {modalPartnerId && !loadModalPartner && !modalPartnerKeys.size ? (
                    <p className="text-xs text-amber-700 mt-1">
                      {t(
                        'No availability from this friend yet — ask them to save times on Schedule.',
                        '상대의 가능 시간이 없습니다. 상대에게 일정 탭에서 저장을 요청하세요.'
                      )}
                    </p>
                  ) : null}
                </div>

                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  {loadAvail || loadModalPartner ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <table className="w-full border-collapse min-w-[600px]">
                      <thead>
                        <tr>
                          <th className="px-2 py-0.5 text-left text-xs font-medium text-neutral-700 border-b bg-neutral-50">
                            {t('Time', '시간')}
                          </th>
                          {weekDays.map((day, index) => (
                            <th
                              key={day.dayName}
                              className="px-1 py-0.5 text-center text-xs font-medium text-neutral-700 border-b bg-neutral-50"
                            >
                              <div>{language === 'ko' ? daysOfWeekKo[index] : day.dayName.slice(0, 3)}</div>
                              <div className="text-[10px] font-normal text-neutral-500">{day.monthDay}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {GRID_HOURS.map((time) => (
                          <tr key={time}>
                            <td className="px-2 py-0.5 text-xs text-neutral-600 border-b whitespace-nowrap">
                              {time}
                            </td>
                            {weekDays.map((day) => (
                              <td key={`m-${day.dayName}-${time}`} className="p-0.5 border-b">
                                <button
                                  type="button"
                                  title={`${day.dayName} ${day.dateIso} ${time}`}
                                  onMouseDown={() => {
                                    setIsDraggingModalSlot(true);
                                    pickModalSlot(day.dayName, time, true);
                                  }}
                                  onMouseEnter={() => {
                                    if (isDraggingModalSlot) pickModalSlot(day.dayName, time, false);
                                  }}
                                  onMouseUp={() => setIsDraggingModalSlot(false)}
                                  className={`w-full h-5 sm:h-6 rounded transition-colors cursor-pointer ${modalCellClass(day.dayName, time)}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-blue-600 rounded shrink-0" />
                    <span className="text-neutral-600">{t('You', '나')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-amber-400 rounded shrink-0" />
                    <span className="text-neutral-600">{t('Partner', '파트너')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-fuchsia-600 rounded shrink-0" />
                    <span className="text-neutral-600">
                      {t('Both free is recommended, but any slot can be selected', '둘 다 가능 시간 추천, 다른 시간도 선택 가능')}
                    </span>
                  </div>
                </div>

                {modalSelectedDay && modalSelectedTime ? (
                  <p className="text-sm text-neutral-700">
                    {t('Selected:', '선택:')}{' '}
                    <span className="font-medium">
                      {language === 'ko'
                        ? daysOfWeekKo[GRID_DAYS.indexOf(modalSelectedDay as (typeof GRID_DAYS)[number])] ||
                          modalSelectedDay
                        : modalSelectedDay}{' '}
                      {weekDays.find((d) => d.dayName === modalSelectedDay)?.dateIso || ''} {modalSelectedTime}
                    </span>
                  </p>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('Topic (optional)', '주제 (선택)')}
                  </label>
                  <input
                    type="text"
                    value={modalTopic}
                    onChange={(e) => setModalTopic(e.target.value)}
                    placeholder={t('e.g., Conversation practice', '예: 회화 연습')}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={scheduling}
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-neutral-200 text-neutral-900 py-3 rounded-lg font-medium hover:bg-neutral-300 disabled:opacity-50"
                >
                  {t('Cancel', '취소')}
                </button>
                <button
                  type="button"
                  disabled={
                    scheduling ||
                    !userId ||
                    !modalPartnerId ||
                    !modalSelectedDay ||
                    !modalSelectedTime ||
                    !friends.length
                  }
                  onClick={submitScheduleMeeting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('Schedule', '예약')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
