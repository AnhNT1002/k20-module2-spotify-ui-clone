
import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {Music2} from 'lucide-react'
import {getData} from '../services/api'
import Footer from './Footer'

// 1. Khai báo các danh mục hiển thị trên trang chủ
const sections = [
  {title:'Những bài hát thịnh hành',url:'/api/tracks/trending',type:'track'},
  {title:'Nghệ sĩ phổ biến',url:'/api/artists/trending',type:'artist'},
  {title:'Album và đĩa đơn nổi tiếng',url:'/api/albums/popular',type:'album'},
  {title:'Danh sách phát phổ biến',url:'/api/playlists',type:'playlist'}
]

// 2. Lấy danh sách từ dữ liệu API
const getItems = (res,type) => {
  if(Array.isArray(res)) return res
  const data = res?.data ?? res
  if(Array.isArray(data)) return data
  const key = {track:'tracks',artist:'artists',album:'albums',playlist:'playlists'}[type]
  const items = data?.[key]?.items ?? data?.[key] ?? data?.items ?? []
  return Array.isArray(items) ? items : []
}

// 3. Xử lý đường dẫn ảnh và loại bỏ ảnh mẫu
const getImage = (item,type) => {
  if(!item) return ''
  const src = type==='album'
    ? item.cover_image_url ?? item.image_url
    : item.image_url ?? item.cover_image_url

  if(typeof src!=='string' || !src.trim()) return ''
  if(src.includes('example.com')) return ''

  // Chuyển ảnh upload về cùng máy chủ HTTPS
  if(src.includes('/uploads/')) {
    const path = src.substring(src.indexOf('/uploads/'))
    return `https://spotify.f8team.dev${path}`
  }

  if(/^https?:\/\//i.test(src)) return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

function MainView() {
  const [lists,setLists] = useState({})
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')

  useEffect(()=>{
    let active = true

    // 4. Gọi đồng thời các API để lấy dữ liệu trang chủ
    Promise.allSettled(sections.map(s=>getData(s.url,{limit:20,offset:0})))
      .then(results=>{
        if(!active) return
        const next = {}

        results.forEach((result,i)=>{
          const {type,url} = sections[i]
          next[type] = result.status==='fulfilled' ? getItems(result.value,type) : []
          if(result.status==='rejected') console.error(`Lỗi API ${url}:`,result.reason)
        })

        setLists(next)
        if(results.some(r=>r.status==='rejected')) {
          setError('Một số danh sách chưa tải được. Hãy kiểm tra Console.')
        }
      })
      .finally(()=>{if(active) setLoading(false)})

    return ()=>{active=false}
  },[])

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="px-4 md:px-6 py-6">
        {error && <p className="text-yellow-400 text-sm mb-5">{error}</p>}

        {/* 5. Hiển thị lần lượt 4 danh mục */}
        {sections.map(s=>(
          <Section key={s.type} title={s.title} type={s.type}
            items={lists[s.type] ?? []} loading={loading}/>
        ))}
      </div>
      <Footer/>
    </main>
  )
}

// 6. Component dùng chung cho các danh mục
function Section({title,type,items,loading}) {
  const artist = type==='artist'

  // Ưu tiên playlist có ảnh thật lên trước
  const sortedItems = type==='playlist'
    ? [...items].sort((a,b)=>Number(!!getImage(b,type))-Number(!!getImage(a,type)))
    : items

  // Trang chủ hiển thị tối đa 6 mục mỗi danh mục
  const visibleItems = loading ? Array.from({length:6}) : sortedItems.slice(0,6)

  return (
    <section className="mb-10">

      {/* Tiêu đề danh mục và liên kết xem tất cả */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xl md:text-2xl font-bold hover:underline cursor-pointer">{title}</h2>
        <Link to={`/section/${type}s`}
          className="shrink-0 text-sm font-bold text-[#b3b3b3] hover:underline">
          Hiện tất cả
        </Link>
      </div>

      {/* Danh sách card hiển thị theo kích thước màn hình */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {visibleItems.map((item,i)=>{
          const id = item?.id ?? item?._id
          // Cho phép mở chi tiết playlist và album,nghệ sĩ
          const canOpen = ["playlist", "album","artist","track"].includes(type) && !loading && id != null;

          return (
            <Link key={id ?? i}
              to={canOpen ? `/${type}/${id}` : '#'}
              onClick={e=>{if(!canOpen) e.preventDefault()}}
              className={`min-w-0 p-3 rounded-lg hover:bg-[#1f1f1f] transition ${canOpen?'cursor-pointer':'cursor-default'}`}>

              {/* Ảnh đại diện: nghệ sĩ hình tròn, các mục khác hình vuông */}
              <div className={`relative aspect-square bg-[#282828] mb-3 overflow-hidden shadow-lg ${artist?'rounded-full':'rounded-md'}`}>
                {loading ? (
                  <div className="w-full h-full animate-pulse"/>
                ) : (
                  <>
                    <Music2 size={50} className="absolute inset-0 m-auto text-[#777]"/>
                    {getImage(item,type) && (
                      <img src={getImage(item,type)}
                        alt={item.name ?? item.title ?? ''}
                        loading="lazy"
                        className="relative w-full h-full object-cover"
                        onError={e=>{e.currentTarget.style.display='none'}}/>
                    )}
                  </>
                )}
              </div>

              {/* Tên và thông tin bên dưới ảnh */}
              {loading ? (
                <div className="h-4 bg-[#282828] rounded animate-pulse"/>
              ) : (
                <>
                  <h3 className="font-semibold truncate">
                    {item.name ?? item.title ?? 'Chưa có tên'}
                  </h3>
                  <p className="text-sm text-[#b3b3b3] mt-1 truncate">
                    {artist?'Nghệ sĩ':item.artist?.name ?? item.owner?.display_name ?? 'Spotify'}
                  </p>
                </>
              )}
            </Link>
          )
        })}
      </div>

      {!loading && visibleItems.length===0 && (
        <p className="text-sm text-[#b3b3b3] mt-3">
          Chưa có dữ liệu để hiển thị.
        </p>
      )}
    </section>
  )
}

export default MainView
