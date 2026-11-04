
import {useEffect,useState} from 'react'
import {Link,useNavigate,useParams} from 'react-router-dom'
import {ArrowLeft,Clock3,Music2,Play,Pause,UserRound} from 'lucide-react'
import toast from 'react-hot-toast'
import {getData} from '../services/api'
import {usePlayer} from '../context/PlayerContext'
import {useAuth} from '../context/AuthContext'
import {followArtist,unfollowArtist,getFollowedArtists,getLibraryItems,refreshLibrary} from '../services/library.service'

// Xử lý đường dẫn ảnh
const getImage=src=>{
  if(typeof src!=='string'||!src.trim()||src.includes('example.com'))return ''
  if(src.includes('/uploads/'))return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  if(/^https?:\/\//i.test(src))return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

const formatTime=value=>{
  const s=Math.floor(Number(value)||0)
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
}

const normalizeTrack=t=>({
  ...t,
  track_id:t.track_id??t.id,
  track_title:t.track_title??t.title,
  track_image_url:t.track_image_url??t.image_url,
  track_audio_url:t.track_audio_url??t.audio_url,
  track_duration:t.track_duration??t.duration,
  artist_name:t.artist_name??t.artist?.name,
  album_title:t.album_title??t.album?.title
})

function ArtistDetail(){
  const {id}=useParams()
  const navigate=useNavigate()
  const {isLoggedIn,accessToken}=useAuth()
  const {track:currentTrack,playing,playTrack,togglePlay}=usePlayer()

  const [artist,setArtist]=useState(null)
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [following,setFollowing]=useState(false)
  const [checking,setChecking]=useState(false)
  const [saving,setSaving]=useState(false)

  // Lấy nghệ sĩ và bài hát
  useEffect(()=>{
    let active=true
    async function load(){
      setLoading(true)
      setError('')
      setArtist(null)
      setTracks([])
      try{
        const [artistRes,tracksRes]=await Promise.all([
          getData(`/api/artists/${id}`),
          getData('/api/tracks',{limit:20,offset:0})
        ])
        if(!active)return

        const detail=artistRes?.data?.artist??artistRes?.artist??artistRes?.data??artistRes
        const data=tracksRes?.data??tracksRes
        const list=data?.tracks?.items??data?.tracks??[]

        setArtist(detail)
        setTracks(Array.isArray(list)?
          list.filter(t=>String(t.artist_id)===String(id)).map(normalizeTrack):[])
      }catch(err){
        console.error(err)
        if(active)setError('Không tải được thông tin nghệ sĩ.')
      }finally{
        if(active)setLoading(false)
      }
    }
    load()
    return ()=>{active=false}
  },[id])

  // Kiểm tra nghệ sĩ đã Follow chưa
  useEffect(()=>{
    let active=true
    async function check(){
      setFollowing(false)
      if(!isLoggedIn||!accessToken)return
      setChecking(true)
      try{
        const res=await getFollowedArtists(accessToken)
        const list=getLibraryItems(res,'artists')
        const exists=list.some(row=>{
          const a=row.artist??row
          return String(a.id??a.artist_id)===String(id)
        })
        if(active)setFollowing(exists)
      }catch(err){
        console.error('Lỗi kiểm tra Follow:',err)
      }finally{
        if(active)setChecking(false)
      }
    }
    check()
    return ()=>{active=false}
  },[id,isLoggedIn,accessToken])

  // Follow hoặc Unfollow
  const handleFollow=async()=>{
    if(!isLoggedIn){
      toast.error('Vui lòng đăng nhập để theo dõi nghệ sĩ.')
      navigate('/login')
      return
    }
    setSaving(true)
    try{
      if(following)await unfollowArtist(id,accessToken)
      else await followArtist(id,accessToken)

      setFollowing(!following)
      refreshLibrary()
      toast.success(following?'Đã bỏ theo dõi nghệ sĩ.':'Đã theo dõi nghệ sĩ!')
    }catch(err){
      toast.error(err.response?.data?.message||'Không thể cập nhật theo dõi.')
    }finally{
      setSaving(false)
    }
  }

  const currentInArtist=tracks.some(t=>t.track_id===currentTrack?.track_id)

  const handlePlayArtist=()=>{
    if(!tracks.length)return
    if(currentInArtist)togglePlay()
    else playTrack(tracks,0)
  }

  const handlePlaySong=(song,i)=>{
    if(currentTrack?.track_id===song.track_id)togglePlay()
    else playTrack(tracks,i)
  }

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="p-4 md:p-7">
        <Link to="/section/artists"
          className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6">
          <ArrowLeft size={20}/> Quay lại
        </Link>

        {loading&&<p className="text-[#b3b3b3]">Đang tải nghệ sĩ...</p>}
        {error&&<p className="text-red-400">{error}</p>}

        {!loading&&!error&&artist&&(
          <>
            {/* Thông tin nghệ sĩ */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
              <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 bg-[#282828] rounded-full shadow-xl overflow-hidden relative">
                <UserRound size={70} className="absolute inset-0 m-auto text-[#777]"/>
                {getImage(artist.image_url??artist.avatar_url)&&(
                  <img src={getImage(artist.image_url??artist.avatar_url)}
                    alt={artist.name??'Nghệ sĩ'}
                    className="relative w-full h-full object-cover"
                    onError={e=>{e.currentTarget.style.display='none'}}/>
                )}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-semibold mb-3">Nghệ sĩ</p>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 break-words">
                  {artist.name??'Chưa có tên'}
                </h1>
                {artist.bio&&(
                  <p className="text-[#b3b3b3] text-sm mb-3 max-w-2xl">{artist.bio}</p>
                )}
                {artist.monthly_listeners!=null&&(
                  <p className="text-sm text-[#b3b3b3]">
                    {Number(artist.monthly_listeners).toLocaleString('vi-VN')} người nghe hàng tháng
                  </p>
                )}
              </div>
            </div>

            {/* Play và Follow */}
            <div className="flex items-center gap-5 mb-8">
              <button onClick={handlePlayArtist} disabled={!tracks.length}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  tracks.length?'bg-[#1ed760] text-black hover:scale-105':'bg-[#555] text-[#aaa] cursor-not-allowed'
                }`}>
                {currentInArtist&&playing?
                  <Pause size={27} fill="currentColor"/>:
                  <Play size={27} fill="currentColor"/>}
              </button>

              <button onClick={handleFollow} disabled={saving||checking}
                className="border border-[#727272] rounded-full px-5 py-2 text-sm font-bold hover:border-white hover:scale-105 transition disabled:opacity-50">
                {checking?'Đang kiểm tra...':saving?'Đang xử lý...':following?'Following':'Follow'}
              </button>
            </div>

            {/* Danh sách bài hát */}
            <h2 className="text-xl md:text-2xl font-bold mb-4">Phổ biến</h2>

            <div className="grid grid-cols-[30px_minmax(0,1fr)_65px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px] gap-3 px-3 py-3 text-sm text-[#b3b3b3] border-b border-[#333]">
              <span>#</span><span>Tiêu đề</span>
              <span className="hidden md:block">Album</span>
              <Clock3 size={17} className="justify-self-end"/>
            </div>

            {tracks.map((song,i)=>{
              const active=currentTrack?.track_id===song.track_id
              const image=getImage(song.track_image_url)
              return (
                <div key={song.track_id??i} onClick={()=>handlePlaySong(song,i)}
                  className="grid grid-cols-[30px_minmax(0,1fr)_65px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px] gap-3 items-center px-3 py-2 rounded hover:bg-[#ffffff18] cursor-pointer">
                  <span className={active?'text-[#1ed760]':'text-[#b3b3b3]'}>
                    {active&&playing?<Music2 size={17}/>:i+1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-[#282828] rounded relative overflow-hidden">
                      <Music2 size={22} className="absolute inset-0 m-auto text-[#777]"/>
                      {image&&<img src={image} alt="" className="relative w-full h-full object-cover"
                        onError={e=>{e.currentTarget.style.display='none'}}/>}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${active?'text-[#1ed760]':''}`}>
                        {song.track_title??'Chưa có tên'}
                      </p>
                      <p className="text-sm text-[#b3b3b3] truncate">
                        {song.artist_name??artist.name}
                      </p>
                    </div>
                  </div>

                  <span className="hidden md:block truncate text-sm text-[#b3b3b3]">
                    {song.album_title??'—'}
                  </span>
                  <span className="text-sm text-[#b3b3b3] text-right">
                    {formatTime(song.track_duration)}
                  </span>
                </div>
              )
            })}

            {!tracks.length&&(
              <p className="text-[#b3b3b3] py-6">
                Chưa tìm thấy bài hát của nghệ sĩ trong dữ liệu đã tải.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default ArtistDetail
