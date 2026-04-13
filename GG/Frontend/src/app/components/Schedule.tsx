import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Loader2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getFriendsList, type FriendRow } from '@/api/friendsApi';
import { getUserAvailability, replaceUserAvailability } from '@/api/availabilityApi';
import { createMeetingApi } from '@/api/meetingsApi';
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
  date: string;
  time: string;
  duration: string;
  topic: string;
}

const daysOfWeekKo = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

function formatMeetingDate(isoDate: string, lang: 'en' | 'ko') {
  const d = new Date(`${isoDate}T12:00:00`);
  if (lang === 'ko') {
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

export function Schedule() {
  const { userId } = useAuth();
  const { t, language } = useLanguage();
  const [view, setView] = useState<'availability' | 'meetings'>('availability');
  const [myKeys, setMyKeys] = useState<Set<string>>(new Set());
  const [partnerKeys, setPartnerKeys] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [overlayPartnerId, setOverlayPartnerId] = useState<string>('');
  const [loadAvail, setLoadAvail] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      partnerId: 'user-2',
      partnerName: '지우 (Jiwoo)',
      date: '2026-04-10',
      time: '14:00',
      duration: '60 min',
      topic: 'Conversation practice',
    },
  ]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalPartnerId, setModalPartnerId] = useState('');
  const [modalPartnerKeys, setModalPartnerKeys] = useState<Set<string>>(new Set());
  const [loadModalPartner, setLoadModalPartner] = useState(false);
  const [modalSelectedDay, setModalSelectedDay] = useState<string | null>(null);
  const [modalSelectedTime, setModalSelectedTime] = useState<string | null>(null);
  const [modalTopic, setModalTopic] = useState('');
  const [scheduling, setScheduling] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!overlayPartnerId) {
        setPartnerKeys(new Set());
        return;
      }
      const slots = await getUserAvailability(overlayPartnerId);
      if (!cancelled) setPartnerKeys(apiSlotsToGridKeys(slots));
    })();
    return () => {
      cancelled = true;
    };
  }, [overlayPartnerId]);

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
    const defaultPartner =
      overlayPartnerId || (friends.length ? String(friends[0].id) : '');
    setModalPartnerId(defaultPartner);
    setModalSelectedDay(null);
    setModalSelectedTime(null);
    setModalTopic('');
    setShowScheduleModal(true);
  };

  const modalPartnerLabel = useMemo(() => {
    const f = friends.find((x) => String(x.id) === modalPartnerId);
    if (!f) return '';
    return [f.firstName, f.lastName].filter(Boolean).join(' ') || f.email || '';
  }, [friends, modalPartnerId]);

  const modalCellClass = (day: string, time: string) => {
    const key = `${day}-${time}`;
    const mine = myKeys.has(key);
    const theirs = modalPartnerKeys.has(key);
    const selected = modalSelectedDay === day && modalSelectedTime === time;
    let cls = '';
    if (mine && theirs) cls = 'bg-teal-600 hover:bg-teal-700';
    else if (mine) cls = 'bg-emerald-500';
    else if (theirs) cls = 'bg-amber-400';
    else cls = 'bg-neutral-100 hover:bg-neutral-200';
    if (selected) cls += ' ring-2 ring-blue-600 ring-offset-2 ring-inset';
    return cls;
  };

  const pickModalSlot = (day: string, time: string) => {
    const key = `${day}-${time}`;
    if (!myKeys.has(key) || !modalPartnerKeys.has(key)) {
      toast.error(
        t(
          'Choose a teal slot where you are both available.',
          '둘 다 가능한 청록 칸만 선택할 수 있습니다.'
        )
      );
      return;
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
      const data = await createMeetingApi({
        user1_id: u1,
        user2_id: u2,
        day_of_week: modalSelectedDay,
        start_time: gridTimeToApi(modalSelectedTime),
        end_time: gridTimeEndApi(modalSelectedTime),
      });
      const dateIso = nextDateIsoForWeekday(modalSelectedDay);
      const topic =
        modalTopic.trim() ||
        t('Language exchange', '언어 교환');
      setMeetings((prev) => [
        ...prev,
        {
          id: data?.id != null ? String(data.id) : `m-${Date.now()}`,
          partnerId: modalPartnerId,
          partnerName: modalPartnerLabel || `User ${modalPartnerId}`,
          date: dateIso,
          time: modalSelectedTime,
          duration: '60 min',
          topic,
        },
      ]);
      toast.success(t('Meeting scheduled', '미팅이 예약되었습니다'));
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

  const toggleMySlot = (day: string, time: string) => {
    const key = `${day}-${time}`;
    setMyKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveAvailability = async () => {
    if (!userId) return;
    setSavingAvail(true);
    try {
      const slots = gridKeysToApiSlots(myKeys);
      await replaceUserAvailability(userId, slots);
      toast.success(t('Availability saved', '가능 시간이 저장되었습니다'));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const serverMsg = ax.response?.data?.message;
      toast.error(
        serverMsg ||
          t(
            'Save failed. Is the backend running? Complete your profile if you have not.',
            '저장 실패. 백엔드가 켜져 있는지 확인하고, 프로필을 먼저 저장하세요.'
          )
      );
    } finally {
      setSavingAvail(false);
    }
  };

  const cellClass = (day: string, time: string) => {
    const key = `${day}-${time}`;
    const mine = myKeys.has(key);
    const theirs = partnerKeys.has(key);
    if (mine && theirs) return 'bg-teal-600 hover:bg-teal-700 ring-2 ring-teal-800 ring-inset';
    if (mine) return 'bg-emerald-500 hover:bg-emerald-600';
    if (theirs) return 'bg-amber-400 hover:bg-amber-500';
    return 'bg-neutral-100 hover:bg-neutral-200';
  };

  const partnerLabel = useMemo(() => {
    const f = friends.find((x) => String(x.id) === overlayPartnerId);
    if (!f) return '';
    return [f.firstName, f.lastName].filter(Boolean).join(' ') || f.email || '';
  }, [friends, overlayPartnerId]);

  return (
    <div className="size-full overflow-y-auto bg-neutral-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">
            {t('Schedule', '일정')}
          </h2>
          <p className="text-neutral-600">
            {t('Manage your availability and meetings', '가능한 시간과 미팅 관리')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => setView('availability')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              view === 'availability'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('My Availability', '내 가능 시간')}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setView('meetings')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              view === 'meetings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('Scheduled Meetings', '예정된 미팅')} ({meetings.length})
            </div>
          </button>
        </div>

        {view === 'availability' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-neutral-200 p-6"
          >
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">
                  {t('Set Your Available Times', '가능한 시간 설정')}
                </h3>
                <p className="text-sm text-neutral-600">
                  {t(
                    'Green = you. Amber = partner (read-only overlay). Teal = both free — great meeting times.',
                    '초록 = 나. 호박색 = 파트너(참고). 청록 = 둘 다 가능 — 미팅 추천 시간.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={savingAvail || loadAvail || !userId}
                  onClick={saveAvailability}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('Save my availability', '내 시간 저장')}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('Show partner availability', '파트너 일정 겹쳐 보기')}
              </label>
              <select
                value={overlayPartnerId}
                onChange={(e) => setOverlayPartnerId(e.target.value)}
                className="w-full max-w-md px-3 py-2 rounded-lg border border-neutral-300 text-sm"
              >
                <option value="">
                  {t('— None —', '— 없음 —')}
                </option>
                {friends.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {[f.firstName, f.lastName].filter(Boolean).join(' ') || f.email || `User ${f.id}`}
                  </option>
                ))}
              </select>
              {overlayPartnerId && !partnerLabel ? (
                <p className="text-xs text-amber-700 mt-1">
                  {t('No slots returned — they may not have saved availability yet.', '일정이 없습니다. 상대가 저장했는지 확인하세요.')}
                </p>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              {loadAvail ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-neutral-700 border-b">
                        {t('Time', '시간')}
                      </th>
                      {GRID_DAYS.map((day, index) => (
                        <th
                          key={day}
                          className="p-2 text-center text-sm font-medium text-neutral-700 border-b"
                        >
                          {language === 'ko' ? daysOfWeekKo[index] : day.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GRID_HOURS.map((time) => (
                      <tr key={time}>
                        <td className="p-2 text-sm text-neutral-600 border-b">{time}</td>
                        {GRID_DAYS.map((day) => (
                          <td key={`${day}-${time}`} className="p-1 border-b">
                            <button
                              type="button"
                              title={`${day} ${time}`}
                              onClick={() => toggleMySlot(day, time)}
                              className={`w-full h-10 rounded-md transition-colors ${cellClass(day, time)}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded" />
                <span className="text-neutral-600">{t('You', '나')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-400 rounded" />
                <span className="text-neutral-600">{t('Partner', '파트너')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-teal-600 rounded" />
                <span className="text-neutral-600">{t('Both free', '둘 다 가능')}</span>
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
            className="space-y-4"
          >
            <button
              type="button"
              onClick={openScheduleModal}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('Schedule New Meeting', '새 미팅 예약')}
            </button>

            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6"
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
                <div className="flex items-center gap-4 text-sm text-neutral-600">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-auto shadow-xl"
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-1">
                {t('Schedule Meeting', '미팅 예약')}
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                {t(
                  'Green = you, amber = partner, teal = both free. Tap a teal cell, then schedule (1 hour).',
                  '초록 = 나, 호박색 = 파트너, 청록 = 둘 다 가능. 청록 칸을 누른 뒤 예약하세요(1시간).'
                )}
              </p>
              <div className="space-y-4">
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
                    className="w-full max-w-md px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <table className="w-full border-collapse min-w-[640px]">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-sm font-medium text-neutral-700 border-b bg-neutral-50">
                            {t('Time', '시간')}
                          </th>
                          {GRID_DAYS.map((day, index) => (
                            <th
                              key={day}
                              className="p-2 text-center text-sm font-medium text-neutral-700 border-b bg-neutral-50"
                            >
                              {language === 'ko' ? daysOfWeekKo[index] : day.slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {GRID_HOURS.map((time) => (
                          <tr key={time}>
                            <td className="p-2 text-sm text-neutral-600 border-b whitespace-nowrap">
                              {time}
                            </td>
                            {GRID_DAYS.map((day) => (
                              <td key={`m-${day}-${time}`} className="p-1 border-b">
                                <button
                                  type="button"
                                  title={`${day} ${time}`}
                                  onClick={() => pickModalSlot(day, time)}
                                  className={`w-full h-9 sm:h-10 rounded-md transition-colors ${modalCellClass(day, time)}`}
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
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded shrink-0" />
                    <span className="text-neutral-600">{t('You', '나')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-amber-400 rounded shrink-0" />
                    <span className="text-neutral-600">{t('Partner', '파트너')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-teal-600 rounded shrink-0" />
                    <span className="text-neutral-600">{t('Both free — tap to pick', '둘 다 가능 — 탭하여 선택')}</span>
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
                      {modalSelectedTime}
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
                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
