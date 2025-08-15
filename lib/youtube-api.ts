export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration?: string
}

export interface YouTubeSearchResponse {
  items: {
    id: {
      videoId: string
    }
    snippet: {
      title: string
      thumbnails: {
        medium: {
          url: string
        }
      }
      channelTitle: string
      publishedAt: string
    }
  }[]
}

export async function searchYouTubeVideos(query: string, maxResults = 10): Promise<YouTubeVideo[]> {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY
    if (!API_KEY) {
      throw new Error("YouTube API key not found")
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query,
      )}&type=video&maxResults=${maxResults}&key=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch YouTube videos")
    }

    const data: YouTubeSearchResponse = await response.json()

    return data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }))
  } catch (error) {
    console.error("Error searching YouTube videos:", error)
    return []
  }
}
