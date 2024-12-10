import { render, screen, fireEvent } from "@testing-library/react";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";
import Chat from "./Chat"; // Adjust path if your Chat.js file is elsewhere

// Mock socket.io-client
jest.mock("socket.io-client");

describe("Chat Application Tests", () => {
  // Test AES encryption and decryption functions
  test("encryptMessage should return an encrypted string", () => {
    const sessionKey = "secretKey";
    const message = "Hello, World!";
    const encryptedMessage = CryptoJS.AES.encrypt(message, sessionKey).toString();

    expect(encryptedMessage).not.toBe(message); // Ensure the message is encrypted
    expect(typeof encryptedMessage).toBe("string");
  });

  test("decryptMessage should return the original message", () => {
    const sessionKey = "secretKey";
    const message = "Hello, World!";
    const encryptedMessage = CryptoJS.AES.encrypt(message, sessionKey).toString();
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, sessionKey);
    const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

    expect(decryptedMessage).toBe(message);
  });

  // Test UI rendering
  test("renders join screen initially", () => {
    render(<Chat />);
    expect(screen.getByPlaceholderText("Enter your username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter recipient's username")).toBeInTheDocument();
  });

  test("renders chat screen after joining", () => {
    render(<Chat />);

    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter recipient's username"), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByText("Join"));

    expect(screen.getByText("Chat Application")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  // Test message sending logic
  test("sends message on send button click", () => {
    const mockEmit = jest.fn();
    io.mockReturnValue({
      emit: mockEmit,
      on: jest.fn(),
      off: jest.fn(),
    });

    render(<Chat />);

    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter recipient's username"), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByText("Join"));

    fireEvent.change(screen.getByPlaceholderText("Type a message..."), {
      target: { value: "Hello Bob!" },
    });
    fireEvent.click(screen.getByText("Send"));

    expect(mockEmit).toHaveBeenCalledWith("sendMessage", {
      sender: "Alice",
      recipient: "Bob",
      encryptedMessage: expect.any(String),
    });
  });

  // Test message receiving logic
  test("receives and displays messages", () => {
    const mockOn = jest.fn((event, callback) => {
      if (event === "receiveMessage") {
        callback({
          sender: "Bob",
          encryptedMessage: CryptoJS.AES.encrypt("Hello Alice!", "secretKey").toString(),
        });
      }
    });

    io.mockReturnValue({
      emit: jest.fn(),
      on: mockOn,
      off: jest.fn(),
    });

    render(<Chat />);

    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter recipient's username"), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByText("Join"));

    expect(screen.getByText("Bob: Hello Alice!")).toBeInTheDocument();
  });
});
