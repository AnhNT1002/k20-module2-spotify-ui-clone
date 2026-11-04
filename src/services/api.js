
import axios from 'axios'

// Cấu hình API dùng chung, sau này Header, Player, Sidebar đều dùng được
const api = axios.create({baseURL:'https://spotify.f8team.dev',timeout:15000})

export const getData = async (url,params={}) => {
  const {data} = await api.get(url,{params})
  return data
}

export default api
