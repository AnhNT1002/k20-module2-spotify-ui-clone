
import {BrowserRouter,Routes,Route,useLocation} from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Player from './components/Player'
import MainView from './components/MainView'
import SectionPage from './components/SectionPage'
import PlaylistDetail from './components/PlaylistDetail'
import AlbumDetail from './components/AlbumDetail'
import ArtistDetail from './components/ArtistDetail'
import TrackDetail from './components/TrackDetail'
import SearchPage from './components/SearchPage'
import AuthPage from './components/AuthPage'
import {PlayerProvider} from './context/PlayerContext'
import {AuthProvider} from './context/AuthContext'
import {Toaster} from 'react-hot-toast'

// 1. Tách giao diện đăng nhập và giao diện chính
function AppLayout() {
  const {pathname} = useLocation()
  const isAuthPage = ['/login','/register'].includes(pathname)

  // Trang đăng nhập/đăng ký hiển thị toàn màn hình
  if(isAuthPage) return <AuthPage/>

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <Header/>

      {/* 2. Nội dung chính */}
      <div className="flex flex-1 min-h-0 gap-2 px-2 pb-2">
        <Sidebar/>

        <Routes>
          <Route path="/" element={<MainView/>}/>
          <Route path="/section/:type" element={<SectionPage/>}/>
          <Route path="/playlist/:id" element={<PlaylistDetail/>}/>
          <Route path="/album/:id" element={<AlbumDetail/>}/>
          <Route path="/artist/:id" element={<ArtistDetail/>}/>
          <Route path="/track/:id" element={<TrackDetail/>}/>
          <Route path="/search" element={<SearchPage/>}/>
        </Routes>
      </div>

      {/* 3. Player luôn hiển thị ở dưới */}
      <Player/>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <AppLayout/>
          <Toaster position="top-center"/>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
