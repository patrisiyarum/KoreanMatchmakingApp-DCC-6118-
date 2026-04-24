import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Plus, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { initialMatches } from '../data/mockData';

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  available: boolean;
}

interface Meeting {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  time: string;
  duration: string;
  topic: string;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const daysOfWeekKo = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export function Schedule() {
  const { t, language } = useLanguage();
  const [view, setView] = useState<'availability' | 'meetings'>('availability');
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      partnerId: 'user-2',
      partnerName: '지우 (Jiwoo)',
      date: '2026-04-10',
      time: '14:00',
      duration: '60 min',
      topic: 'Conversation practice',
    }
  ]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const toggleAvailability = (day: string, time: string) => {
    const slotId = `${day}-${time}`;
    const existing = availability.find(slot => slot.id === slotId);

    if (existing) {
      setAvailability(prev => prev.filter(slot => slot.id !== slotId));
    } else {
      setAvailability(prev => [...prev, { id: slotId, day, time, available: true }]);
    }
  };

  const isSlotAvailable = (day: string, time: string) => {
    return availability.some(slot => slot.day === day && slot.time === time);
  };

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

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setView('availability')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'availability'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('My Availability', '내 가능 시간')}
            </div>
          </button>
          <button
            onClick={() => setView('meetings')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'meetings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200'
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
            <div className="mb-4">
              <h3 className="font-semibold text-neutral-900 mb-1">
                {t('Set Your Available Times', '가능한 시간 설정')}
              </h3>
              <p className="text-sm text-neutral-600">
                {t('Click on time slots to mark when you\'re available', '가능한 시간을 클릭하세요')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-sm font-medium text-neutral-700 border-b">
                      {t('Time', '시간')}
                    </th>
                    {daysOfWeek.map((day, index) => (
                      <th key={day} className="p-2 text-center text-sm font-medium text-neutral-700 border-b">
                        {language === 'ko' ? daysOfWeekKo[index] : day.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="p-2 text-sm text-neutral-600 border-b">{time}</td>
                      {daysOfWeek.map(day => {
                        const available = isSlotAvailable(day, time);
                        return (
                          <td key={`${day}-${time}`} className="p-1 border-b">
                            <button
                              onClick={() => toggleAvailability(day, time)}
                              className={`w-full h-10 rounded transition-colors ${
                                available
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-neutral-100 hover:bg-neutral-200'
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-neutral-600">{t('Available', '가능')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-neutral-100 rounded" />
                <span className="text-neutral-600">{t('Not available', '불가능')}</span>
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
              onClick={() => setShowScheduleModal(true)}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('Schedule New Meeting', '새 미팅 예약')}
            </button>

            {meetings.map(meeting => (
              <div
                key={meeting.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {meeting.partnerName}
                    </h3>
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
                    <span>{new Date(meeting.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{meeting.time} ({meeting.duration})</span>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                {t('Schedule Meeting', '미팅 예약')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('Partner', '파트너')}
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {initialMatches.map(match => (
                      <option key={match.user.id}>{match.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('Date', '날짜')}
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('Time', '시간')}
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {timeSlots.map(time => (
                      <option key={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('Topic', '주제')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('e.g., Conversation practice', '예: 회화 연습')}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-neutral-200 text-neutral-900 py-3 rounded-lg font-medium hover:bg-neutral-300"
                >
                  {t('Cancel', '취소')}
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                >
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
