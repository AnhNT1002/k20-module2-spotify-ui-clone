
import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {ArrowLeft,Music2,Play,Pause,Disc3,UserRound,Clock3} from 'lucide-react'
import {getData} from '../services/api'
import {usePlayer} from '../context/PlayerContext'

// 1. Xử lý đường dẫn ảnh từ API
const getImage = src => {
  if(typeof src!=='string' || !src.trim() || src.includes('example.com')) return ''
  if(src.includes('/uploads/')) return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  if(/^https?:\/\//i.test(src)) return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

// 2. Đổi thời lượng từ giây sang phút:giây
const formatTime = value => {
  const s = Math.floor(Number(value)||0)
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
}

// 3. Chuẩn hóa bài hát cho PlayerContext
const normalizeTrack = data => {
  const t = data?.track ?? data
  return {
    ...t,
    track_id:t.id ?? t.track_id,
    track_title:t.title ?? t.track_title ?? t.name,
    track_image_url:t.image_url ?? t.track_image_url,
    track_audio_url:t.audio_url ?? t.track_audio_url,
    track_duration:t.duration ?? t.track_duration,
    artist_name:t.artist_name ?? t.artist?.name,
    album_title:t.album_title ?? t.album?.title ?? t.album?.name,
    artist_id:t.artist_id ?? t.artist?.id,
    album_id:t.album_id ?? t.album?.id
  }
}

function TrackDetail() {
  const {id} = useParams()
  const {track:currentTrack,playing,playTrack,togglePlay} = usePlayer()

  const [track,setTrack] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')

  // 4. Lấy thông tin bài hát theo ID
  useEffect(()=>{
    let active = true
    setLoading(true)
    setError('')
    setTrack(null)

    getData(`/api/tracks/${id}`)
      .then(res=>{
        if(!active) return
        const data = res?.data?.track ?? res?.track ?? res?.data ?? res
        setTrack(normalizeTrack(data))
      })
      .catch(err=>{
        console.error('Lỗi tải bài hát:',err)
        if(active) setError('Không tải được thông tin bài hát.')
      })
      .finally(()=>{if(active)setLoading(false)})

    return ()=>{active=false}
  },[id])

  // 5. Phát hoặc tạm dừng bài hát
  const active = track?.track_id && currentTrack?.track_id===track.track_id

  const handlePlay = () => {
    if(!track?.track_audio_url) return
    if(active) togglePlay()
    else playTrack([track],0)
  }

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="p-4 md:p-7">

        {/* 6. Quay lại trang danh sách bài hát */}
        <Link to="/section/tracks"
          className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6">
          <ArrowLeft size={20}/> Quay lại
        </Link>

        {loading && <p className="text-[#b3b3b3]">Đang tải bài hát...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && track && (
          <>
            {/* 7. Thông tin bài hát */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
              <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 bg-[#282828] rounded shadow-xl overflow-hidden relative">
                <Music2 size={65} className="absolute inset-0 m-auto text-[#777]"/>

                {getImage(track.track_image_url) && (
                  <img src={getImage(track.track_image_url)}
                    alt={track.track_title ?? 'Bài hát'}
                    className="relative w-full h-full object-cover"
                    onError={e=>{e.currentTarget.style.display='none'}}/>
                )}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-semibold mb-3">Bài hát</p>

                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 break-words">
                  {track.track_title ?? 'Chưa có tên'}
                </h1>

                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-sm">
                  {track.artist_id ? (
                    <Link to={`/artist/${track.artist_id}`}
                      className="font-semibold hover:underline">
                      {track.artist_name ?? 'Nghệ sĩ'}
                    </Link>
                  ) : (
                    <span className="font-semibold">{track.artist_name ?? 'Nghệ sĩ'}</span>
                  )}

                  <span className="text-[#b3b3b3]">•</span>
                  <span className="text-[#b3b3b3]">{formatTime(track.track_duration)}</span>
                </div>
              </div>
            </div>

            {/* 8. Nút phát nhạc */}
            <button onClick={handlePlay} disabled={!track.track_audio_url}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition mb-8
                ${track.track_audio_url?'bg-[#1ed760] text-black hover:scale-105':'bg-[#555] text-[#aaa] cursor-not-allowed'}`}
              aria-label={active && playing?'Tạm dừng':'Phát nhạc'}>
              {active && playing
                ? <Pause size={27} fill="currentColor"/>
                : <Play size={27} fill="currentColor"/>}
            </button>

            {/* 9. Thông tin chi tiết */}
            <h2 className="text-xl md:text-2xl font-bold mb-5">Thông tin bài hát</h2>

            <div className="max-w-2xl rounded-lg bg-[#1c1c1c] p-5 space-y-5">

              <div className="flex items-center gap-4">
                <UserRound size={22} className="text-[#b3b3b3] shrink-0"/>
                <div className="min-w-0">
                  <p className="text-xs text-[#b3b3b3] mb-1">Nghệ sĩ</p>
                  {track.artist_id ? (
                    <Link to={`/artist/${track.artist_id}`}
                      className="font-semibold hover:underline">
                      {track.artist_name ?? 'Chưa có thông tin'}
                    </Link>
                  ) : (
                    <p className="font-semibold">{track.artist_name ?? 'Chưa có thông tin'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Disc3 size={22} className="text-[#b3b3b3] shrink-0"/>
                <div className="min-w-0">
                  <p className="text-xs text-[#b3b3b3] mb-1">Album</p>
                  {track.album_id ? (
                    <Link to={`/album/${track.album_id}`}
                      className="font-semibold hover:underline">
                      {track.album_title ?? 'Chưa có thông tin'}
                    </Link>
                  ) : (
                    <p className="font-semibold">{track.album_title ?? 'Chưa có thông tin'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Clock3 size={22} className="text-[#b3b3b3] shrink-0"/>
                <div>
                  <p className="text-xs text-[#b3b3b3] mb-1">Thời lượng</p>
                  <p className="font-semibold">{formatTime(track.track_duration)}</p>
                </div>
              </div>

              {track.play_count!=null && (
                <div className="flex items-center gap-4">
                  <Play size={22} className="text-[#b3b3b3] shrink-0"/>
                  <div>
                    <p className="text-xs text-[#b3b3b3] mb-1">Lượt phát</p>
                    <p className="font-semibold">
                      {Number(track.play_count).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default TrackDetail
