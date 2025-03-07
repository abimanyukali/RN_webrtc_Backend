import React, { useEffect, useState } from 'react';

const Message = ({
  yourId,
  callerIdA,
  callerIdB,
  socketRef,
  messages,
  setMessages,
}) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current; // Store the reference inside the effect

    // if (!socket) return; // Ensure socket exists

    const handleMessage = (msg) => {
      console.log('msg', msg);
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('message', handleMessage);
    return () => {
      socket.off('message', handleMessage);
    };
  }, [setMessages, socketRef]);
  const sendMessage = () => {
    const val = callerIdA || callerIdB;
    if (!socketRef.current || !val) return;
    if (message.trim()) {
      const newMessage = {
        sender: yourId,
        text: message,
        to: val,
        timestamp: Date.now(),
      };
      socketRef.current.emit('sendMessage', newMessage);
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    }
  };

  return (
    <div>
      <div
        style={{
          height: '300px',
          overflowY: 'scroll',
          border: '1px solid black',
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{ textAlign: msg.sender === yourId ? 'right' : 'left' }}
          >
            <strong>{msg.sender === yourId ? 'You' : 'Friend'}:</strong>{' '}
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Message;
