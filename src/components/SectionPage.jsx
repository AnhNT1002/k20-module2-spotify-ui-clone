
import {useEffect,useState} from 'react'
import {Link,useParams} from 'react-router-dom'
import {ArrowLeft,Music2} from 'lucide-react'
import {getData} from '../services/api'

// 1. Cấu hình các danh mục và API tương ứng
const config = {
  tracks:{title:'Những bài hát thịnh hành',url:'/api/tracks/trending',key:'tracks'},
  artists:{title:'Nghệ sĩ phổ biến',url:'/api/artists/trending',key:'artists'},
  albums:{title:'Album và đĩa đơn nổi tiếng',url:'/api/albums/popular',key:'albums'},
  playlists:{title:'Danh sách phát phổ biến',url:'/api/playlists',key:'playlists'}
}

// 2. Chuyển dữ liệu API về dạng mảng
const getItems = (res,key) => {
  const data = res?.data ?? res
  if(Array.isArray(data)) return data
  const items = data?.[key]?.items ?? data?.[key] ?? data?.items ?? []
  return Array.isArray(items) ? items : []
}

// 3. Xử lý đường dẫn ảnh từ API
const getImage = item => {
  const src = item?.image_url ?? item?.cover_image_url
  if(typeof src!=='string' || !src.trim() || src.includes('example.com')) return ''

  // Chuẩn hóa đường dẫn ảnh upload về HTTPS
  if(src.includes('/uploads/')) {
    return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  }

  if(/^https?:\/\//i.test(src)) return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

function SectionPage() {
  const {type} = useParams()
  const cfg = config[type]

  const [items,setItems] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')

  useEffect(()=>{
    if(!cfg) return
    let active = true
    setLoading(true)
    setError('')
    setItems([])

    // 4. Lấy dữ liệu theo danh mục được chọn
    getData(cfg.url,{limit:20,offset:0})
      .then(res=>{
        if(active) setItems(getItems(res,cfg.key))
      })
      .catch(err=>{
        console.error('Lỗi tải danh sách:',err)
        if(active){
          setItems([])
          setError('Không tải được dữ liệu từ API.')
        }
      })
      .finally(()=>{
        if(active) setLoading(false)
      })

    return ()=>{active=false}
  },[type])

  if(!cfg) {
    return (
      <main className="flex-1 p-6 bg-[#121212] rounded-lg">
        Không tìm thấy danh mục.
      </main>
    )
  }

  // 5. Ưu tiên playlist có ảnh thật lên đầu danh sách
  const sortedItems = type==='playlists'
    ? [...items].sort((a,b)=>Number(!!getImage(b))-Number(!!getImage(a)))
    : items

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="p-4 md:p-7">

        {/* Quay lại trang chủ */}
        <Link to="/" className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white mb-6">
          <ArrowLeft size={19}/> Quay lại trang chủ
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-7">{cfg.title}</h1>

        {error && <p className="text-red-400 mb-5">{error}</p>}
        {loading && <p className="text-[#b3b3b3]">Đang tải dữ liệu...</p>}

        {/* 6. Hiển thị danh sách theo dạng lưới responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {!loading && sortedItems.map((item,i)=>{
            const id = item.id ?? item._id
            // Cho phép mở chi tiết playlist và album, nghệ sĩ
            const routeType = {playlists:'playlist',albums:'album',artists:'artist',tracks:'track'}[type]
            const canOpen = !!routeType && id!=null

            return (
              <Link key={id ?? i}
                to={canOpen ? `/${routeType}/${id}` : '#'}
                onClick={e=>{if(!canOpen) e.preventDefault()}}
                className={`min-w-0 p-3 rounded-lg hover:bg-[#1f1f1f] transition ${canOpen?'cursor-pointer':'cursor-default'}`}>

                {/* Ảnh đại diện: nghệ sĩ tròn, các mục khác vuông */}
                <div className={`relative aspect-square bg-[#282828] mb-3 overflow-hidden shadow-lg ${type==='artists'?'rounded-full':'rounded-md'}`}>
                  <Music2 size={50} className="absolute inset-0 m-auto text-[#777]"/>

                  {getImage(item) && (
                    <img src={getImage(item)}
                      alt={item.name ?? item.title ?? ''}
                      loading="lazy"
                      className="relative w-full h-full object-cover"
                      onError={e=>{e.currentTarget.style.display='none'}}/>
                  )}
                </div>

                {/* Tên và thông tin của từng mục */}
                <h3 className="font-semibold truncate">
                  {item.name ?? item.title ?? 'Chưa có tên'}
                </h3>

                <p className="text-sm text-[#b3b3b3] mt-1 truncate">
                  {type==='artists'
                    ? 'Nghệ sĩ'
                    : item.artist?.name ?? item.owner?.display_name ?? 'Spotify'}
                </p>
              </Link>
            )
          })}
        </div>

        {!loading && !error && sortedItems.length===0 && (
          <p className="text-[#b3b3b3] mt-4">Chưa có dữ liệu để hiển thị.</p>
        )}
      </div>
    </main>
  )
}

export default SectionPage
