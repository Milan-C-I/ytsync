"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { io } from "socket.io-client"
import YouTube, { type YouTubePlayer } from "react-youtube"
import { motion } from "framer-motion"
import { Users, MessageCircle, Video } from "lucide-react"
import { YouTubeSearch } from "@/components/youtube-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://youtube-watch-party-5z8o.onrender.com";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});


export default function RoomPage() {
  const { id: roomCode } = useParams()
  const searchParams = useSearchParams()
  const userName = searchParams.get("user") || "Guest"

  const [videoId, setVideoId] = useState("")
  const [message, setMessage] = useState("")
  const [chat, setChat] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const isReceivingSync = useRef(false)
  const lastSyncTime = useRef(0)

  const router = useRouter();

  useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
  }
}, [chat]);

  useEffect(() => {
    if (!roomCode) return

    console.log("[v0] Joining room:", roomCode, "as", userName)
    socket.emit("joinRoom", { roomId: roomCode, userName })

    socket.on("syncVideo", ({ newVideoId, time, playing, seekTime }) => {
      console.log("[v0] Received sync:", { newVideoId, time, playing, seekTime })

      isReceivingSync.current = true
      setIsSyncing(true)

      if (newVideoId && newVideoId !== videoId) {
        console.log("[v0] Changing video to:", newVideoId)
        setVideoId(newVideoId)
      }

      if (playerRef.current) {
        const targetTime = seekTime !== undefined ? seekTime : time || 0

        console.log("[v0] Seeking to time:", targetTime)
        playerRef.current.seekTo(targetTime, true)
        setCurrentTime(targetTime)
        lastSyncTime.current = targetTime

        setTimeout(() => {
          if (playing !== undefined) {
            if (playing) {
              console.log("[v0] Playing video")
              playerRef.current?.playVideo()
              setIsPlaying(true)
            } else {
              console.log("[v0] Pausing video")
              playerRef.current?.pauseVideo()
              setIsPlaying(false)
            }
          }
        }, 200)
      }

      setTimeout(() => {
        setIsSyncing(false)
        isReceivingSync.current = false
      }, 1000)
    })

    socket.on("userUpdate", ({ users }) => {
      console.log("[v0] User update:", users)
      setConnectedUsers(users)
    })

    socket.on("chatMessage", (msg) => {
      setChat((prevChat) => [...prevChat, msg])
    })

    return () => {
      socket.off("syncVideo")
      socket.off("userUpdate")
      socket.off("chatMessage")
    }
  }, [roomCode, userName, videoId])

  useEffect(() => {
    if (!playerRef.current || !videoId || isReceivingSync.current) return

    const interval = setInterval(() => {
      if (playerRef.current && !isReceivingSync.current) {
        const currentPlayerTime = playerRef.current.getCurrentTime()
        setCurrentTime(currentPlayerTime)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [videoId])

  const handleVideoSelect = (selectedVideoId: string) => {
    console.log("[v0] Selecting video:", selectedVideoId)
    setVideoId(selectedVideoId)
    setCurrentTime(0)
    lastSyncTime.current = 0

    socket.emit("syncVideo", {
      roomId: roomCode,
      videoId: selectedVideoId,
      time: 0,
      seekTime: 0,
      playing: true,
    })
  }

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target
    console.log("[v0] Player ready")
  }

  const onPlayerStateChange = (event: { target: YouTubePlayer; data: number }) => {
    if (!playerRef.current || isReceivingSync.current) {
      console.log("[v0] Ignoring state change - receiving sync")
      return
    }

    const currentPlayerTime = playerRef.current.getCurrentTime()
    console.log("[v0] Player state changed:", { state: event.data, time: currentPlayerTime })

    if (event.data === 1) {
      console.log("[v0] Emitting play sync")
      setIsPlaying(true)
      socket.emit("syncVideo", {
        roomId: roomCode,
        videoId,
        time: currentPlayerTime,
        seekTime: currentPlayerTime,
        playing: true,
      })
    } else if (event.data === 2) {
      console.log("[v0] Emitting pause sync")
      setIsPlaying(false)
      socket.emit("syncVideo", {
        roomId: roomCode,
        videoId,
        time: currentPlayerTime,
        seekTime: currentPlayerTime,
        playing: false,
      })
    }

    setCurrentTime(currentPlayerTime)
    lastSyncTime.current = currentPlayerTime
  }

  const sendMessage = () => {
    if (!message.trim()) return

    socket.emit("sendMessage", {
      roomId: roomCode,
      userName,
      message: message.trim(),
    })
    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }
  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
          <button
            onClick={handleGoHome}
            className="p-2 flex justify-center font-bold fixed left-2 top-4 bg-black text-white w-12 h-12 rounded-full hover:bg-gray-700 transition"
          >~_~
          </button>
      <div className="container mx-auto p-4">
        {/* Header */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Watch Party Room
          </h1>
          <p className="text-gray-400 mt-2">
            Welcome, <span className="text-blue-400 font-medium">{userName}</span>!
          </p>
          <div className="flex items-center justify-center gap-4 text-gray-300">
            <span className="text-lg">
              Room: <span className="font-mono text-red-400">{roomCode}</span>
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{connectedUsers.length} users</span>
            </div>
          </div>
          {/* {isSyncing && <p className="text-yellow-400 text-sm mt-1">🔄 Syncing with other users...</p>} */}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player Section */}
          <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-neutral-900/80 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white gap-2">
                  <Video className="w-5 h-5 text-red-500" />
                  Video Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {videoId && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <YouTube
                      videoId={videoId}
                      className="w-full h-full"
                      opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                          autoplay: 1,
                          controls: 1,
                          rel: 0,
                          showinfo: 0,
                          modestbranding: 1,
                        },
                      }}
                      onReady={onPlayerReady}
                      onStateChange={onPlayerStateChange}
                      // onProgress={onPlayerProgress}
                    />
                  </div>
                )}

                <Tabs defaultValue="search" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-neutral-800 p-0">
                    <TabsTrigger value="search">Search Videos</TabsTrigger>
                    <TabsTrigger value="direct">Direct ID</TabsTrigger>
                  </TabsList>

                  <TabsContent value="search" className="space-y-4">
                    <YouTubeSearch onVideoSelect={handleVideoSelect} />
                  </TabsContent>

                  <TabsContent value="direct" className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter YouTube Video ID"
                        className="bg-neutral-800 border-gray-600 text-white placeholder:text-gray-400"
                        onChange={(e) => handleVideoSelect(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Section */}
          <motion.div className="lg:col-span-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-neutral-900/80 border-gray-700 h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-white gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Chat ({connectedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Connected Users:</h4>
                  <div className="flex flex-wrap gap-1">
                    {connectedUsers.map((user, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs">
                        {user}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  ref={messagesEndRef}
                  className="flex-1 overflow-y-auto max-h-40 lg:max-h-96 bg-neutral-800/50 p-3 rounded-lg space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
                  {chat.length === 0 ? (
                    <p className="text-gray-400 text-center text-sm">No messages yet...</p>
                  ) : (
                    chat.map((msg, index) => (
                      
                      <div key={index} className="p-2 rounded-md text-blue-500 font-bold bg-black/50 text-sm break-words">
                        {msg.slice(0,msg.indexOf(":")+1)} <span className="text-white font-thin">{msg.slice(msg.indexOf(":")+1)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1 bg-neutral-800 border-gray-600 text-white placeholder:text-gray-400"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700" disabled={!message.trim()}>
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
