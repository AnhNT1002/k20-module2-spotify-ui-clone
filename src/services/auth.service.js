
import api from './api'

// Đăng ký tài khoản
export const registerUser = async (email,password) => {
  const {data} = await api.post('/api/auth/register',{email,password})
  return data
}

// Đăng nhập tài khoản
export const loginUser = async (email,password) => {
  const {data} = await api.post('/api/auth/login',{email,password})
  return data
}
