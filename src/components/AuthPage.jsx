
import {useState} from 'react'
import {Link,useLocation,useNavigate} from 'react-router-dom'
import {Eye,EyeOff} from 'lucide-react'
import {useAuth} from '../context/AuthContext'

function AuthPage() {
  const {pathname} = useLocation()
  const navigate = useNavigate()
  const {register,login} = useAuth()
  const isRegister = pathname==='/register'

  const [form,setForm] = useState({
    email:'',password:'',confirm:''
  })
  const [showPassword,setShowPassword] = useState(false)
  const [error,setError] = useState('')
  const [submitting,setSubmitting] = useState(false)

  // 1. Cập nhật dữ liệu khi nhập
  const handleChange = e => {
    const {name,value} = e.target
    setForm(prev=>({...prev,[name]:value}))
    setError('')
  }

  // 2. Kiểm tra dữ liệu và gửi API
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if(!form.email.trim() || !form.password) {
      return setError('Vui lòng nhập email và mật khẩu.')
    }

    if(isRegister) {
      if(!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) {
        return setError('Mật khẩu phải có chữ hoa, chữ thường và số.')
      }

      if(form.password!==form.confirm) {
        return setError('Mật khẩu xác nhận không khớp.')
      }
    }

    try {
      setSubmitting(true)

      // Đăng ký hoặc đăng nhập bằng API
      if(isRegister) {
        await register(form.email.trim(),form.password)
      } else {
        await login(form.email.trim(),form.password)
      }

      navigate('/',{replace:true})
    } catch(err) {
      const apiError = err.response?.data?.error
      const code = apiError?.code
      const message = apiError?.message

      if(code==='EMAIL_EXISTS') {
        setError('Email này đã được đăng ký.')
      } else if(code==='VALIDATION_ERROR') {
        const details = apiError?.details ?? []
        setError(details.map(d=>d.message).join('. ') || message || 'Dữ liệu không hợp lệ.')
      } else if(err.response?.status===401) {
        setError('Email hoặc mật khẩu không chính xác.')
      } else {
        setError(message || err.message || 'Đã có lỗi xảy ra.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#292929] to-black text-white flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-[450px] bg-[#121212] rounded-xl p-6 sm:p-10">

        {/* 3. Logo Spotify */}
        <Link to="/" className="flex justify-center mb-8">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
            <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.83-1.73-6.4-2.12-10.61-1.16a.75.75 0 1 1-.33-1.46c4.61-1.05 8.55-.59 11.72 1.35.35.22.47.68.25 1.02Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.24-1.99-8.19-2.56-12.02-1.4a.94.94 0 1 1-.54-1.8c4.38-1.33 9.83-.69 13.54 1.6a1.13 1.13 0 1 1-1.15 1.95Z"/>
          </svg>
        </Link>

        <h1 className="text-3xl font-extrabold text-center mb-8">
          {isRegister?'Đăng ký để bắt đầu nghe':'Đăng nhập vào Spotify'}
        </h1>

        {/* 4. Form đăng nhập/đăng ký */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label htmlFor="auth-email" className="block text-sm font-semibold mb-2">Email</label>
            <input id="auth-email" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="name@example.com" required
              autoComplete="email"
              className="w-full bg-[#121212] border border-[#727272] rounded px-4 py-3 outline-none focus:border-white"/>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-semibold mb-2">Mật khẩu</label>
            <div className="relative">
              <input id="auth-password" type={showPassword?'text':'password'}
                name="password" value={form.password} onChange={handleChange}
                placeholder="Nhập mật khẩu" required
                autoComplete={isRegister?'new-password':'current-password'}
                className="w-full bg-[#121212] border border-[#727272] rounded px-4 py-3 pr-12 outline-none focus:border-white"/>

              <button type="button" onClick={()=>setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
                aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'}>
                {showPassword?<EyeOff size={20}/>:<Eye size={20}/>}
              </button>
            </div>

            {isRegister && (
              <p className="text-xs text-[#b3b3b3] mt-2">
                Mật khẩu cần có chữ hoa, chữ thường và số.
              </p>
            )}
          </div>

          {/* 5. Xác nhận mật khẩu khi đăng ký */}
          {isRegister && (
            <div>
              <label htmlFor="auth-confirm" className="block text-sm font-semibold mb-2">
                Xác nhận mật khẩu
              </label>
              <input id="auth-confirm" type="password" name="confirm"
                value={form.confirm} onChange={handleChange}
                placeholder="Nhập lại mật khẩu" required autoComplete="new-password"
                className="w-full bg-[#121212] border border-[#727272] rounded px-4 py-3 outline-none focus:border-white"/>
            </div>
          )}

          {/* 6. Thông báo lỗi */}
          {error && (
            <p role="alert" className="text-sm text-red-400 bg-red-400/10 p-3 rounded">
              {error}
            </p>
          )}

          {/* 7. Nút gửi form */}
          <button type="submit" disabled={submitting}
            className="w-full bg-[#1ed760] text-black font-bold rounded-full py-3.5 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting?'Đang xử lý...':isRegister?'Đăng ký':'Đăng nhập'}
          </button>
        </form>

        {/* 8. Chuyển đổi đăng nhập/đăng ký */}
        <div className="border-t border-[#292929] mt-8 pt-7 text-center text-sm">
          <span className="text-[#b3b3b3]">
            {isRegister?'Đã có tài khoản? ':'Bạn chưa có tài khoản? '}
          </span>
          <Link to={isRegister?'/login':'/register'}
            className="font-semibold underline hover:text-[#1ed760]">
            {isRegister?'Đăng nhập':'Đăng ký'}
          </Link>
        </div>

        <Link to="/" className="block text-center text-sm text-[#b3b3b3] hover:text-white mt-6">
          Quay về trang chủ
        </Link>
      </div>
    </main>
  )
}

export default AuthPage
