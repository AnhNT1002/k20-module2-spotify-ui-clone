
import {useEffect,useMemo,useState} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {Search,Music2,UserRound,Disc3,ListMusic} from 'lucide-react'
import {getData} from '../services/api'

// 1. Cấu hình các danh mục tìm kiếm
const categories = [
  {key:'all',name:'Tất cả'},
  {key:'tracks',name:'Bài hát'},
  {key:'artists',name:'Nghệ sĩ'},
  {key:'albums',name:'Album'},
  {key:'playlists',name:'Playlist'}
]

const endpoints = {
  tracks:'/api/tracks/trending',
  artists:'/api/artists/trending',
  albums:'/api/albums/popular',
  playlists:'/api/playlists'
}

// 2. Xử lý ảnh từ API
const getImage = src => {
  if(typeof src!=='string' || !src.trim() || src.includes('example.com')) return ''
  if(src.includes('/uploads/')) return `https://spotify.f8team.dev${src.slice(src.indexOf('/uploads/'))}`
  if(/^https?:\/\//i.test(src)) return src
  return `https://spotify.f8team.dev/${src.replace(/^\/+/,'')}`
}

// 3. Chuẩn hóa chữ để tìm không phân biệt dấu
const normalize = value => String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/đ/g,'d')
  .replace(/Đ/g,'D')
  .toLowerCase()
  .trim()

// Lấy mảng dữ liệu của từng API
const getItems = (res,type) => {
  const data = res?.data ?? res
  const list = data?.[type]?.items ?? data?.[type] ?? data?.items ?? []
  return Array.isArray(list) ? list : []
}

const icons = {
  tracks:Music2,
  artists:UserRound,
  albums:Disc3,
  playlists:ListMusic
}

function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''

  const [category,setCategory] = useState('all')
  const [data,setData] = useState({tracks:[],artists:[],albums:[],playlists:[]})
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')

  // 4. Lấy dữ liệu một lần khi mở trang Search
  useEffect(()=>{
    let active = true
    setLoading(true)

    Promise.allSettled(
      Object.entries(endpoints).map(async ([type,url])=>{
        const res = await getData(url,{limit:20,offset:0})
        return {type,items:getItems(res,type)}
      })
    ).then(results=>{
      if(!active) return

      const next = {tracks:[],artists:[],albums:[],playlists:[]}
      let failed = 0

      results.forEach(result=>{
        if(result.status==='fulfilled') {
          next[result.value.type] = result.value.items
        } else {
          failed++
          console.error('Lỗi tải dữ liệu tìm kiếm:',result.reason)
        }
      })

      setData(next)
      setError(failed===4?'Không tải được dữ liệu tìm kiếm.':'')
    }).finally(()=>{
      if(active) setLoading(false)
    })

    return ()=>{active=false}
  },[])

  // 5. Lọc dữ liệu theo từ khóa
  const results = useMemo(()=>{
    const keyword = normalize(query)
    const filtered = {}

    Object.entries(data).forEach(([type,items])=>{
      filtered[type] = !keyword ? [] : items.filter(item=>{
        const content = [
          item.title,item.name,item.track_title,
          item.artist_name,item.album_title,item.description
        ].join(' ')
        return normalize(content).includes(keyword)
      })
    })

    return filtered
  },[data,query])

  const total = Object.values(results).reduce((sum,items)=>sum+items.length,0)
  const visible = category==='all' ? Object.keys(endpoints) : [category]

  return (
    <main className="flex-1 min-w-0 bg-[#121212] rounded-lg overflow-y-auto">
      <div className="p-4 md:p-7">

        {/* 6. Tiêu đề trang tìm kiếm */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Tìm kiếm</h1>
        <p className="text-sm text-[#b3b3b3] mb-6">
          {query ? `Kết quả cho "${query}"` : 'Nhập từ khóa vào ô tìm kiếm phía trên'}
        </p>

        {/* 7. Bộ lọc danh mục */}
        <div className="flex flex-wrap gap-2 mb-7">
          {categories.map(item=>(
            <button key={item.key} onClick={()=>setCategory(item.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition
                ${category===item.key?'bg-white text-black':'bg-[#282828] text-white hover:bg-[#383838]'}`}>
              {item.name}
            </button>
          ))}
        </div>

        {loading && <p className="text-[#b3b3b3]">Đang tải dữ liệu...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && !query && (
          <div className="flex flex-col items-center justify-center py-16 text-[#b3b3b3]">
            <Search size={50} className="mb-4"/>
            <p>Khám phá bài hát, nghệ sĩ, album và playlist yêu thích</p>
          </div>
        )}

        {!loading && !error && query && total===0 && (
          <div className="text-center py-16">
            <Search size={42} className="mx-auto text-[#b3b3b3] mb-4"/>
            <h2 className="text-xl font-bold mb-2">Không tìm thấy kết quả</h2>
            <p className="text-[#b3b3b3] text-sm">Thử từ khóa khác nhé.</p>
          </div>
        )}

        {/* 8. Hiển thị kết quả theo danh mục */}
        {!loading && !error && query && visible.map(type=>{
          const items = results[type] ?? []
          if(!items.length) return null

          const Icon = icons[type]
          const title = categories.find(c=>c.key===type)?.name

          return (
            <section key={type} className="mb-9">
              <h2 className="text-xl md:text-2xl font-bold mb-4">{title}</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {items.map(item=>{
                  const id = item.id ?? item._id
                  const route = type.slice(0,-1)
                  const name = item.title ?? item.name ?? item.track_title ?? 'Chưa có tên'
                  const subtitle = type==='tracks'
                    ? item.artist_name
                    : type==='albums'
                      ? item.artist_name
                      : type==='artists' ? 'Nghệ sĩ' : 'Playlist'

                  const src = getImage(
                    type==='albums'
                      ? item.cover_image_url ?? item.image_url
                      : item.image_url ?? item.cover_image_url
                  )

                  return (
                    <Link key={id} to={`/${route}/${id}`}
                      className="bg-[#181818] hover:bg-[#282828] rounded-lg p-3 transition min-w-0">
                      <div className={`aspect-square bg-[#282828] mb-3 relative overflow-hidden
                        ${type==='artists'?'rounded-full':'rounded-md'}`}>
                        <Icon size={42} className="absolute inset-0 m-auto text-[#777]"/>
                        {src && (
                          <img src={src} alt={name}
                            className="relative w-full h-full object-cover"
                            loading="lazy"
                            onError={e=>{e.currentTarget.style.display='none'}}/>
                        )}
                      </div>
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <p className="text-xs text-[#b3b3b3] mt-1 truncate">{subtitle}</p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* Không có kết quả trong danh mục được chọn */}
        {!loading && query && total>0 && category!=='all' && !results[category]?.length && (
          <p className="text-[#b3b3b3] py-8">Không có kết quả trong danh mục này.</p>
        )}
      </div>
    </main>
  )
}

export default SearchPage
