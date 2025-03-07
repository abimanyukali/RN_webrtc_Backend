import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import Video from './Video';
import Message from './Message';
const SOCKET_URL =
  process.env.REACT_APP_BACKEND_URL ||
  'https://vkc66pfx-5000.euw.devtunnels.ms/';
const TURN_CONFIG = {
  iceServers: [
    { urls: 'stun:34.41.215.61:3478' },
    {
      urls: 'turn:34.41.215.61:3478',
      username: 'abi',
      credential: 'kali',
    },
  ],
};
const App = () => {
  const [yourId, setYourId] = useState('');
  const socketRef = useRef(null);
  const connectionEstablished = useRef(false);
  const [stream, setStream] = useState(null);
  const [callerIdA, setCallerIdA] = useState('');
  const [callerIdB, setCallerIdB] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [messages, setMessages] = useState([]);

  // const [reload, setReload] = useState(false);
  const partnerVideo = useRef(null);
  const peerRef = useRef(null);
  const videoRef = useRef(null);
  useEffect(() => {
    if (connectionEstablished.current) return;
    connectionEstablished.current = true;

    socketRef.current = io(SOCKET_URL, { autoConnect: false });
    socketRef.current.connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);

        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((error) => console.error('Error accessing media:', error));

    socketRef.current.on('yourId', (id) => setYourId(id));
    socketRef.current.on('partner-found', (id) => {
      setCallerIdB(id);
    });
    socketRef.current.on('hey', ({ signal, from }) => {
      setCallerIdA(from);
      setCallerSignal(signal);
    });
    socketRef.current.on('partner-disconnected', () => {
      console.log('partner disconnected');
      setCallerSignal(null);
      setCallerIdA('');
      setCallerIdB('');
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    });
    socketRef.current.on('callAccepted', (signal) => {
      setCallerSignal(signal);
      peerRef.current.signal(signal);
    });
    socketRef.current.on('call-end', () => {
      setCallerIdA('');
      setCallerIdB('');
      setCallerSignal(null);
      setMessages([]);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.off('yourId');
        socketRef.current.off('partner-found');
        socketRef.current.off('partner-disconnected');
        socketRef.current.off('call-end');
        socketRef.current.off('hey');
        socketRef.current.off('callAccepted');
      }
      // if (stream) {
      //   stream.getTracks().forEach((track) => track.stop());
      // }
    };
  }, []);

  const createPeerConnection = useCallback(
    (id) => {
      peerRef.current = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: TURN_CONFIG,
      });
      peerRef.current.on('signal', (data) => {
        socketRef.current.emit('signal', { to: id, data });
      });
      peerRef.current.on('stream', (partnerStream) => {
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = partnerStream;
        }
      });
    },
    [stream]
  );
  useEffect(() => {
    if (stream && callerIdB) {
      createPeerConnection(callerIdB);
    }
  }, [callerIdB, stream, createPeerConnection]);
  const createAnswer = useCallback(
    (from, offerSignal) => {
      console.log('create answer working');
      peerRef.current = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: TURN_CONFIG,
      });
      peerRef.current.on('signal', (answerSignal) => {
        console.log('answerSignal', answerSignal);
        socketRef.current.emit('acceptCall', {
          to: from,
          signal: answerSignal,
        });
      });
      peerRef.current.on('stream', (partnerStream) => {
        console.log('Received remote stream 2', partnerStream);
        if (partnerVideo.current) {
          partnerVideo.current.srcObject = partnerStream;
        }
      });

      peerRef.current.signal(offerSignal);
    },
    [stream]
  );
  useEffect(() => {
    if (stream && callerIdA && callerSignal && callerIdA !== yourId) {
      createAnswer(callerIdA, callerSignal);
    }
  }, [callerIdA, callerSignal, stream, yourId, createAnswer]);

  // const handleRefresh = () => {
  //   window.location.reload();
  // };
  const handleHangup = useCallback(() => {
    let val = callerIdA || callerIdB;
    console.log('call end', val);
    socketRef.current.emit('call-end', { to: val });
    setCallerSignal(null);
    setCallerIdA('');
    setCallerIdB('');
    setMessages([]);
    // setReload(true);
    // socketRef.current.disconnect();
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    // if (stream) {
    //   stream.getTracks().forEach((track) => track.stop());
    //   setStream(null);
    // }
  }, [callerIdA, callerIdB]);
  console.log('yourId', yourId);
  console.log('callerIdA', callerIdA);
  console.log('callerIdB', callerIdB);
  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <Video
        videoRef={videoRef}
        partnerVideo={partnerVideo}
        callerSignal={callerSignal}
        stream={stream}
        setCallerSignal={setCallerSignal}
        setCallerIdA={setCallerIdA}
        setCallerIdB={setCallerIdB}
        peerRef={peerRef}
        socketRef={socketRef}
        setStream={setStream}
        // setReload={setReload}
        handleHangup={handleHangup}
      />
      <div>
        {/* {reload && <button onClick={handleRefresh}>Refresh Page</button>} */}
        <div>
          {callerSignal && (
            <Message
              yourId={yourId}
              callerIdA={callerIdA}
              callerIdB={callerIdB}
              socketRef={socketRef}
              messages={messages}
              setMessages={setMessages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
