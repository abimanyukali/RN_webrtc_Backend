import React, { useEffect, useRef, useState } from "react";

const ChangeCamera = () => {
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const localVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Get list of cameras
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const videoDevices = deviceInfos.filter((device) => device.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setCurrentDeviceId(videoDevices[0].deviceId);
        startStream(videoDevices[0].deviceId);
      }
    });
  }, []);

  const startStream = async (deviceId) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop()); // Stop old stream
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true
      });

      streamRef.current = newStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }

      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find(s => s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(newStream.getVideoTracks()[0]); // Replace video track in WebRTC
        }
      }
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  };

  const handleCameraChange = (event) => {
    const newDeviceId = event.target.value;
    setCurrentDeviceId(newDeviceId);
    startStream(newDeviceId);
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline style={{ width: "300px", border: "1px solid black" }} />
      <select onChange={handleCameraChange} value={currentDeviceId}>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
        ))}
      </select>
    </div>
  );
};

export default ChangeCamera;
