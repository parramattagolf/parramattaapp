'use server'

export async function fetchYoutubePlaylist(playlistId: string) {
    try {
        const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
        if (!apiKey) {
            console.warn('YouTube API key not found in server action')
            return { items: [] }
        }

        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            const errBody = await response.text()
            console.error('YouTube API Error:', response.status, errBody)
            return { items: [] }
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Failed to fetch YouTube playlist:', error)
        return { items: [] }
    }
}
