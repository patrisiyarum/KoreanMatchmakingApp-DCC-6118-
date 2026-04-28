import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  acceptCallInvite,
  declineCallInvite,
  getIncomingInvite,
  type CallInviteRow,
} from '@/api/callInviteApi';
import { publicAssetUrl } from '../utils/profileImage';

const POLL_MS = 3000;

class Ringtone {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private nodes: { osc: OscillatorNode; gain: GainNode }[] = [];

  start() {
    if (this.timer != null) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    } catch {
      return;
    }
    const playBeep = () => {
      const ctx = this.ctx;
      if (!ctx) return;
      // Two short beeps ~ classic phone ring.
      [0, 0.45].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 740;
        const t0 = ctx.currentTime + offset;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
        gain.gain.linearRampToValueAtTime(0, t0 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.4);
        this.nodes.push({ osc, gain });
      });
    };
    playBeep();
    this.timer = window.setInterval(playBeep, 1700);
  }

  stop() {
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.nodes.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    });
    this.nodes = [];
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}

export function IncomingCallNotifier() {
  const { userId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [invite, setInvite] = useState<CallInviteRow | null>(null);
  const ringRef = useRef<Ringtone | null>(null);
  if (!ringRef.current) ringRef.current = new Ringtone();

  // Don't poll while the user is already in a call.
  const inCall = location.pathname.startsWith('/call/');

  useEffect(() => {
    if (!userId || inCall) {
      setInvite(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const next = await getIncomingInvite(userId);
      if (cancelled) return;
      setInvite((prev) => {
        if (!next) return null;
        if (prev && prev.id === next.id) return prev;
        return next;
      });
    };
    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [userId, inCall]);

  // Drive the ringtone based on invite presence.
  useEffect(() => {
    if (invite) {
      ringRef.current?.start();
      return () => ringRef.current?.stop();
    }
    ringRef.current?.stop();
    return undefined;
  }, [invite]);

  if (!invite || !userId) return null;

  const callerName =
    [invite.caller?.firstName, invite.caller?.lastName].filter(Boolean).join(' ').trim() ||
    `User ${invite.callerId}`;
  const avatarUrl = publicAssetUrl(invite.caller?.profileImage ?? null);

  const accept = async () => {
    const ok = await acceptCallInvite(invite.id, userId);
    setInvite(null);
    ringRef.current?.stop();
    if (ok) navigate(`/call/${invite.channelId}`);
  };
  const decline = async () => {
    await declineCallInvite(invite.id, userId);
    setInvite(null);
    ringRef.current?.stop();
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200 p-4"
      >
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Phone className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              {t('Incoming video call', '영상 통화 요청')}
            </p>
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {callerName} {t('wants to video call', '님이 영상 통화를 요청합니다')}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void decline()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-200 text-neutral-800 py-2 text-sm font-semibold hover:bg-neutral-300"
          >
            <PhoneOff className="h-4 w-4" />
            {t('Decline', '거절')}
          </button>
          <button
            type="button"
            onClick={() => void accept()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-700"
          >
            <Video className="h-4 w-4" />
            {t('Accept', '수락')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
