"use client"

import type React from "react"

import { useState } from "react"
import { Search, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube-api"

interface YouTubeSearchProps {
  onVideoSelect: (videoId: string) => void
}

export function YouTubeSearch({ onVideoSelect }: YouTubeSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const results = await searchYouTubeVideos(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for YouTube videos..."
          value={searchQuery}
          onChange={(e:any) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-neutral-800 border-gray-600 text-white placeholder:text-gray-400"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
          className="bg-red-600 hover:bg-red-700"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <div className="text-center text-gray-400">Searching videos...</div>}

      <div className="max-h-56 grid grid-cols-2 gap-3 overflow-y-auto scrollbar-thin">
        {searchResults.map((video) => (
          <Card key={video.id} className="bg-neutral-800 h-fit border-gray-700 hover:bg-neutral-700 transition-colors">
            <CardContent className="p-3">
              <div className="flex gap-3">
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="w-24 h-18 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{video.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{video.channelTitle}</p>
                  <Button
                    size="sm"
                    onClick={() => onVideoSelect(video.id)}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Play
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
