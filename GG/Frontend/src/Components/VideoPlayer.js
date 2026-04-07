import React, { useEffect, useRef } from 'react';

export const VideoPlayer = ({ user }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!user || !user.videoTrack || !ref.current) {
      return;
    }
    try {
      user.videoTrack.play(ref.current);
    } catch (error) {}

    return () => {
      if (user?.videoTrack && ref.current) {
        try {
          user.videoTrack.stop();
        } catch (error) {}
      }
    };
  }, [user, user?.videoTrack]);

  return (
    <div className="vr-tile">
      <div className="vr-tile-video" ref={ref} />
      <div className="vr-tile-label">Participant {user?.uid ?? '...'}</div>
    </div>
  );
};
