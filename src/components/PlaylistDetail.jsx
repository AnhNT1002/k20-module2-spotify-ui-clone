
import {useCallback,useEffect,useRef,useState} from 'react'
import {Link,useNavigate,useParams} from 'react-router-dom'
import {ArrowLeft,Clock3,Music2,Play,Pause,Ellipsis,Pencil,Search,Plus,Trash2,X,Lock,Globe2} from 'lucide-react'
import toast from 'react-hot-toast'
import {getData} from '../services/api'
import {usePlayer} from '../context/PlayerContext'
import {useAuth} from '../context/AuthContext'
import {updatePlaylist,deletePlaylist,addPlaylistTrack,removePlaylistTrack,uploadPlaylistCover} from '../services/playlist.service'

// Chuẩn hóa ảnh
const getImage=src=>{
  if(typeof src!=='string'||!src.trim()||src.includes('example.com')) return ''
  if(src.includes('/uploads/')) return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  if(/^https?:\/\//i.test(src)) return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

const formatTime=value=>{
  const seconds=Math.floor(Number(value)||0)
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`
}

const getItems=data=>{
  if(Array.isArray(data)) return data
  const d=data?.data??data
  if(Array.isArray(d)) return d
  for(const key of ['tracks','items','results']){
    if(Array.isArray(d?.[key])) return d[key]
    if(Array.isArray(d?.[key]?.items)) return d[key].items
  }
  return []
}

const getTrackId=t=>t.track_id||t.track?.id||t.id
const getTrackName=t=>t.track_title||t.track?.title||t.title||'Chưa có tên'
const getArtistName=t=>t.artist_name||t.track?.artist_name||t.artist?.name||'Nghệ sĩ'
const getTrackImage=t=>getImage(t.track_image_url||t.track?.image_url||t.image_url)

// Thông báo Sidebar lấy lại dữ liệu
const notifyLibrary=()=>window.dispatchEvent(new Event('spotify-library-updated'))

function PlaylistDetail(){
  const {id}=useParams()
  const navigate=useNavigate()
  const {user,accessToken,isLoggedIn}=useAuth()
  const {track:currentTrack,playing,playTrack,togglePlay}=usePlayer()

  const [playlist,setPlaylist]=useState(null)
  const [tracks,setTracks]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [menuOpen,setMenuOpen]=useState(false)
  const [editOpen,setEditOpen]=useState(false)
  const [deleteOpen,setDeleteOpen]=useState(false)
  const [saving,setSaving]=useState(false)
  const [busyId,setBusyId]=useState('')
  const [form,setForm]=useState({name:'',description:''})
  const [coverFile,setCoverFile]=useState(null)
  const [coverPreview,setCoverPreview]=useState('')
  const [query,setQuery]=useState('')
  const [results,setResults]=useState([])
  const [searching,setSearching]=useState(false)
  const fileRef=useRef(null)

  // Kiểm tra Playlist thuộc tài khoản hiện tại
  const ownerId=playlist?.user_id||playlist?.owner_id||playlist?.user?.id||playlist?.owner?.id
  const isOwner=!!(isLoggedIn&&user?.id&&ownerId&&String(user.id)===String(ownerId))

  // Tải chi tiết và bài hát
  const loadPlaylist=useCallback(async()=>{
    const [detailRes,tracksRes]=await Promise.all([
      getData(`/api/playlists/${id}`),
      getData(`/api/playlists/${id}/tracks`,{limit:20,offset:0})
    ])
    const detail=detailRes?.data?.playlist??detailRes?.playlist??detailRes?.data??detailRes
    setPlaylist(detail)
    setTracks(getItems(tracksRes))
  },[id])

  useEffect(()=>{
    let active=true
    async function load(){
      setLoading(true)
      setError('')
      try{
        const [detailRes,tracksRes]=await Promise.all([
          getData(`/api/playlists/${id}`),
          getData(`/api/playlists/${id}/tracks`,{limit:20,offset:0})
        ])
        if(!active)return
        setPlaylist(detailRes?.data?.playlist??detailRes?.playlist??detailRes?.data??detailRes)
        setTracks(getItems(tracksRes))
      }catch(err){
        if(active)setError(err.response?.data?.message||'Không tải được Playlist.')
      }finally{
        if(active)setLoading(false)
      }
    }
    load()
    return ()=>{active=false}
  },[id])

  // Tìm bài hát trên server, debounce 400ms
  useEffect(()=>{
    if(!isOwner||!query.trim()){
      setResults([])
      setSearching(false)
      return
    }
    let active=true
    const timer=setTimeout(async()=>{
      setSearching(true)
      try{
        const data=await getData('/api/search',{
          q:query.trim(),type:'track',limit:20,offset:0
        })
        if(active){
          const d=data?.data??data
          const list=d?.tracks?.items??d?.tracks??d?.results?.tracks??getItems(data)
          setResults(Array.isArray(list)?list:[])
        }
      }catch(err){
        if(active){
          setResults([])
          console.error('Lỗi tìm bài hát:',err)
        }
      }finally{
        if(active)setSearching(false)
      }
    },400)
    return ()=>{active=false;clearTimeout(timer)}
  },[query,isOwner])

  // Mở modal sửa
  const openEdit=()=>{
    setForm({name:playlist.name||'',description:playlist.description||''})
    setCoverFile(null)
    setCoverPreview('')
    setMenuOpen(false)
    setEditOpen(true)
  }

  const chooseCover=file=>{
    if(!file)return
    if(!file.type.startsWith('image/')){
      toast.error('Vui lòng chọn file ảnh.')
      return
    }
    if(file.size>5*1024*1024){
      toast.error('Ảnh không được vượt quá 5 MB.')
      return
    }
    if(coverPreview)URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  // Lưu tên, mô tả và ảnh
  const handleSave=async e=>{
    e.preventDefault()
    if(!form.name.trim())return toast.error('Bạn chưa nhập tên Playlist.')
    setSaving(true)
    try{
      let imageUrl=playlist.image_url||playlist.cover_image_url||''

      if(coverFile){
        const upload=await uploadPlaylistCover(id,coverFile,accessToken)
        const d=upload?.data??upload
        imageUrl=d?.path||d?.image_url||d?.url||d?.file_path||d?.file?.path||''
        if(!imageUrl)throw new Error('Upload thành công nhưng chưa xác định được đường dẫn ảnh.')
      }

      const body={
        name:form.name.trim(),
        description:form.description.trim()
      }
      if(coverFile)body.image_url=imageUrl

      await updatePlaylist(id,body,accessToken)
      await loadPlaylist()
      notifyLibrary()
      setEditOpen(false)
      toast.success('Đã cập nhật Playlist!')
    }catch(err){
      toast.error(err.response?.data?.message||err.message||'Không thể cập nhật Playlist.')
    }finally{
      setSaving(false)
    }
  }

  // Đổi công khai / riêng tư
  const togglePrivacy=async()=>{
    setMenuOpen(false)
    setSaving(true)
    try{
      await updatePlaylist(id,{is_public:!playlist.is_public},accessToken)
      await loadPlaylist()
      notifyLibrary()
      toast.success('Đã thay đổi trạng thái Playlist!')
    }catch(err){
      toast.error(err.response?.data?.message||'Không thể thay đổi trạng thái.')
    }finally{
      setSaving(false)
    }
  }

  // Xóa Playlist
  const handleDelete=async()=>{
    setSaving(true)
    try{
      await deletePlaylist(id,accessToken)
      notifyLibrary()
      toast.success('Đã xóa Playlist!')
      navigate('/')
    }catch(err){
      toast.error(err.response?.data?.message||'Không thể xóa Playlist.')
      setSaving(false)
    }
  }

  // Thêm bài hát
  const handleAddTrack=async song=>{
    const trackId=getTrackId(song)
    if(!trackId)return toast.error('Không tìm thấy ID bài hát.')
    setBusyId(String(trackId))
    try{
      await addPlaylistTrack(id,trackId,accessToken)
      await loadPlaylist()
      toast.success('Đã thêm bài hát!')
    }catch(err){
      toast.error(err.response?.data?.message||'Không thể thêm bài hát.')
    }finally{
      setBusyId('')
    }
  }

  // Xóa bài hát
  const handleRemoveTrack=async song=>{
    const trackId=getTrackId(song)
    if(!trackId)return
    setBusyId(String(trackId))
    try{
      await removePlaylistTrack(id,trackId,accessToken)
      await loadPlaylist()
      toast.success('Đã xóa bài hát khỏi Playlist.')
    }catch(err){
      toast.error(err.response?.data?.message||'Không thể xóa bài hát.')
    }finally{
      setBusyId('')
    }
  }

  const currentInPlaylist=tracks.some(t=>getTrackId(t)===getTrackId(currentTrack||{}))
  const handlePlayPlaylist=()=>{
    if(!tracks.length)return
    if(currentInPlaylist)togglePlay()
    else playTrack(tracks,0)
  }
  const handlePlaySong=(song,index)=>{
    if(getTrackId(currentTrack||{})===getTrackId(song))togglePlay()
    else playTrack(tracks,index)
  }

  const totalDuration=tracks.reduce((sum,t)=>sum+Number(t.track_duration||t.duration||0),0)
  const playlistImage=getImage(playlist?.image_url||playlist?.cover_image_url)

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="p-4 md:p-7">
        <Link to="/" className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6">
          <ArrowLeft size={20}/> Quay lại
        </Link>

        {loading&&<p className="text-[#b3b3b3]">Đang tải Playlist...</p>}
        {error&&<p className="text-red-400">{error}</p>}

        {!loading&&!error&&playlist&&(
          <>
            {/* Thông tin Playlist */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
              <button type="button" disabled={!isOwner}
                onClick={openEdit}
                className={`group relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 bg-[#282828] rounded shadow-xl overflow-hidden ${isOwner?'cursor-pointer':''}`}>
                <Music2 size={65} className="absolute inset-0 m-auto text-[#777]"/>
                {playlistImage&&<img src={playlistImage} alt={playlist.name}
                  className="relative w-full h-full object-cover"
                  onError={e=>{e.currentTarget.style.display='none'}}/>}
                {isOwner&&<div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition">
                  <Pencil size={30}/><span className="text-sm font-bold">Chọn ảnh</span>
                </div>}
              </button>

              <div className="min-w-0 text-center sm:text-left">
                <p className="text-sm font-semibold mb-3">
                  {playlist.is_public?'Danh sách phát công khai':'Danh sách phát riêng tư'}
                </p>
                {isOwner?(
                  <button onClick={openEdit} className="text-left hover:underline">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 break-words">{playlist.name||'Playlist'}</h1>
                  </button>
                ):(
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-4 break-words">{playlist.name||'Playlist'}</h1>
                )}
                {playlist.description&&<p className="text-[#b3b3b3] text-sm mb-3">{playlist.description}</p>}
                <p className="text-sm font-semibold">
                  {tracks.length} bài hát · {formatTime(totalDuration)}
                </p>
              </div>
            </div>

            {/* Thanh chức năng */}
            <div className="flex items-center gap-5 mb-8">
              <button onClick={handlePlayPlaylist} disabled={!tracks.length}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                  tracks.length?'bg-[#1ed760] text-black hover:scale-105':'bg-[#555] text-[#aaa] cursor-not-allowed'
                }`}>
                {currentInPlaylist&&playing?<Pause size={27} fill="currentColor"/>:<Play size={27} fill="currentColor"/>}
              </button>

              {isOwner&&(
                <div className="relative">
                  <button onClick={()=>setMenuOpen(!menuOpen)} title="Tùy chọn Playlist"
                    className="p-2 text-[#b3b3b3] hover:text-white">
                    <Ellipsis size={30}/>
                  </button>

                  {menuOpen&&(
                    <>
                      <button aria-label="Đóng menu" onClick={()=>setMenuOpen(false)}
                        className="fixed inset-0 z-30 cursor-default"/>
                      <div className="absolute top-full left-0 z-40 w-56 bg-[#282828] shadow-2xl rounded-md p-1">
                        <button onClick={openEdit} className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-[#3e3e3e] rounded">
                          <Pencil size={17}/> Sửa thông tin chi tiết
                        </button>
                        <button onClick={togglePrivacy} disabled={saving}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-[#3e3e3e] rounded">
                          {playlist.is_public?<Lock size={17}/>:<Globe2 size={17}/>}
                          {playlist.is_public?'Đặt thành riêng tư':'Đặt thành công khai'}
                        </button>
                        <button onClick={()=>{setMenuOpen(false);setDeleteOpen(true)}}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-[#3e3e3e] rounded text-red-400">
                          <Trash2 size={17}/> Xóa Playlist
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Danh sách bài hát */}
            <div className="w-full">
              <div className={`grid ${isOwner?'grid-cols-[30px_minmax(0,1fr)_65px_34px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px_34px]':'grid-cols-[30px_minmax(0,1fr)_65px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px]'} gap-3 px-3 py-3 text-sm text-[#b3b3b3] border-b border-[#333]`}>
                <span>#</span><span>Tiêu đề</span>
                <span className="hidden md:block">Album</span>
                <Clock3 size={17} className="justify-self-end"/>
                {isOwner&&<span/>}
              </div>

              {tracks.map((song,i)=>{
                const trackId=getTrackId(song)
                const active=trackId===getTrackId(currentTrack||{})
                const image=getTrackImage(song)

                return (
                  <div key={`${trackId}-${i}`}
                    className={`grid ${isOwner?'grid-cols-[30px_minmax(0,1fr)_65px_34px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px_34px]':'grid-cols-[30px_minmax(0,1fr)_65px] md:grid-cols-[40px_minmax(0,1fr)_180px_80px]'} gap-3 items-center px-3 py-2 rounded hover:bg-[#ffffff18]`}>
                    <span className={active?'text-[#1ed760]':'text-[#b3b3b3]'}>
                      {active&&playing?<Music2 size={17}/>:i+1}
                    </span>

                    <button onClick={()=>handlePlaySong(song,i)}
                      className="flex items-center gap-3 min-w-0 text-left">
                      <div className="w-10 h-10 bg-[#282828] rounded shrink-0 overflow-hidden relative">
                        <Music2 size={22} className="absolute inset-0 m-auto text-[#777]"/>
                        {image&&<img src={image} alt="" className="relative w-full h-full object-cover"
                          onError={e=>{e.currentTarget.style.display='none'}}/>}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold truncate ${active?'text-[#1ed760]':''}`}>{getTrackName(song)}</p>
                        <p className="text-sm text-[#b3b3b3] truncate">{getArtistName(song)}</p>
                      </div>
                    </button>

                    <span className="hidden md:block truncate text-sm text-[#b3b3b3]">
                      {song.album_title||song.album?.title||'—'}
                    </span>
                    <span className="text-sm text-[#b3b3b3] text-right">
                      {formatTime(song.track_duration||song.duration)}
                    </span>

                    {isOwner&&(
                      <button onClick={()=>handleRemoveTrack(song)} disabled={busyId===String(trackId)}
                        title="Xóa khỏi Playlist"
                        className="text-[#b3b3b3] hover:text-red-400 disabled:opacity-40">
                        <X size={18}/>
                      </button>
                    )}
                  </div>
                )
              })}

              {!tracks.length&&<p className="text-[#b3b3b3] py-6">Playlist chưa có bài hát.</p>}
            </div>

            {/* Tìm bài hát để thêm */}
            {isOwner&&(
              <section className="mt-10 border-t border-[#333] pt-6">
                <h2 className="text-xl font-bold mb-4">Hãy cùng tìm nội dung cho danh sách phát của bạn</h2>
                <div className="relative max-w-lg">
                  <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]"/>
                  <input value={query} onChange={e=>setQuery(e.target.value)}
                    placeholder="Tìm bài hát hoặc nghệ sĩ"
                    className="w-full bg-[#282828] rounded-md py-3 pl-10 pr-10 outline-none focus:ring-1 focus:ring-white text-sm"/>
                  {query&&<button onClick={()=>setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={17}/></button>}
                </div>

                {searching&&<p className="text-sm text-[#b3b3b3] mt-4">Đang tìm kiếm...</p>}

                <div className="mt-4 space-y-1">
                  {results.map((song,i)=>{
                    const trackId=getTrackId(song)
                    const exists=tracks.some(t=>getTrackId(t)===trackId)
                    const image=getTrackImage(song)
                    return (
                      <div key={`${trackId}-${i}`} className="flex items-center gap-3 p-2 hover:bg-[#242424] rounded-md">
                        <div className="w-11 h-11 bg-[#282828] rounded shrink-0 overflow-hidden flex items-center justify-center">
                          {image?<img src={image} alt="" className="w-full h-full object-cover"/>:<Music2 className="text-[#777]"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{getTrackName(song)}</p>
                          <p className="text-xs text-[#b3b3b3] truncate">{getArtistName(song)}</p>
                        </div>
                        <button onClick={()=>handleAddTrack(song)}
                          disabled={exists||busyId===String(trackId)}
                          className="px-4 py-1.5 border border-[#727272] rounded-full text-sm font-bold hover:border-white disabled:opacity-40">
                          {exists?'Đã thêm':busyId===String(trackId)?'Đang thêm':'Thêm'}
                        </button>
                      </div>
                    )
                  })}
                  {!searching&&query.trim()&&!results.length&&(
                    <p className="text-sm text-[#b3b3b3] py-3">Không tìm thấy bài hát phù hợp.</p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Modal chỉnh sửa */}
      {editOpen&&(
        <div className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-4"
          onClick={()=>!saving&&setEditOpen(false)}>
          <form onSubmit={handleSave} onClick={e=>e.stopPropagation()}
            className="bg-[#282828] rounded-lg p-6 w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Sửa thông tin chi tiết</h2>
              <button type="button" onClick={()=>setEditOpen(false)} disabled={saving}><X size={22}/></button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <button type="button" onClick={()=>fileRef.current?.click()}
                className="w-44 h-44 shrink-0 bg-[#333] rounded flex items-center justify-center overflow-hidden relative">
                {coverPreview||playlistImage?
                  <img src={coverPreview||playlistImage} alt="Ảnh bìa" className="w-full h-full object-cover"/>:
                  <Music2 size={55} className="text-[#999]"/>}
                <div className="absolute inset-0 bg-black/55 opacity-0 hover:opacity-100 flex flex-col items-center justify-center">
                  <Pencil size={26}/><span className="text-sm mt-2">Chọn ảnh</span>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={e=>chooseCover(e.target.files?.[0])}/>

              <div className="flex-1 space-y-3">
                <label className="block text-xs text-[#b3b3b3]">Tên Playlist
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                    maxLength={150} required
                    className="block w-full bg-[#3e3e3e] rounded p-3 mt-1 text-white outline-none focus:ring-1 focus:ring-white"/>
                </label>
                <label className="block text-xs text-[#b3b3b3]">Mô tả
                  <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                    rows={4}
                    className="block w-full bg-[#3e3e3e] rounded p-3 mt-1 text-white outline-none focus:ring-1 focus:ring-white resize-none"/>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button type="submit" disabled={saving}
                className="bg-white text-black font-bold px-7 py-3 rounded-full hover:scale-105 disabled:opacity-50">
                {saving?'Đang lưu...':'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Xác nhận xóa Playlist */}
      {deleteOpen&&(
        <div className="fixed inset-0 z-[100] bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#282828] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-3">Xóa Playlist?</h2>
            <p className="text-sm text-[#b3b3b3] mb-6">
              Bạn có chắc muốn xóa "{playlist?.name}"? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={()=>setDeleteOpen(false)} disabled={saving}
                className="px-5 py-2 rounded-full hover:bg-[#444]">Hủy</button>
              <button onClick={handleDelete} disabled={saving}
                className="bg-red-500 text-white font-bold px-5 py-2 rounded-full disabled:opacity-50">
                {saving?'Đang xóa...':'Xóa Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default PlaylistDetail
