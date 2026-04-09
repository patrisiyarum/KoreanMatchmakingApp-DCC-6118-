import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, createSearchParams, useSearchParams } from 'react-router-dom';
import './VideoRoom.css';
import { uploadRecording as uploadRecordingService } from '../Services/uploadService.js';
import { normalizeZoomUrl } from '../Utils/zoomUtils';

/**
 * Opens Zoom in a new tab; video/audio run in the Zoom app or browser.
 * Optional: records your microphone in this browser for transcripts (your audio only).
 */
export default function VideoRoom({
  zoomUrl,
  meetingLabel = 'Zoom meeting',
  initialAiAllowed = true,
  chatId,
  currentUserId,
}) {
  const resolvedUrl = normalizeZoomUrl(zoomUrl);
  const [aiAllowed, setAiAllowed] = useState(initialAiAllowed);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const micStreamRef = useRef(null);

  const [search] = useSearchParams();
  const id = search.get('id') || currentUserId || '';
  const navigate = useNavigate();

  const cleanupMic = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => cleanupMic();
  }, []);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
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
    const filename = `zoom-call-${Date.now()}.webm`;
    formData.append('audio', blob, filename);
    formData.append('user1Id', id || '');
    formData.append('user2Id', '');
    formData.append('timestamp', new Date().toISOString());
    formData.append('aiAccess', aiAllowed);

    try {
      const response = await uploadRecordingService(formData);
      if (response?.success) {
        console.log('Recording uploaded successfully:', response.filename);
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    setIsUploading(true);

    const stopPromise = new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => resolve();
    });

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    await stopPromise;

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

    cleanupMic();
    setIsUploading(false);
  };

  const openZoom = () => {
    if (!resolvedUrl) return;
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  const endCall = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      cleanupMic();
    }

    navigate({
      pathname: '/PostVideocall',
      search: createSearchParams({
        id,
        selfId: id,
        partnerId: '',
      }).toString(),
    });
  };

  const goHome = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      cleanupMic();
    }

    navigate({ pathname: '/Dashboard', search: createSearchParams({ id }).toString() });
  };

  return (
    <div className="vr-root">
      <div className="vr-topbar">
        <div className="vr-left">
          <span className="vr-meeting-info">{meetingLabel}</span>
          <button type="button" className="vr-btn vr-btn-home" onClick={goHome} disabled={isUploading}>
            {isUploading ? '…' : '←'}
          </button>
        </div>
        <div className="vr-center">
          <button
            type="button"
            className="vr-btn"
            onClick={openZoom}
            disabled={isUploading || !resolvedUrl}
            title="Open Zoom"
          >
            Open Zoom
          </button>
          <button
            type="button"
            className="vr-btn vr-btn-record"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            title="Record your microphone for AI transcript (optional)"
          >
            {isUploading ? '⏳' : isRecording ? '⏹' : '⏺'}{' '}
            {isUploading ? 'Uploading…' : isRecording ? 'Stop' : 'Record mic'}
          </button>
        </div>
        <div className="vr-right">
          <button
            type="button"
            className={`vr-btn ${aiAllowed ? 'vr-btn-ai-on' : 'vr-btn-ai-off'}`}
            onClick={toggleAiAccess}
            title="AI access for transcripts"
          >
            {aiAllowed ? 'AI On' : 'AI Off'}
          </button>
          <button type="button" className="vr-btn vr-btn-end" onClick={endCall} disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Done'}
          </button>
        </div>
      </div>

      <div className="vr-content">
        <div className="vr-zoom-panel">
          <div className="vr-zoom-card">
            <h2 className="vr-zoom-title">Video on Zoom</h2>
            <p className="vr-zoom-text">
              This app opens your meeting in Zoom (new tab). Use the Zoom window for camera and conversation.
            </p>
            {resolvedUrl ? (
              <>
                <button type="button" className="vr-zoom-cta" onClick={openZoom} disabled={isUploading}>
                  Join in Zoom
                </button>
                <p className="vr-zoom-url" title={resolvedUrl}>
                  {resolvedUrl.length > 72 ? `${resolvedUrl.slice(0, 70)}…` : resolvedUrl}
                </p>
              </>
            ) : (
              <p className="vr-zoom-error">Invalid Zoom link. Go back and enter a valid invite URL.</p>
            )}
            <p className="vr-zoom-note">
              Optional <strong>Record mic</strong> captures only your side in this browser for transcripts—not the full Zoom call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
