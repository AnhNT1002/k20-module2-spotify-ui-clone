
import api from './api'

const config=token=>({
  headers:{Authorization:`Bearer ${token}`}
})

// Theo dõi / bỏ theo dõi nghệ sĩ
export const followArtist=async(id,token)=>{
  const {data}=await api.post(`/api/artists/${id}/follow`,{},config(token))
  return data
}
export const unfollowArtist=async(id,token)=>{
  const {data}=await api.delete(`/api/artists/${id}/follow`,config(token))
  return data
}

// Lưu / bỏ lưu Album
export const likeAlbum=async(id,token)=>{
  const {data}=await api.post(`/api/albums/${id}/like`,{},config(token))
  return data
}
export const unlikeAlbum=async(id,token)=>{
  const {data}=await api.delete(`/api/albums/${id}/like`,config(token))
  return data
}

// Lấy thư viện nghệ sĩ và Album
export const getFollowedArtists=async token=>{
  const {data}=await api.get('/api/me/following',{
    ...config(token),params:{limit:20,offset:0}
  })
  return data
}
export const getLikedAlbums=async token=>{
  const {data}=await api.get('/api/me/albums/liked',{
    ...config(token),params:{limit:20,offset:0}
  })
  return data
}

// Chuẩn hóa dữ liệu trả về
export const getLibraryItems=(res,key)=>{
  const data=res?.data??res
  if(Array.isArray(data))return data
  const list=data?.[key]??data?.items??[]
  if(Array.isArray(list))return list
  return Array.isArray(list?.items)?list.items:[]
}

// Báo Sidebar tải lại thư viện
export const refreshLibrary=()=>{
  window.dispatchEvent(new Event('spotify-library-updated'))
}
