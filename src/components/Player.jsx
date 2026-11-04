
import {Pause,Play,Repeat2,Shuffle,SkipBack,SkipForward,Volume2,VolumeX,Music2} from 'lucide-react'
import {usePlayer} from '../context/PlayerContext'
import Tooltip from './Tooltip'

// 1. Chuyển giây sang phút:giây
const formatTime=value=>{
  const s=Math.floor(Number(value)||0)
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
}

// 2. Lấy ảnh bài hát từ API
const getImage=src=>{
  if(!src||src.includes('example.com'))return ''
  if(src.includes('/uploads/'))return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  return src
}

function Player(){
  const {
    track,playing,currentTime,duration,volume,shuffle,repeat,
    togglePlay,next,previous,seek,setVolume,setShuffle,setRepeat
  }=usePlayer()

  return (
    <footer className="h-[88px] shrink-0 bg-black px-3 md:px-4 flex items-center gap-3">

      {/* 3. Thông tin bài hát đang phát */}
      <div className="w-1/3 min-w-0 flex items-center gap-3">
        {track&&(
          <div className="w-12 h-12 shrink-0 bg-[#282828] rounded overflow-hidden relative hidden sm:block">
            <Music2 className="absolute inset-0 m-auto text-[#777]"/>
            {getImage(track.track_image_url)&&(
              <img src={getImage(track.track_image_url)} alt=""
                className="relative w-full h-full object-cover"
                onError={e=>{e.currentTarget.style.display='none'}}/>
            )}
          </div>
        )}

        <div className="min-w-0">
          <p className="font-semibold truncate text-sm">
            {track?.track_title??'Chưa phát bài hát'}
          </p>
          <p className="hidden sm:block text-xs text-[#b3b3b3] truncate">
            {track?.artist_name??'Spotify Clone'}
          </p>
        </div>
      </div>

      {/* 4. Các nút điều khiển */}
      <div className="w-1/3 flex flex-col items-center min-w-0">
        <div className="flex items-center gap-2 md:gap-5">

          {/* Phát ngẫu nhiên */}
          <div className="hidden md:block">
            <Tooltip text={shuffle?'Tắt phát ngẫu nhiên':'Bật phát ngẫu nhiên'} position="top">
              <button onClick={()=>setShuffle(!shuffle)}
                className={`${shuffle?'text-[#1ed760]':'text-[#b3b3b3]'} hover:text-white`}
                aria-label="Phát ngẫu nhiên" aria-pressed={shuffle}>
                <Shuffle size={18}/>
              </button>
            </Tooltip>
          </div>

          {/* Bài trước */}
          <Tooltip text="Bài trước" position="top">
            <button onClick={previous} disabled={!track}
              className="disabled:opacity-40 hover:text-[#1ed760]"
              aria-label="Bài trước">
              <SkipBack size={20}/>
            </button>
          </Tooltip>

          {/* Phát / Tạm dừng */}
          <Tooltip text={playing?'Tạm dừng':'Phát'} position="top">
            <button onClick={togglePlay} disabled={!track}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40 hover:scale-105 transition"
              aria-label={playing?'Tạm dừng':'Phát'}>
              {playing?<Pause size={19} fill="black"/>:<Play size={19} fill="black"/>}
            </button>
          </Tooltip>

          {/* Bài tiếp theo */}
          <Tooltip text="Bài tiếp theo" position="top">
            <button onClick={next} disabled={!track}
              className="disabled:opacity-40 hover:text-[#1ed760]"
              aria-label="Bài tiếp theo">
              <SkipForward size={20}/>
            </button>
          </Tooltip>

          {/* Lặp lại */}
          <div className="hidden md:block">
            <Tooltip text={repeat?'Tắt lặp lại':'Bật lặp lại'} position="top">
              <button onClick={()=>setRepeat(!repeat)}
                className={`${repeat?'text-[#1ed760]':'text-[#b3b3b3]'} hover:text-white`}
                aria-label="Lặp lại bài hát" aria-pressed={repeat}>
                <Repeat2 size={18}/>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 5. Thanh tiến trình và tua nhạc */}
        <div className="hidden sm:flex w-full items-center gap-2 mt-2 text-xs text-[#b3b3b3]">
          <span className="w-9 text-right">{formatTime(currentTime)}</span>

          <input type="range" min="0" max={duration||0} step="1"
            value={Math.min(currentTime,duration||0)}
            onChange={e=>seek(Number(e.target.value))}
            disabled={!track}
            aria-label="Tua bài hát"
            className="w-full min-w-0 h-1 accent-[#1ed760] cursor-pointer"/>

          <span className="w-9">{formatTime(duration||track?.track_duration)}</span>
        </div>
      </div>

      {/* 6. Điều chỉnh âm lượng */}
      <div className="w-1/3 flex justify-end items-center gap-2">

        <Tooltip text={volume===0?'Bật âm thanh':'Tắt âm thanh'} position="top">
          <button onClick={()=>setVolume(volume===0?0.7:0)}
            className="text-[#b3b3b3] hover:text-white"
            aria-label={volume===0?'Bật âm thanh':'Tắt âm thanh'}>
            {volume===0?<VolumeX size={20}/>:<Volume2 size={20}/>}
          </button>
        </Tooltip>

        <input type="range" min="0" max="1" step="0.01" value={volume}
          onChange={e=>setVolume(Number(e.target.value))}
          aria-label="Điều chỉnh âm lượng"
          className="hidden md:block w-20 lg:w-28 h-1 accent-[#1ed760] cursor-pointer"/>
      </div>
    </footer>
  )
}

export default Player
