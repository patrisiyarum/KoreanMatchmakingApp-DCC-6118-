import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteUser } from 'agora-rtc-sdk-ng';
import { Loader2, Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createAgoraTokenApi } from '@/api/meetingsApi';

export function AgoraCall() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { meetingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteCount, setRemoteCount] = useState(0);
  const [localPreviewReady, setLocalPreviewReady] = useState(false);
  const [cameraIssue, setCameraIssue] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(null);

  const channelName = useMemo(() => `meeting-${meetingId || 'unknown'}`, [meetingId]);
  const uidNum = useMemo(() => Number(userId || 0) || 0, [userId]);
  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    let disposed = false;
    const init = async () => {
      if (!meetingId || !userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const cams = await AgoraRTC.getCameras();
        if (disposed) return;
        const mappedCams = cams.map((c) => ({ deviceId: c.deviceId, label: c.label || `Camera ${c.deviceId.slice(0, 5)}` }));
        setCameraDevices(mappedCams);
        const initialCameraId = selectedCameraId || mappedCams[0]?.deviceId || '';
        if (initialCameraId && !selectedCameraId) {
          setSelectedCameraId(initialCameraId);
        }

        const tokenRes = await createAgoraTokenApi({ channelName, uid: uidNum });
        if (disposed) return;
        if (tokenRes.warning) {
          toast.message(tokenRes.warning);
        }

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', async (remoteUser: IRemoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === 'video') {
            let el = document.getElementById(`remote-${String(remoteUser.uid)}`);
            if (!el) {
              el = document.createElement('div');
              el.id = `remote-${String(remoteUser.uid)}`;
              el.className = 'h-56 w-full rounded-xl bg-black overflow-hidden';
              remoteContainerRef.current?.appendChild(el);
            }
            remoteUser.videoTrack?.play(el);
          }
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
          setRemoteCount(client.remoteUsers.length);
        });

        client.on('user-unpublished', (remoteUser, mediaType) => {
          if (mediaType === 'video') {
            const el = document.getElementById(`remote-${String(remoteUser.uid)}`);
            if (el) el.remove();
          }
          setRemoteCount(client.remoteUsers.length);
        });

        client.on('user-left', (remoteUser) => {
          const el = document.getElementById(`remote-${String(remoteUser.uid)}`);
          if (el) el.remove();
          setRemoteCount(client.remoteUsers.length);
        });

        await client.join(tokenRes.appId, tokenRes.channelName, tokenRes.token || null, tokenRes.uid);
        if (disposed) return;
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {},
          { encoderConfig: '720p_1', cameraId: initialCameraId || undefined }
        );
        if (disposed) {
          micTrack.stop();
          micTrack.close();
          camTrack.stop();
          camTrack.close();
          return;
        }
        micTrackRef.current = micTrack;
        camTrackRef.current = camTrack;
        // Defer the actual `.play()` to a layout effect — the local video
        // container is gated behind `loading`, so its ref is null here.
        for (let i = 0; i < 20 && client.connectionState !== 'CONNECTED'; i += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 100));
        }
        if (client.connectionState !== 'CONNECTED') {
          throw new Error(t('Call connection was not ready yet. Please retry.', '통화 연결이 준비되지 않았습니다. 다시 시도해주세요.'));
        }
        await client.publish([micTrack, camTrack]);
        if (disposed) return;
        setJoined(true);
      } catch (err) {
        const ax = err as {
          message?: string;
          response?: { data?: { message?: string; error?: string } };
        };
        const msg =
          ax.response?.data?.message ||
          ax.response?.data?.error ||
          ax.message ||
          t('Could not start call', '통화를 시작할 수 없습니다');
        toast.error(msg);
        setCameraIssue(msg);
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    void init();

    return () => {
      disposed = true;
      void (async () => {
        try {
          camTrackRef.current?.stop();
          camTrackRef.current?.close();
          micTrackRef.current?.stop();
          micTrackRef.current?.close();
          await clientRef.current?.leave();
        } catch {
          // ignore cleanup errors
        }
      })();
    };
  }, [channelName, meetingId, selectedCameraId, t, uidNum, userId]);

  useLayoutEffect(() => {
    if (loading) return;
    const track = camTrackRef.current;
    const container = localVideoRef.current;
    if (!track || !container) return;
    try {
      track.play(container, { fit: 'cover', mirror: true });
      setLocalPreviewReady(true);
      setCameraIssue(null);
    } catch {
      setLocalPreviewReady(false);
      setCameraIssue(t('Camera preview failed to render', '카메라 미리보기를 표시하지 못했습니다'));
    }
  }, [loading, t]);

  const toggleMute = async () => {
    if (!micTrackRef.current) return;
    const next = !muted;
    await micTrackRef.current.setEnabled(!next);
    setMuted(next);
  };

  const toggleCamera = async () => {
    if (!camTrackRef.current) return;
    const next = !cameraOff;
    await camTrackRef.current.setEnabled(!next);
    setCameraOff(next);
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (!camTrackRef.current) return;
    try {
      await camTrackRef.current.setDevice(deviceId);
      if (localVideoRef.current) {
        camTrackRef.current.play(localVideoRef.current, { fit: 'cover', mirror: true });
        setLocalPreviewReady(true);
        setCameraIssue(null);
      }
    } catch {
      setCameraIssue(t('Could not switch camera device', '카메라 장치를 변경하지 못했습니다'));
    }
  };

  const restartCameraPreview = async () => {
    const client = clientRef.current;
    if (!client) return;
    try {
      const oldTrack = camTrackRef.current;
      const newTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '720p_1',
        cameraId: selectedCameraId || undefined,
      });
      if (localVideoRef.current) {
        newTrack.play(localVideoRef.current, { fit: 'cover', mirror: true });
      }
      camTrackRef.current = newTrack;
      setLocalPreviewReady(true);
      setCameraIssue(null);
      if (joined) {
        if (oldTrack) {
          await client.unpublish([oldTrack]);
        }
        await client.publish([newTrack]);
      }
      if (oldTrack) {
        oldTrack.stop();
        oldTrack.close();
      }
      toast.success(t('Camera preview restarted', '카메라 미리보기를 다시 시작했습니다'));
    } catch {
      setLocalPreviewReady(false);
      setCameraIssue(t('Could not restart camera preview', '카메라 미리보기를 다시 시작하지 못했습니다'));
    }
  };

  const hangUp = async () => {
    try {
      camTrackRef.current?.stop();
      camTrackRef.current?.close();
      micTrackRef.current?.stop();
      micTrackRef.current?.close();
      await clientRef.current?.leave();
      setJoined(false);
      toast.success(t('Call ended', '통화 종료'));
    } catch {
      toast.error(t('Could not end call cleanly', '통화를 정상 종료하지 못했습니다'));
    }
  };

  if (!meetingId) {
    return <div className="p-6 text-sm text-neutral-600">{t('Missing meeting id.', '미팅 ID가 없습니다.')}</div>;
  }

  return (
    <div className="size-full overflow-y-auto bg-neutral-50">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{t('Agora Call', 'Agora 통화')}</h2>
            <p className="text-sm text-neutral-600">
              {t('Meeting channel', '미팅 채널')}: <span className="font-mono">{channelName}</span>
            </p>
          </div>
          <button type="button" onClick={goBack} className="text-sm font-medium text-blue-700 hover:text-blue-800">
            {t('Back to calls', '통화 목록으로')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-xs text-neutral-600 mb-2">{t('You', '나')}</p>
                {cameraDevices.length > 1 ? (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => void switchCamera(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
                  >
                    {cameraDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <div ref={localVideoRef} className="h-56 w-full rounded-xl bg-black overflow-hidden" />
                {!localPreviewReady ? (
                  <div className="mt-2 text-xs text-neutral-500">
                    {cameraIssue || t('If your camera is black, toggle camera off/on once and allow browser camera permission.', '카메라가 검게 보이면 카메라를 껐다 켜고 브라우저 카메라 권한을 허용하세요.')}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                <p className="text-xs text-neutral-600 mb-2">
                  {t('Remote participants', '상대 참여자')} ({remoteCount})
                </p>
                <div ref={remoteContainerRef} className="space-y-2" />
                {!remoteCount ? (
                  <div className="h-56 w-full rounded-xl bg-neutral-100 flex items-center justify-center text-sm text-neutral-500">
                    {t('Waiting for others to join…', '상대가 참여하기를 기다리는 중…')}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => void toggleMute()}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${muted ? 'bg-red-100 text-red-700' : 'bg-white border border-neutral-200 text-neutral-800'}`}
              >
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {muted ? t('Unmute', '마이크 켜기') : t('Mute', '음소거')}
              </button>
              <button
                type="button"
                onClick={() => void toggleCamera()}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${cameraOff ? 'bg-red-100 text-red-700' : 'bg-white border border-neutral-200 text-neutral-800'}`}
              >
                {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {cameraOff ? t('Camera on', '카메라 켜기') : t('Camera off', '카메라 끄기')}
              </button>
              <button
                type="button"
                onClick={() => void restartCameraPreview()}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                <RefreshCw className="w-4 h-4" />
                {t('Restart camera', '카메라 재시작')}
              </button>
              <button
                type="button"
                onClick={() => void hangUp()}
                disabled={!joined}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <PhoneOff className="w-4 h-4" />
                {t('End call', '통화 종료')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
