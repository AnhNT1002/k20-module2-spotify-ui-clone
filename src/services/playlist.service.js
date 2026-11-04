
import api from './api'

const auth=token=>({headers:{Authorization:`Bearer ${token}`}})

// Playlist của tài khoản
export const getMyPlaylists=async token=>{
  const {data}=await api.get('/api/me/playlists',auth(token))
  return data
}

// Tạo Playlist
export const createPlaylist=async token=>{
  const {data}=await api.post('/api/playlists',{
    name:'My New Playlist',description:'',is_public:true
  },auth(token))
  return data
}

// Sửa tên, mô tả, trạng thái và ảnh
export const updatePlaylist=async (id,body,token)=>{
  const {data}=await api.put(`/api/playlists/${id}`,body,auth(token))
  return data
}

// Xóa Playlist
export const deletePlaylist=async (id,token)=>{
  const {data}=await api.delete(`/api/playlists/${id}`,auth(token))
  return data
}

// Thêm bài hát
export const addPlaylistTrack=async (id,trackId,token)=>{
  const {data}=await api.post(`/api/playlists/${id}/tracks`,{
    track_id:trackId,position:0
  },auth(token))
  return data
}

// Xóa bài hát khỏi Playlist
export const removePlaylistTrack=async (id,trackId,token)=>{
  const {data}=await api.delete(`/api/playlists/${id}/tracks/${trackId}`,auth(token))
  return data
}

// Upload ảnh bìa, field bắt buộc là "cover"
export const uploadPlaylistCover=async (id,file,token)=>{
  const form=new FormData()
  form.append('cover',file)
  const {data}=await api.post(`/api/upload/playlist/${id}/cover`,form,auth(token))
  return data
}
