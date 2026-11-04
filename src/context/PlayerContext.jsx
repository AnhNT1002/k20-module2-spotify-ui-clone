
import {createContext,useContext,useEffect,useRef,useState} from 'react'

const PlayerContext = createContext(null)

// Chuẩn hóa đường dẫn audio và ảnh từ API
const getUrl = src => {
  if(!src || typeof src!=='string') return ''
  if(src.includes('/uploads/')) return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  return /^https?:\/\//i.test(src) ? src : `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

export function PlayerProvider({children}) {
  const audioRef = useRef(null)
  const [queue,setQueue] = useState([])
  const [index,setIndex] = useState(-1)
  const [playing,setPlaying] = useState(false)
  const [currentTime,setCurrentTime] = useState(0)
  const [duration,setDuration] = useState(0)
  const [volume,setVolume] = useState(0.7)
  const [shuffle,setShuffle] = useState(false)
  const [repeat,setRepeat] = useState(false)

  const track = queue[index] ?? null

  // Chọn một bài hát trong danh sách phát
  const playTrack = (tracks,i=0) => {
    if(!tracks?.length || !tracks[i]) return
    setQueue(tracks)
    setIndex(i)
    setPlaying(true)
  }

  // Phát hoặc tạm dừng bài hát hiện tại
  const togglePlay = () => {
    if(!track) return
    setPlaying(p=>!p)
  }

  // Chuyển bài tiếp theo hoặc bài trước đó
  const next = () => {
    if(!queue.length) return
    setIndex(i=>{
      if(shuffle && queue.length>1) {
        const choices = queue.map((_,n)=>n).filter(n=>n!==i)
        return choices[Math.floor(Math.random()*choices.length)]
      }
      return (i+1)%queue.length
    })
    setPlaying(true)
  }

  const previous = () => {
    if(!queue.length) return
    if(audioRef.current?.currentTime>3) {
      audioRef.current.currentTime = 0
      return
    }
    setIndex(i=>(i-1+queue.length)%queue.length)
    setPlaying(true)
  }

  // Đồng bộ âm lượng
  useEffect(()=>{
    if(audioRef.current) audioRef.current.volume = volume
  },[volume])

  // Tự phát khi đổi bài, tạm dừng khi bấm Pause
  useEffect(()=>{
    const audio = audioRef.current
    if(!audio) return
    if(playing && track?.track_audio_url) {
      audio.play().catch(err=>{
        console.error('Không phát được nhạc:',err)
        setPlaying(false)
      })
    } else audio.pause()
  },[track,playing])

  // Tua đến vị trí được chọn trên thanh tiến trình
  const seek = time => {
    if(!audioRef.current || !Number.isFinite(duration)) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  return (
    <PlayerContext.Provider value={{
      track,queue,index,playing,currentTime,duration,volume,shuffle,repeat,
      playTrack,togglePlay,next,previous,seek,setVolume,setShuffle,setRepeat
    }}>
      {children}

      {/* Một thẻ audio dùng chung cho toàn bộ ứng dụng */}
      <audio ref={audioRef}
        src={getUrl(track?.track_audio_url)}
        onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e=>{
          setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)
          setCurrentTime(0)
        }}
        onEnded={()=>{
          if(repeat && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(console.error)
          } else next()
        }}
        onError={()=>{if(track) setPlaying(false)}}
      />
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
