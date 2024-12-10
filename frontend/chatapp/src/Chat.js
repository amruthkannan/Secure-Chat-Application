import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";
import './Chat.css';

// Initialize Socket.IO client
const socket = io("http://localhost:5000", { transports: ["websocket"] });

const Chat = () => {
  const [username, setUsername] = useState("");
  const [recipient, setRecipient] = useState(""); // Recipient's username
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [sessionKey, setSessionKey] = useState("secretKey"); // AES key for encryption

  // Join server and set up username
  const joinServer = () => {
    if (username.trim() !== "" && recipient.trim() !== "") {
      socket.emit("joinServer", username);
      setJoined(true);
    }
  };

  // Encrypt the message with AES
  const encryptMessage = (message) => {
    return CryptoJS.AES.encrypt(message, sessionKey).toString();
  };

  // Decrypt the received message with AES
  const decryptMessage = useCallback(
    (encryptedMessage) => {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, sessionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    },
    [sessionKey]
  );

  // Send message to the server
  const sendMessage = () => {
    if (message.trim() !== "" && recipient.trim() !== "") {
      const encryptedMessage = encryptMessage(message);
      socket.emit("sendMessage", {
        sender: username,
        recipient: recipient,
        encryptedMessage: encryptedMessage,
      });
      setChatMessages((prevMessages) => [
        ...prevMessages,
        `You to ${recipient}: ${message}`
      ]);
      setMessage(""); // Clear the input after sending
    }
  };

  // Receive messages from server and decrypt them
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      console.log("Message received from server:", data);

      const decryptedMessage = decryptMessage(data.encryptedMessage);
      setChatMessages((prevMessages) => [
        ...prevMessages,
        `${data.sender}: ${decryptedMessage}`
      ]);
    });

    socket.on("joinedServer", (msg) => {
      console.log(msg);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("joinedServer");
    };
  }, [decryptMessage]);

  return (
    <div className="chat-container">
      {!joined ? (
        <div className="join-container">
          <h2 className="join-header">Join the Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="join-input"
          />
          <input
            type="text"
            placeholder="Enter recipient's username"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="join-input"
          />
          <button onClick={joinServer} className="join-button">
            Join
          </button>
        </div>
      ) : (
        <>
          <div className="chat-header">Chat Application</div>

          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.startsWith("You to") ? "sent" : "received"}`}
              >
                <div className="message-content">
                  {msg.replace("You to", "")}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="chat-input"
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
