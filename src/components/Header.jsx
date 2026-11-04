
import {useEffect,useState} from 'react'
import {Link,useNavigate,useSearchParams} from 'react-router-dom'
import {CircleArrowDown,Home,Search,ShoppingBag,X} from 'lucide-react'
import {useAuth} from '../context/AuthContext'
import Tooltip from './Tooltip'

function Header(){
  const navigate=useNavigate()
  const [params]=useSearchParams()
  const {user,isLoggedIn,logout}=useAuth()

  const urlQuery=params.get('q')??''
  const [search,setSearch]=useState(urlQuery)

  // 1. Đồng bộ từ khóa từ URL
  useEffect(()=>{setSearch(urlQuery)},[urlQuery])

  // 2. Tìm kiếm sau khi ngừng gõ 400ms
  useEffect(()=>{
    if(search===urlQuery)return

    const timer=setTimeout(()=>{
      const keyword=search.trim()
      navigate(keyword?`/search?q=${encodeURIComponent(keyword)}`:'/search')
    },400)

    return ()=>clearTimeout(timer)
  },[search,urlQuery,navigate])

  // 3. Xóa tìm kiếm
  const clearSearch=()=>{
    setSearch('')
    navigate('/search')
  }

  // 4. Tìm kiếm khi nhấn Enter
  const handleSubmit=e=>{
    e.preventDefault()
    const keyword=search.trim()
    navigate(keyword?`/search?q=${encodeURIComponent(keyword)}`:'/search')
  }

  // 5. Đăng xuất
  const handleLogout=()=>{
    logout()
    navigate('/')
  }

  return (
    <header className="h-16 shrink-0 bg-black grid grid-cols-[auto_minmax(0,1fr)_auto] 2xl:grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 md:px-5">

      {/* 6. Logo Spotify */}
      <Tooltip text="Spotify">
        <Link to="/" aria-label="Spotify - Trang chủ"
          className="shrink-0 2xl:justify-self-start">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" aria-hidden="true">
            <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.83-1.73-6.4-2.12-10.61-1.16a.75.75 0 1 1-.33-1.46c4.61-1.05 8.55-.59 11.72 1.35.35.22.47.68.25 1.02Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.24-1.99-8.19-2.56-12.02-1.4a.94.94 0 1 1-.54-1.8c4.38-1.33 9.83-.69 13.54 1.6.44.27.58.85.31 1.29Zm.13-3.4C15.21 8.32 8.8 8.1 5.09 9.23a1.13 1.13 0 1 1-.66-2.16c4.27-1.3 11.36-1.05 15.82 1.6a1.13 1.13 0 1 1-1.15 1.95Z"/>
          </svg>
        </Link>
      </Tooltip>

      {/* 7. Home và Search */}
      <div className="flex items-center gap-3 min-w-0 w-full max-w-[650px] justify-self-center">

        <Tooltip text="Trang chủ">
          <Link to="/" aria-label="Trang chủ"
            className="hidden sm:flex w-12 h-12 shrink-0 rounded-full bg-[#242424] items-center justify-center hover:bg-[#333] transition">
            <Home size={23}/>
          </Link>
        </Tooltip>

        <form onSubmit={handleSubmit} className="relative flex-1 min-w-0">
          <Search size={23}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] pointer-events-none"/>

          <input type="text"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            onFocus={()=>{if(!search)navigate('/search')}}
            placeholder="Bạn muốn phát nội dung gì?"
            aria-label="Tìm kiếm nội dung"
            className="w-full h-12 bg-[#242424] rounded-full pl-12 pr-12 text-sm text-white placeholder:text-[#b3b3b3] outline-none border border-transparent hover:bg-[#2a2a2a] focus:border-white transition"
          />

          {search?(
            <button type="button" onClick={clearSearch}
              title="Xóa tìm kiếm"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white">
              <X size={20}/>
            </button>
          ):(
            <ShoppingBag size={19}
              className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] pointer-events-none"/>
          )}
        </form>
      </div>

      {/* 8. Menu bên phải */}
      <div className="flex items-center justify-end gap-3 lg:gap-5 shrink-0">

        <nav className="hidden min-[1450px]:flex items-center gap-3 text-sm font-bold text-[#b3b3b3] whitespace-nowrap">
          <button className="hover:text-white">Premium</button>
          <button className="hover:text-white">Hỗ trợ</button>
          <button className="hover:text-white">Tải xuống</button>
          <span className="h-6 border-l border-[#727272] mx-2"/>

          <button className="flex items-center gap-2 hover:text-white">
            <CircleArrowDown size={17}/> Cài đặt ứng dụng
          </button>
        </nav>

        {/* 9. Tài khoản đã đăng nhập */}
        {isLoggedIn?(
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden lg:block text-sm text-[#b3b3b3] max-w-40 truncate">
              {user?.email}
            </span>

            <Tooltip text="Đăng xuất">
              <button onClick={handleLogout}
                className="bg-white text-black text-sm font-bold h-11 px-3 md:px-5 rounded-full hover:scale-105 transition whitespace-nowrap">
                Đăng xuất
              </button>
            </Tooltip>
          </div>
        ):(
          <>
            <Link to="/register"
              className="hidden lg:block text-sm font-bold text-[#b3b3b3] hover:text-white whitespace-nowrap">
              Đăng ký
            </Link>

            <Link to="/login"
              className="flex items-center justify-center bg-white text-black text-sm font-bold h-11 px-3 lg:px-7 rounded-full hover:scale-105 transition whitespace-nowrap">
              Đăng nhập
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
