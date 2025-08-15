"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function HomePage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")
  const [userName, setUserName] = useState("")

  // Generate a random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase() // Example: "A1B2C3"
  }

  const createRoom = () => {
    if (!userName.trim()) {
      alert("Please enter your name before creating a room.")
      return
    }
    const newRoomCode = generateRoomCode()
    router.push(`/room/${newRoomCode}?user=${encodeURIComponent(userName)}`)
  }

  const joinRoom = () => {
    if (!roomCode.trim()) {
      alert("Please enter a valid room code.")
      return
    }
    if (!userName.trim()) {
      alert("Please enter your name before joining a room.")
      return
    }
    router.push(`/room/${roomCode}?user=${encodeURIComponent(userName)}`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <header className="text-center text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Multi-User YouTube Watch Party
      </header>

      <motion.div
        className="w-full max-w-4xl bg-neutral-900/50 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-neutral-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <input
          placeholder="Enter Your Name"
          className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </motion.div>

      <div className="flex flex-wrap gap-4 justify-center mt-6">
        <button onClick={createRoom} className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-300 shadow-md">
          Create Room
        </button>
        <input
          placeholder="Enter Room Code"
          className="w-64 p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button onClick={joinRoom} className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 shadow-md">
          Join Room
        </button>
      </div>

      <motion.div
        className="mt-10 max-w-3xl mx-auto bg-neutral-900/50 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-neutral-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          About This Platform
        </h2>
        <p className="mt-2 text-gray-400">
          Enjoy watching YouTube videos with friends in sync. Create a room, share the code, and experience seamless
          group viewing.
        </p>
      </motion.div>
    </div>
  )
}
