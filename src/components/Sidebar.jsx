
import {useCallback,useEffect,useMemo,useState} from 'react'
import {Link,useNavigate} from 'react-router-dom'
import {
  Plus,Search,X,ChevronDown,Music2,Disc3,UserRound,
  Library,Check,LayoutGrid,ListMusic,Trash2,UserRoundMinus,
  LibraryBig
} from 'lucide-react'
import toast from 'react-hot-toast'
import {useAuth} from '../context/AuthContext'
import {
  getFollowedArtists,getLikedAlbums,getLibraryItems,
  unfollowArtist,unlikeAlbum
} from '../services/library.service'
import {getMyPlaylists,createPlaylist,deletePlaylist} from '../services/playlist.service'

// 1. Xử lý đường dẫn ảnh
const BASE_URL='https://spotify.f8team.dev'
const getImage=src=>{
  if(typeof src!=='string'||!src.trim()||src.includes('example.com'))return ''
  if(src.includes('/uploads/'))return `${BASE_URL}${src.slice(src.indexOf('/uploads/'))}`
  if(/^https?:\/\//i.test(src))return src
  return `${BASE_URL}/${src.replace(/^\/+/,'')}`
}

// 2. Chuẩn hóa dữ liệu thư viện
const normalizeItem=(row,type)=>{
  const data=type==='artists'?(row.artist??row):
    type==='albums'?(row.album??row):(row.playlist??row)

  const id=data.id??data.artist_id??data.album_id??data.playlist_id
  const name=type==='artists'?data.name:
    type==='albums'?(data.title??data.name):(data.name??data.title)

  return {
    ...data,id,
    name:name??'Chưa có tên',
    type,
    ownerId:data.user_id??data.owner_id??data.user?.id??data.owner?.id,
    ownerName:data.owner?.display_name??data.owner?.name??
      data.user?.display_name??data.user?.email??
      data.owner_name??data.artist_name??data.artist?.name??'',
    image:getImage(data.image_url??data.cover_image_url??data.avatar_url),
    createdAt:data.followed_at??data.liked_at??data.created_at??'',
    subtitle:type==='artists'?'Nghệ sĩ':type==='albums'?'Album':'Playlist'
  }
}

// Icon đại diện từng loại
function ItemIcon({type,size=22}){
  if(type==='artists')return <UserRound size={size}/>
  if(type==='albums')return <Disc3 size={size}/>
  return <Music2 size={size}/>
}

const layoutOptions=[
  {value:'compact-list',label:'Compact list',icon:ListMusic},
  {value:'default-list',label:'Default list',icon:ListMusic},
  {value:'compact-grid',label:'Compact grid',icon:LayoutGrid},
  {value:'default-grid',label:'Default grid',icon:LayoutGrid}
]

function Sidebar(){
  const navigate=useNavigate()
  const {user,isLoggedIn,accessToken}=useAuth()

  const [playlists,setPlaylists]=useState([])
  const [artists,setArtists]=useState([])
  const [albums,setAlbums]=useState([])
  const [loading,setLoading]=useState(false)

  // 3. Bộ lọc, tìm kiếm, sắp xếp
  const [filter,setFilter]=useState('all')
  const [searchOpen,setSearchOpen]=useState(false)
  const [search,setSearch]=useState('')
  const [sort,setSort]=useState('recent')
  const [sortOpen,setSortOpen]=useState(false)

  // 4. Bốn chế độ hiển thị
  const [layout,setLayout]=useState(()=>{
    const saved=localStorage.getItem('spotify-sidebar-layout')
    return layoutOptions.some(x=>x.value===saved)?saved:'default-list'
  })
  const [layoutOpen,setLayoutOpen]=useState(false)

  useEffect(()=>{
    localStorage.setItem('spotify-sidebar-layout',layout)
  },[layout])

  // 5. Context Menu
  const [contextMenu,setContextMenu]=useState(null)
  const [menuLoading,setMenuLoading]=useState(false)

  useEffect(()=>{
    const close=()=>setContextMenu(null)
    const onKey=e=>{if(e.key==='Escape')close()}

    document.addEventListener('click',close)
    document.addEventListener('keydown',onKey)
    window.addEventListener('scroll',close,true)

    return ()=>{
      document.removeEventListener('click',close)
      document.removeEventListener('keydown',onKey)
      window.removeEventListener('scroll',close,true)
    }
  },[])

  // 6. Tải dữ liệu thư viện
  const refreshLibrary=useCallback(async()=>{
    if(!isLoggedIn||!accessToken){
      setPlaylists([])
      setArtists([])
      setAlbums([])
      setLoading(false)
      return
    }

    setLoading(true)

    try{
      const results=await Promise.allSettled([
        getMyPlaylists(accessToken),
        getFollowedArtists(accessToken),
        getLikedAlbums(accessToken)
      ])

      if(results[0].status==='fulfilled'){
        setPlaylists(
          getLibraryItems(results[0].value,'playlists')
            .map(row=>normalizeItem(row,'playlists'))
        )
      }else console.error('Lỗi tải Playlist:',results[0].reason)

      if(results[1].status==='fulfilled'){
        setArtists(
          getLibraryItems(results[1].value,'artists')
            .map(row=>normalizeItem(row,'artists'))
        )
      }else console.error('Lỗi tải Artist:',results[1].reason)

      if(results[2].status==='fulfilled'){
        setAlbums(
          getLibraryItems(results[2].value,'albums')
            .map(row=>normalizeItem(row,'albums'))
        )
      }else console.error('Lỗi tải Album:',results[2].reason)

    }finally{
      setLoading(false)
    }
  },[isLoggedIn,accessToken])

  useEffect(()=>{refreshLibrary()},[refreshLibrary])

  useEffect(()=>{
    window.addEventListener('spotify-library-updated',refreshLibrary)
    return ()=>window.removeEventListener('spotify-library-updated',refreshLibrary)
  },[refreshLibrary])

  // 7. Lọc và sắp xếp thư viện
  const libraryItems=useMemo(()=>{
    let list=[...playlists,...artists,...albums]

    if(filter!=='all')list=list.filter(item=>item.type===filter)

    if(search.trim()){
      const keyword=search.trim().toLocaleLowerCase('vi')
      list=list.filter(item=>item.name.toLocaleLowerCase('vi').includes(keyword))
    }

    return list.sort((a,b)=>{
      if(sort==='name')return a.name.localeCompare(b.name,'vi')
      return String(b.createdAt).localeCompare(String(a.createdAt))
    })
  },[playlists,artists,albums,filter,search,sort])

  const getPath=item=>{
    if(item.type==='artists')return `/artist/${item.id}`
    if(item.type==='albums')return `/album/${item.id}`
    return `/playlist/${item.id}`
  }

  // 8. Tạo Playlist bằng API hiện tại
  const [creating,setCreating]=useState(false)

  const handleCreate=async()=>{
    if(!isLoggedIn){
      toast.error('Vui lòng đăng nhập để tạo Playlist.')
      navigate('/login')
      return
    }

    setCreating(true)

    try{
      const res=await createPlaylist(accessToken)
      const detail=res?.data?.playlist??res?.playlist??res?.data??res
      const id=detail?.id??detail?.playlist_id

      toast.success('Đã tạo Playlist!')
      setFilter('all')
      setSearch('')
      await refreshLibrary()

      if(id)navigate(`/playlist/${id}`)
    }catch(err){
      console.error('Lỗi tạo Playlist:',err)
      toast.error(err.response?.data?.message??'Không thể tạo Playlist.')
    }finally{
      setCreating(false)
    }
  }

  // 9. Kiểm tra Playlist của mình
  const isMyPlaylist=item=>{
    if(item.type!=='playlists')return false
    return Boolean(
      user?.id&&item.ownerId&&String(user.id)===String(item.ownerId)
    )
  }

  // 10. Mở menu tại vị trí con trỏ chuột
  const openContextMenu=(e,item)=>{
    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      item,
      x:Math.max(8,Math.min(e.clientX,window.innerWidth-248)),
      y:Math.max(8,Math.min(e.clientY,window.innerHeight-160))
    })
  }

  // 11. Xử lý các thao tác của Context Menu
  const handleContextAction=async(action,item)=>{
    setContextMenu(null)
    if(menuLoading)return

    if(action==='delete'){
      if(!window.confirm(`Bạn có chắc muốn xóa Playlist "${item.name}"?`))return
    }

    setMenuLoading(true)

    try{
      if(action==='unfollow-artist'){
        await unfollowArtist(item.id,accessToken)
        toast.success(`Đã bỏ theo dõi ${item.name}`)
      }

      if(action==='remove-album'){
        await unlikeAlbum(item.id,accessToken)
        toast.success(`Đã xóa ${item.name} khỏi thư viện`)
      }

      if(action==='delete'){
        await deletePlaylist(item.id,accessToken)
        toast.success('Đã xóa Playlist thành công!')
        navigate('/')
      }

      await refreshLibrary()
    }catch(err){
      console.error('Lỗi Context Menu:',err)
      toast.error(err.response?.data?.message??'Không thể thực hiện thao tác.')
    }finally{
      setMenuLoading(false)
    }
  }

  return (
    <aside className="w-[310px] xl:w-[350px] shrink-0 bg-[#121212] rounded-lg flex flex-col min-h-0 overflow-hidden max-lg:w-[270px] max-md:w-[75px]">

      {/* 12. Header thư viện */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-white px-2">
            <Library size={23} className="hidden max-md:block"/>
            <span className="max-md:hidden">Thư viện</span>
          </div>

          <button onClick={handleCreate} disabled={creating}
            title="Tạo Playlist"
            className="flex items-center gap-2 bg-[#242424] hover:bg-[#303030] rounded-full px-3 py-2 text-sm font-bold transition disabled:opacity-50">
            <Plus size={19}/>
            <span className="max-md:hidden">{creating?'Đang tạo...':'Tạo'}</span>
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="flex items-center gap-2 mt-5 max-md:flex-col">
          {[
            {value:'playlists',label:'Playlists'},
            {value:'artists',label:'Artists'},
            {value:'albums',label:'Albums'}
          ].map(item=>(
            <button key={item.value}
              onClick={()=>setFilter(filter===item.value?'all':item.value)}
              title={item.label}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition max-md:px-2 max-md:text-[10px] ${
                filter===item.value?'bg-white text-black':'bg-[#232323] text-white hover:bg-[#333]'
              }`}>
              <span className="max-md:hidden">{item.label}</span>
              <span className="hidden max-md:block">
                {item.value==='playlists'?'P':item.value==='artists'?'A':'AL'}
              </span>
            </button>
          ))}
        </div>

        {/* Tìm kiếm, sắp xếp và layout */}
        <div className="flex items-center justify-between gap-2 mt-5 max-md:justify-center">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={()=>{setSearchOpen(!searchOpen);setSearch('')}}
              title="Tìm trong thư viện"
              className="text-[#b3b3b3] hover:text-white p-1 shrink-0">
              {searchOpen?<X size={19}/>:<Search size={19}/>}
            </button>

            {searchOpen&&(
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Tìm trong thư viện..." autoFocus
                className="min-w-0 w-full bg-[#242424] rounded px-2 py-1.5 text-xs outline-none max-md:hidden"/>
            )}
          </div>

          {/* Sắp xếp */}
          <div className="relative max-md:hidden">
            <button onClick={()=>{setSortOpen(!sortOpen);setLayoutOpen(false)}}
              className="flex items-center gap-1 text-xs text-[#b3b3b3] hover:text-white whitespace-nowrap">
              {sort==='recent'?'Mới thêm gần đây':'Tên A-Z'}
              <ChevronDown size={15}/>
            </button>

            {sortOpen&&(
              <div className="absolute right-0 top-7 z-30 bg-[#282828] shadow-xl rounded p-1 w-44">
                {[
                  {value:'recent',label:'Mới thêm gần đây'},
                  {value:'name',label:'Tên A-Z'}
                ].map(item=>(
                  <button key={item.value}
                    onClick={()=>{setSort(item.value);setSortOpen(false)}}
                    className="w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded hover:bg-[#404040]">
                    {item.label}
                    {sort===item.value&&<Check size={14} className="text-[#1ed760]"/>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4 chế độ hiển thị */}
          <div className="relative max-md:hidden">
            <button onClick={()=>{setLayoutOpen(!layoutOpen);setSortOpen(false)}}
              title="Chế độ hiển thị thư viện"
              className="text-[#b3b3b3] hover:text-white p-1">
              {layout.includes('grid')?<LayoutGrid size={19}/>:<ListMusic size={19}/>}
            </button>

            {layoutOpen&&(
              <div className="absolute right-0 top-8 z-40 w-52 rounded-lg bg-[#282828] p-2 shadow-2xl border border-[#404040]">
                <p className="text-xs text-[#b3b3b3] px-3 py-2 font-semibold">Xem dưới dạng</p>
                {layoutOptions.map(item=>{
                  const Icon=item.icon
                  return (
                    <button key={item.value}
                      onClick={()=>{setLayout(item.value);setLayoutOpen(false)}}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm hover:bg-[#404040] ${
                        layout===item.value?'text-[#1ed760] bg-[#333]':'text-white'
                      }`}>
                      <Icon size={17}/>
                      <span className="flex-1 text-left">{item.label}</span>
                      {layout===item.value&&<Check size={16}/>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 13. Danh sách thư viện */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
        {loading&&(
          <p className="text-sm text-[#b3b3b3] px-3 py-4 max-md:hidden">
            Đang tải thư viện...
          </p>
        )}

        {!loading&&!isLoggedIn&&(
          <div className="bg-[#242424] rounded-lg p-4 max-md:hidden">
            <h3 className="font-bold mb-2">Tạo danh sách phát đầu tiên</h3>
            <p className="text-sm mb-4">
              Đăng nhập để lưu bài hát và tạo Playlist của riêng bạn.
            </p>
            <Link to="/login"
              className="inline-block bg-white text-black font-bold text-sm rounded-full px-5 py-2 hover:scale-105">
              Đăng nhập
            </Link>
          </div>
        )}

        {!loading&&isLoggedIn&&libraryItems.length===0&&(
          <p className="text-sm text-[#b3b3b3] px-3 py-4 max-md:hidden">
            {search?'Không tìm thấy nội dung phù hợp.':'Thư viện của bạn chưa có nội dung.'}
          </p>
        )}

        {/* 14. Danh sách với 4 layout */}
        <div className={
          layout.includes('grid')
            ?'grid grid-cols-2 gap-2 max-md:grid-cols-1'
            :'flex flex-col gap-1'
        }>
          {libraryItems.map((item,i)=>{
            const compactList=layout==='compact-list'
            const compactGrid=layout==='compact-grid'
            const defaultGrid=layout==='default-grid'
            const grid=layout.includes('grid')

            return (
              <Link
                key={`${item.type}-${item.id??i}`}
                to={getPath(item)}
                onContextMenu={e=>openContextMenu(e,item)}
                title={`${item.name} - ${item.subtitle}`}
                className={`group relative min-w-0 rounded-md hover:bg-[#ffffff12] transition ${
                  grid?'p-2':'flex items-center gap-3 px-2 py-2'
                } max-md:!p-1 max-md:justify-center`}
              >
                {compactList?(
                  <div className="min-w-0 flex-1 max-md:hidden">
                    <p className="text-sm font-semibold truncate group-hover:text-[#1ed760]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#b3b3b3] truncate">{item.subtitle}</p>
                  </div>
                ):(
                  <>
                    {/* Ảnh đại diện */}
                    <div className={`relative shrink-0 bg-[#282828] overflow-hidden flex items-center justify-center text-[#b3b3b3] ${
                      defaultGrid?'w-full aspect-square mb-2':
                      compactGrid?'w-full aspect-square':'w-12 h-12'
                    } ${item.type==='artists'?'rounded-full':'rounded'}
                    max-md:!w-11 max-md:!h-11 max-md:!mb-0`}>
                      <ItemIcon type={item.type} size={22}/>
                      {item.image&&(
                        <img src={item.image} alt={item.name} loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={e=>{e.currentTarget.style.display='none'}}/>
                      )}
                    </div>

                    {/* Default list / Default grid */}
                    {!compactGrid&&(
                      <div className="min-w-0 flex-1 max-md:hidden">
                        <p className="font-semibold text-sm truncate group-hover:text-[#1ed760]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#b3b3b3] truncate mt-1">
                          {item.subtitle}
                          {item.ownerName?` • ${item.ownerName}`:''}
                        </p>
                      </div>
                    )}

                    {/* Compact grid: tooltip */}
                    {compactGrid&&(
                      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block z-30 bg-[#303030] rounded px-3 py-2 shadow-xl pointer-events-none w-max max-w-56">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-[#b3b3b3]">
                          {item.subtitle}
                          {item.ownerName?` • ${item.ownerName}`:''}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* 15. Footer */}
      <div className="border-t border-[#242424] px-3 py-4 max-md:hidden">
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-[#b3b3b3]">
          <span>Pháp lý</span><span>Quyền riêng tư</span>
          <span>Cookie</span><span>Quảng cáo</span>
        </div>
        <button className="mt-4 border border-[#727272] rounded-full px-3 py-1.5 text-xs font-semibold">
          Tiếng Việt
        </button>
      </div>

      {/* 16. Context Menu */}
      {contextMenu&&(
        <div
          onClick={e=>e.stopPropagation()}
          onContextMenu={e=>e.preventDefault()}
          className="fixed z-[100] w-60 bg-[#282828] rounded-md p-1.5 shadow-2xl border border-[#404040]"
          style={{left:contextMenu.x,top:contextMenu.y}}
        >
          <div className="px-3 py-2 border-b border-[#404040] mb-1">
            <p className="text-sm font-semibold truncate">{contextMenu.item.name}</p>
            <p className="text-xs text-[#b3b3b3]">{contextMenu.item.subtitle}</p>
          </div>

          {/* Artist: Unfollow */}
          {contextMenu.item.type==='artists'&&(
            <button disabled={menuLoading}
              onClick={()=>handleContextAction('unfollow-artist',contextMenu.item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-left hover:bg-[#404040] disabled:opacity-50">
              <UserRoundMinus size={18}/> Bỏ theo dõi nghệ sĩ
            </button>
          )}

          {/* Album: Unlike */}
          {contextMenu.item.type==='albums'&&(
            <button disabled={menuLoading}
              onClick={()=>handleContextAction('remove-album',contextMenu.item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-left hover:bg-[#404040] disabled:opacity-50">
              <LibraryBig size={18}/> Xóa khỏi thư viện
            </button>
          )}

          {/* Playlist do mình tạo */}
          {contextMenu.item.type==='playlists'&&isMyPlaylist(contextMenu.item)&&(
            <button disabled={menuLoading}
              onClick={()=>handleContextAction('delete',contextMenu.item)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-left text-red-400 hover:bg-[#404040] disabled:opacity-50">
              <Trash2 size={18}/> Xóa Playlist
            </button>
          )}

          {/* Playlist của người khác: chưa có API Unfollow */}
          {contextMenu.item.type==='playlists'&&!isMyPlaylist(contextMenu.item)&&(
            <p className="px-3 py-2 text-xs text-[#b3b3b3]">
              Chưa có API bỏ lưu Playlist.
            </p>
          )}
        </div>
      )}
    </aside>
  )
}

export default Sidebar
