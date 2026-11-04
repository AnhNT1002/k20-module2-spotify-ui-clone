
import {createContext,useContext,useState} from 'react'
import {loginUser,registerUser} from '../services/auth.service'

const AuthContext = createContext(null)
const STORAGE_KEY = 'spotify_auth'

// 1. Đọc thời hạn token JWT
const getTokenExpiry = token => {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g,'+').replace(/_/g,'/')
    const data = JSON.parse(atob(base64))
    return Number(data.exp)||0
  } catch {
    return 0
  }
}

// 2. Kiểm tra token còn hạn không
const isValidToken = token => {
  if(!token) return false
  const exp = getTokenExpiry(token)
  return exp>Math.floor(Date.now()/1000)
}

// 3. Lấy phiên đã lưu khi mở lại website
const getSavedAuth = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if(!saved) return null

    const data = JSON.parse(saved)

    if(!data?.user || !isValidToken(data.accessToken)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return data
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({children}) {
  // 4. Khôi phục phiên khi ứng dụng khởi động
  const [auth,setAuth] = useState(getSavedAuth)

  const user = auth?.user ?? null
  const accessToken = auth?.accessToken ?? null
  const isLoggedIn = !!user && isValidToken(accessToken)

  // 5. Lưu phiên sau khi đăng ký/đăng nhập
  const saveAuth = data => {
    if(!data?.access_token || !data?.user) {
      throw new Error('API chưa trả về đủ thông tin đăng nhập.')
    }

    const nextAuth = {
      user:data.user,
      accessToken:data.access_token
    }

    localStorage.setItem(STORAGE_KEY,JSON.stringify(nextAuth))
    setAuth(nextAuth)
  }

  // 6. Đăng ký tài khoản
  const register = async (email,password) => {
    const data = await registerUser(email,password)
    saveAuth(data)
    return data
  }

  // 7. Đăng nhập tài khoản
  const login = async (email,password) => {
    const data = await loginUser(email,password)
    saveAuth(data)
    return data
  }

  // 8. Đăng xuất và xóa phiên đã lưu
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{
      user,accessToken,isLoggedIn,
      register,login,logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
