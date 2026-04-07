import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';
import { useNavigate, createSearchParams, useSearchParams } from 'react-router-dom';
import './VideoRoom.css';
import { uploadRecording as uploadRecordingService } from '../Services/uploadService.js';

const APP_ID = 'a0af2735bfe446cf8a2526d87d1cfe9e';
const TOKEN = '007eJxTYPjc4r7ZV/zT1VPHrlVo/PZknO54tObsgkX36u1u7bxSKVKiwJBokJhmZG5smpSWamJilpxmkWhkamSWYmGeYpiclmqZ6jLfMrMhkJHh7EZxVkYGCATxuRlyE0uSM3ITszPz0hkYAC1EJQI=';
const CHANNEL = 'matchmaking';

export const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export default function VideoRoom({ room, initialAiAllowed = true, chatId, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [muted, setMuted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(initialAiAllowed);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const destinationRef = useRef(null);
  const [recordingFilename, setRecordingFilename] = useState(null);
  const [search] = useSearchParams();
  const id = search.get('id') || currentUserId || '';
  const navigate = useNavigate();
  const joinedRef = useRef(false);

  const [participantIds, setParticipantIds] = useState({
    self: null,
    partner: null,
  });

  const cleanupCall = async (removeListeners = true) => {
    try {
      if (localTracks.length) await client.unpublish(localTracks);
    } catch (e) { console.warn('Unpublish error:', e); }

    for (const t of localTracks) {
      try { t.stop(); t.close(); } catch {}
    }

    try { await client.leave(); } catch {}
    
    if (removeListeners) {
      client.removeAllListeners();
    }

    // Cleanup recording without uploading (upload should be done before cleanup)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    setUsers([]);
    setLocalTracks([]);
    setMuted(false);
    setHidden(false);
    setIsRecording(false);
    joinedRef.current = false;
  };


  const handleUserPublished = async (user, mediaType) => {  
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video') {
      setUsers(prev => {
        const isDuplicate = prev.some(u => u.uid === user.uid);
        const isSelf = user.uid === client.uid;
        
        if (isDuplicate || isSelf) {
          return prev;
        }
        return [...prev, user];
      });
    }
    
    if (mediaType === 'audio') {
      user.audioTrack?.play();
    }
  };


  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === 'video') {
      user.videoTrack?.stop?.();
      setUsers(prev => prev.filter(u => u.uid !== user.uid));
    } else if (mediaType === 'audio') {
      user.audioTrack?.stop?.();
    }
  };

  const handleUserLeft = (user) => {
    setUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  // FIXED: Prevent cancel token race condition
  useEffect(() => {
    let cancelled = false;
    let joinPromise = null;
    
    const init = async () => {
      if (joinedRef.current) {
        return;
      }

      try {
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-left', handleUserLeft);

        const channel = room || CHANNEL;
        
        // Store promise reference to prevent cleanup race
        joinPromise = client.join(APP_ID, channel, TOKEN, Number(id));
        const uid = await joinPromise;
        setParticipantIds(prev => ({ ...prev, self: Number(id) }));
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          return;
        }

        const [audioTrack, videoTrack] = tracks;
        setLocalTracks(tracks);
        
        const localUser = { uid, videoTrack, audioTrack };
        setUsers(prev => {
          if (prev.some(u => u.uid === uid)) return prev;
          return [localUser, ...prev];
        });
        
        await client.publish(tracks);
        joinedRef.current = true;

      } catch (err) {
        if (!cancelled) { // Only log real errors, not intentional cancels
          console.error('Agora init error:', err);
        }
      }
    };

    init();
    
    return () => {
      cancelled = true;
      if (joinPromise && !joinPromise.done) {
      }
      cleanupCall(false); // Don't remove listeners during normal cleanup
    };
  }, []); // EMPTY deps only


  // Log users state changes
  useEffect(() => {
  }, [users]);

  /** Cleanup when tab closes */
  useEffect(() => {
    const beforeUnload = () => {
      localTracks.forEach(t => {
        try { t.stop(); t.close(); } catch {}
      });
      try { client.leave(); } catch {}
      try { client.removeAllListeners(); } catch {}
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [localTracks]);

  useEffect(() => {
  let cancelled = false;
  let joinPromise = null;

  const init = async () => {
    if (joinedRef.current) return;

    try {
      const selfIdNum = Number(id);

      // 🔹 remote user joins the channel
      client.on('user-joined', (user) => {
        if (user.uid !== selfIdNum) {
          setParticipantIds(prev => ({
            ...prev,
            partner: user.uid,
          }));
          console.log('Remote user joined, partner uid =', user.uid);
        }
      });

      // 🔹 remote user leaves the channel
      client.on('user-left', (user) => {
        console.log('🚪 Remote user left:', user.uid);
        setUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);

      const channel = room || CHANNEL;

      // join with your app user id as Agora uid
      joinPromise = client.join(APP_ID, channel, TOKEN, selfIdNum);
      const uid = await joinPromise;

      setParticipantIds(prev => ({ ...prev, self: selfIdNum }));

      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      if (cancelled) return;

      const [audioTrack, videoTrack] = tracks;
      setLocalTracks(tracks);

      const localUser = { uid, videoTrack, audioTrack };
      setUsers(prev => (prev.some(u => u.uid === uid) ? prev : [localUser, ...prev]));

      await client.publish(tracks);
      joinedRef.current = true;
    } catch (err) {
      if (!cancelled) {
        console.error('Agora init error:', err);
      }
    }
  };

  init();

  return () => {
    cancelled = true;
    cleanupCall(false);
  };
}, []); // deps stay empty

  /** UI Handlers - ALL YOUR ORIGINAL CODE UNCHANGED */
  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev;
      localTracks[0]?.setEnabled(!next);
      return next;
    });
  };

  const toggleHideVideo = () => {
    console.log('People in call:', {
      selfId: participantIds.self,
      partnerId: participantIds.partner,
    });
    setHidden(prev => {
      const next = !prev;
      localTracks[1]?.setEnabled(!next);
      return next;
    });
  };

  const toggleAiAccess = async () => {
    const next = !aiAllowed;
    setAiAllowed(next);
    try {
      if (chatId) {
        const { updateChatPrivacy } = await import('../Services/privacyService');
        await updateChatPrivacy(chatId, id, next);
      }
    } catch (e) {
      console.error('Failed to update AI access', e);
      setAiAllowed(!next);
    }
  };

  const startRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      if (localTracks[0]) {
        const localSource = audioContext.createMediaStreamSource(
          new MediaStream([localTracks[0].getMediaStreamTrack()])
        );
        localSource.connect(destination);
      }

      users.forEach(user => {
        if (user.audioTrack && user.uid !== client.uid) {
          const track = user.audioTrack.getMediaStreamTrack();
          const source = audioContext.createMediaStreamSource(new MediaStream([track]));
          source.connect(destination);
        }
      });

      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Remove the onstop handler - we'll handle upload explicitly in stopRecording

      audioContextRef.current = audioContext;
      destinationRef.current = destination;
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleUploadRecording = async (blob) => {
    if (!(blob instanceof Blob) || blob.size === 0) return;
    
    const formData = new FormData();
    const filename = `call-${room}-${Date.now()}.webm`;
    formData.append('audio', blob, filename);
    formData.append('user1Id', participantIds.self || '');
    formData.append('user2Id', participantIds.partner || '');
    formData.append('timestamp', new Date().toISOString());
    formData.append('aiAccess', aiAllowed);

    console.log(formData);

    try {
      const response = await uploadRecordingService(formData);
      if (response?.success) {
        setRecordingFilename(response.filename);
        console.log('Recording uploaded successfully:', response.filename);
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    setIsUploading(true);

    // Create a promise that resolves when the recorder stops and we have all data
    const stopPromise = new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        resolve();
      };
    });

    // Stop the recorder
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    // Wait for the onstop event to fire (ensures all data is collected)
    await stopPromise;

    // Now upload the recording
    if (recordedChunksRef.current.length > 0) {
      try {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        await handleUploadRecording(blob);
      } catch (error) {
        console.error('Error processing recording:', error);
      } finally {
        recordedChunksRef.current = [];
      }
    }

    // Close the audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    setIsUploading(false);
  };

  const endCall = async () => {
    // If recording is in progress, stop and upload first
    if (isRecording) {
      await stopRecording();
    }

    await cleanupCall(true);
    console.log('Ending call between:', {
      selfId: participantIds.self,
      partnerId: participantIds.partner,
    });

    navigate({ pathname: '/PostVideocall', search: createSearchParams({ id, selfId: participantIds.self,
      partnerId: participantIds.partner, }).toString() });
  };

  const goHome = async () => {
    // If recording is in progress, stop and upload first
    if (isRecording) {
      await stopRecording();
    }

    await cleanupCall(true);
    navigate({ pathname: '/Dashboard', search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="vr-root">
      <div className="vr-topbar">
        <div className="vr-left">
          <span className="vr-meeting-info">Meeting</span>
          <button className="vr-btn vr-btn-home" onClick={goHome} disabled={isUploading}>
            {isUploading ? 'Uploading...' : '←'}
          </button>
        </div>
        <div className="vr-center">
          <button className="vr-btn" onClick={toggleMute} disabled={isUploading} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🎤'} {muted ? 'Unmute' : 'Mute'}
          </button>
          <button className="vr-btn" onClick={toggleHideVideo} disabled={isUploading} title={hidden ? 'Start video' : 'Stop video'}>
            {hidden ? '📷' : '📹'} {hidden ? 'Start video' : 'Stop video'}
          </button>
          <button
            className="vr-btn vr-btn-record"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            title={isRecording ? 'Stop recording' : 'Record'}
          >
            {isUploading ? '⏳' : isRecording ? '⏹' : '⏺'} {isUploading ? 'Uploading...' : isRecording ? 'Stop' : 'Record'}
          </button>
        </div>
        <div className="vr-right">
          <button
            className={`vr-btn ${aiAllowed ? 'vr-btn-ai-on' : 'vr-btn-ai-off'}`}
            onClick={toggleAiAccess}
            title="AI access"
          >
            {aiAllowed ? 'AI On' : 'AI Off'}
          </button>
          <button className="vr-btn vr-btn-end" onClick={endCall} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Leave call'}
          </button>
        </div>
      </div>

      <div className="vr-content">
        <div className="videos">
          {users.length === 0 && <div className="vr-placeholder">Waiting for others to join...</div>}
          {users.map(user => (
            <VideoPlayer key={user.uid} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}
