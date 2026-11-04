
import {useEffect,useState} from 'react'
import {Link,useNavigate,useParams} from 'react-router-dom'
import {ArrowLeft,Clock3,Music2,Play,Pause,Check,Plus} from 'lucide-react'
import toast from 'react-hot-toast'
import {getData} from '../services/api'
import {usePlayer} from '../context/PlayerContext'
import {useAuth} from '../context/AuthContext'
import {likeAlbum,unlikeAlbum,getLikedAlbums,getLibraryItems,refreshLibrary} from '../services/library.service'

// Xử lý ảnh
const getUrl=src=>{
  if(typeof src!=='string'||!src.trim()||src.includes('example.com'))return ''
  if(src.includes('/uploads/'))return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  if(/^https?:\/\//i.test(src))return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

const formatTime=value=>{
  const s=Math.floor(Number(value)||0)
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
}

// Chuẩn hóa dữ liệu bài hát
const normalizeTrack=row=>{
  const t=row.track??row
  return {
    ...t,
    track_id:t.track_id??t.id,
    track_title:t.track_title??t.title??t.name,
    track_image_url:t.track_image_url??t.image_url??t.album_cover_image_url,
    track_audio_url:t.track_audio_url??t.audio_url,
    track_duration:t.track_duration??t.duration,
    artist_name:t.artist_name??t.artist?.name??t.artists?.[0]?.name,
    album_title:t.album_title??t.album?.title??t.album?.name
  }
}

const getTracks=res=>{
  const data=res?.data??res
  const list=data?.tracks?.items??data?.tracks??data?.items??[]
  return Array.isArray(list)?list.map(normalizeTrack):[]
}

function AlbumDetail(){
  const {id}=useParams()
  const navigate=useNavigate()
  const {isLoggedIn,accessToken}=useAuth()
  const {track:currentTrack,playing,playTrack,togglePlay}=usePlayer()

  const [album,setAlbum]=useState(null)
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [liked,setLiked]=useState(false)
  const [checking,setChecking]=useState(false)
  const [saving,setSaving]=useState(false)

  // Lấy thông tin Album và bài hát
  useEffect(()=>{
    let active=true
    async function load(){
      setLoading(true)
      setError('')
      setAlbum(null)
      setTracks([])
      try{
        const res=await getData(`/api/albums/${id}`)
        const detail=res?.data?.album??res?.album??res?.data??res
        let list=getTracks(detail)

        if(!list.length){
          try{
            const trackRes=await getData(`/api/albums/${id}/tracks`,{limit:20,offset:0})
            list=getTracks(trackRes)
          }catch(err){
            console.warn('Chưa lấy được bài hát Album:',err)
          }
        }

        if(!active)return
        setAlbum(detail)
        setTracks(list)
      }catch(err){
        console.error(err)
        if(active)setError('Không tải được thông tin Album.')
      }finally{
        if(active)setLoading(false)
      }
    }
    load()
    return ()=>{active=false}
  },[id])

  // Kiểm tra Album đã lưu chưa
  useEffect(()=>{
    let active=true
    async function check(){
      setLiked(false)
      if(!isLoggedIn||!accessToken)return
      setChecking(true)
      try{
        const res=await getLikedAlbums(accessToken)
        const list=getLibraryItems(res,'albums')
        const exists=list.some(row=>{
          const a=row.album??row
          return String(a.id??a.album_id)===String(id)
        })
        if(active)setLiked(exists)
      }catch(err){
        console.error('Lỗi kiểm tra Album:',err)
      }finally{
        if(active)setChecking(false)
      }
    }
    check()
    return ()=>{active=false}
  },[id,isLoggedIn,accessToken])

  // Like hoặc Unlike Album
  const handleLike=async()=>{
    if(!isLoggedIn){
      toast.error('Vui lòng đăng nhập để lưu Album.')
      navigate('/login')
      return
    }
    setSaving(true)
    try{
      if(liked)await unlikeAlbum(id,accessToken)
      else await likeAlbum(id,accessToken)

      setLiked(!liked)
      refreshLibrary()
      toast.success(liked?'Đã bỏ lưu Album.':'Đã lưu Album vào thư viện!')
    }catch(err){
      toast.error(err.response?.data?.message||'Không thể cập nhật Album.')
    }finally{
      setSaving(false)
    }
  }

  const currentInAlbum=tracks.some(t=>t.track_id===currentTrack?.track_id)

  const handlePlayAlbum=()=>{
    if(!tracks.length)return
    if(currentInAlbum)togglePlay()
    else playTrack(tracks,0)
  }

  const handlePlaySong=(song,i)=>{
    if(currentTrack?.track_id===song.track_id)togglePlay()
    else playTrack(tracks,i)
  }

  const cover=getUrl(album?.cover_image_url??album?.image_url)

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="p-4 md:p-7">
        <Link to="/section/albums"
          className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6">
          <ArrowLeft size={20}/> Quay lại
        </Link>

        {loading&&<p className="text-[#b3b3b3]">Đang tải Album...</p>}
        {error&&<p className="text-red-400">{error}</p>}

        {!loading&&!error&&album&&(
          <>
            {/* Thông tin Album */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
              <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 bg-[#282828] rounded shadow-xl overflow-hidden relative">
                <Music2 size={65} className="absolute inset-0 m-auto text-[#777]"/>
                {cover&&<img src={cover} alt={album.title??album.name??'Album'}
                  className="relative w-full h-full object-cover"
                  onError={e=>{e.currentTarget.style.display='none'}}/>}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-semibold mb-3">Album</p>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 break-words">
                  {album.title??album.name??'Chưa có tên'}
                </h1>
                <p className="text-[#b3b3b3] mb-3">
                  {album.artist_name??album.artist?.name??album.artists?.[0]?.name??'Nghệ sĩ'}
                </p>
                <p className="text-sm text-[#b3b3b3]">
                  {tracks.length} bài hát
                </p>
              </div>
            </div>

            {/* Phát nhạc và lưu Album */}
            <div className="flex items-center gap-5 mb-8">
              <button onClick={handlePlayAlbum} disabled={!tracks.length}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  tracks.length?'bg-[#1ed760] text-black hover:scale-105':'bg-[#555] text-[#aaa] cursor-not-allowed'
                }`}>
                {currentInAlbum&&playing?
                  <Pause size={27} fill="currentColor"/>:
                  <Play size={27} fill="currentColor"/>}
              </button>

              <button onClick={handleLike} disabled={saving||checking}
                title={liked?'Bỏ lưu Album':'Lưu Album vào thư viện'}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110 disabled:opacity-50 ${
                  liked?'bg-[#1ed760] text-black':'border-2 border-[#b3b3b3] text-[#b3b3b3] hover:border-white hover:text-white'
                }`}>
                {liked?<Check size={22}/>:<Plus size={22}/>}
              </button>
              <span className="text-sm text-[#b3b3b3]">
                {checking?'Đang kiểm tra...':saving?'Đang xử lý...':liked?'Đã lưu vào thư viện':'Lưu vào thư viện'}
              </span>
            </div>

            {/* Danh sách bài hát */}
            <div className="grid grid-cols-[30px_minmax(0,1fr)_65px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px] gap-3 px-3 py-3 text-sm text-[#b3b3b3] border-b border-[#333]">
              <span>#</span><span>Tiêu đề</span>
              <span className="hidden md:block">Album</span>
              <Clock3 size={17} className="justify-self-end"/>
            </div>

            {tracks.map((song,i)=>{
              const active=currentTrack?.track_id===song.track_id
              const image=getUrl(song.track_image_url??album.cover_image_url)
              return (
                <div key={song.track_id??i} onClick={()=>handlePlaySong(song,i)}
                  className="grid grid-cols-[30px_minmax(0,1fr)_65px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px] gap-3 items-center px-3 py-2 rounded hover:bg-[#ffffff18] cursor-pointer">
                  <span className={active?'text-[#1ed760]':'text-[#b3b3b3]'}>
                    {active&&playing?<Music2 size={17}/>:i+1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded bg-[#282828] relative overflow-hidden">
                      <Music2 size={22} className="absolute inset-0 m-auto text-[#777]"/>
                      {image&&<img src={image} alt="" className="relative w-full h-full object-cover"
                        onError={e=>{e.currentTarget.style.display='none'}}/>}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${active?'text-[#1ed760]':''}`}>
                        {song.track_title??'Chưa có tên'}
                      </p>
                      <p className="text-sm text-[#b3b3b3] truncate">
                        {song.artist_name??album.artist_name??'Nghệ sĩ'}
                      </p>
                    </div>
                  </div>

                  <span className="hidden md:block truncate text-sm text-[#b3b3b3]">
                    {song.album_title??album.title??album.name??'—'}
                  </span>
                  <span className="text-sm text-[#b3b3b3] text-right">
                    {formatTime(song.track_duration)}
                  </span>
                </div>
              )
            })}

            {!tracks.length&&(
              <p className="text-[#b3b3b3] py-6">Chưa có danh sách bài hát để hiển thị.</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default AlbumDetail
