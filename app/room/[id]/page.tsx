"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import YouTube, { YouTubePlayer } from "react-youtube";
import { motion } from "framer-motion";

const socket = io("http://localhost:4000");

export default function RoomPage() {
  const { id: roomCode } = useParams();
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Guest";

  const [videoId, setVideoId] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Added to track play/pause state

  useEffect(() => {
    if (!roomCode) return;

    // Join room
    socket.emit("joinRoom", { roomId: roomCode, userName });

    // Listen for video updates
    socket.on("syncVideo", ({ newVideoId, time, playing }) => {
      setVideoId(newVideoId);
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
        if (playing) {
          setIsPlaying(false);
          playerRef.current.playVideo();
        } else {
          setIsPlaying(true);
          playerRef.current.pauseVideo();  // Added pause logic
        }
      }
    });

    // Listen for chat messages
    socket.on("chatMessage", (msg) => {
      setChat((prevChat) => [...prevChat, msg]);
    });

    return () => {
      socket.off("syncVideo");
      socket.off("chatMessage");
    };
  }, [roomCode, userName]);

  // Handle Video Changes
  const changeVideo = (id: string) => {
    setVideoId(id);
    socket.emit("changeVideo", { roomId: roomCode, videoId: id });
  };

  // When player is ready
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
  };

  // When video state changes (play/pause)
  const onPlayerStateChange = (event: { target: YouTubePlayer, data: number }) => {
    if (!playerRef.current) return;
    const time = playerRef.current.getCurrentTime();

    if (event.data === 1 && !isPlaying) {
      setIsPlaying(true);
      socket.emit("syncVideo", { roomId: roomCode, videoId, time, playing: true });
    } else if (event.data === 2 && isPlaying) {
      setIsPlaying(false);
      socket.emit("syncVideo", { roomId: roomCode, videoId, time, playing: false });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-b from-black to-gray-900 text-white">
      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Room: {roomCode}</h1>
        <h2 className="text-lg text-gray-400">Welcome, {userName}!</h2>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl">
        <motion.div className="flex-1 bg-neutral-900/60 p-4 rounded-lg shadow-lg" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <input
            placeholder="Enter YouTube Video ID"
            className="w-full p-2 bg-neutral-800 text-white rounded-lg mb-4 text-center border border-gray-600"
            onChange={(e) => changeVideo(e.target.value)}
          />
          {videoId && (
            <div className="w-full aspect-video rounded-lg overflow-hidden">
              <YouTube
                videoId={videoId}
                className="w-full h-full"
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
            </div>
          )}
        </motion.div>

        <motion.div className="w-full lg:w-80 bg-neutral-900/60 p-4 rounded-lg shadow-lg flex flex-col" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-lg font-semibold text-center">Chat</h2>
          <div className="flex-1 overflow-y-auto max-h-80 bg-neutral-800 p-3 rounded-lg space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
            {chat.length === 0 ? <p className="text-gray-400 text-center">No messages yet...</p> : chat.map((msg, index) => (
              <div key={index} className={`p-2 rounded-md ${index % 2 === 0 ? "bg-gray-700" : "bg-gray-800"}`}>
                {msg}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              placeholder="Type a message..."
              className="flex-1 p-2 bg-neutral-800 text-white rounded-lg border border-gray-600"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={() => socket.emit("sendMessage", { roomId: roomCode, userName, message })} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg shadow-md">
              Send
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
