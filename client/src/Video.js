import React, { useCallback, useEffect, useState } from 'react';
import { MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';

const Video = ({
  videoRef,
  partnerVideo,
  callerSignal,
  stream,
  handleHangup
 
}) => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVidOn, setIsVidOn] = useState(false);
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      setIsVidOn(videoTrack.enabled);
      const audioTrack = stream.getAudioTracks()[0];
      setIsMicOn(audioTrack.enabled);
    }
  }, [stream]);
  const toggleCamera = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVidOn(videoTrack.enabled);
    }
  }, [stream]);
  const toggleMic = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, [stream]);
  
  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div>
        <h1>Random Video Call </h1>
        <div>
          <h6>your video</h6>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '300px ' }}
          />
        </div>
        <div>
          <button onClick={toggleMic}>
            {isMicOn && <MdMicOff size={28} />}
            {!isMicOn && <MdMic size={28} />}
          </button>
          <button onClick={handleHangup}>End Call</button>
          <button onClick={toggleCamera}>
            {isVidOn && <MdVideocamOff size={28} />}
            {!isVidOn && <MdVideocam size={28} />}
          </button>
        </div>
        <div>
          <h6>partner video</h6>
          {}
          {callerSignal && (
            <video
              ref={partnerVideo}
              autoPlay
              playsInline
              style={{ width: '300px ' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Video;
