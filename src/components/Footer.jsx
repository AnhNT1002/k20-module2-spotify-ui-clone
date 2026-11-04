
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6'

// 1. Dữ liệu các nhóm liên kết Footer
const groups = [
  {title:'Công ty',links:[['Giới thiệu','https://www.spotify.com/about-us/'],['Việc làm','https://www.lifeatspotify.com/'],['For the Record','https://newsroom.spotify.com/']]},
  {title:'Cộng đồng',links:[['Dành cho các Nghệ sĩ','https://artists.spotify.com/'],['Nhà phát triển','https://developer.spotify.com/'],['Quảng cáo','https://ads.spotify.com/'],['Nhà đầu tư','https://investors.spotify.com/']]},
  {title:'Đường liên kết hữu ích',links:[['Hỗ trợ','https://support.spotify.com/'],['Ứng dụng Di động Miễn phí','https://www.spotify.com/download/'],['Phổ biến theo quốc gia','https://charts.spotify.com/']]},
  {title:'Các gói của Spotify',links:[['Premium Individual','https://www.spotify.com/premium/'],['Premium Student','https://www.spotify.com/student/'],['Spotify Free','https://www.spotify.com/free/']]}
]

// 2. Mạng xã hội: Icon là component, url là địa chỉ mở khi click
const socials = [
  {name:'Instagram',Icon:FaInstagram,url:'https://www.instagram.com/spotify/'},
  {name:'X',Icon:FaXTwitter,url:'https://x.com/spotify'},
  {name:'Facebook',Icon:FaFacebook,url:'https://www.facebook.com/Spotify'}
]

function Footer() {
  return (
    // Footer nằm cuối MainView, chỉ xuất hiện khi cuộn xuống cuối trang
    <footer className="px-5 md:px-7 pb-10">
      <div className="border-t border-[#292929] pt-10 flex flex-col xl:flex-row gap-10">

        {/* 3. Responsive: Mobile 1 cột → Tablet 2 cột → Desktop 4 cột */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {groups.map(group => (
            <div key={group.title}>
              <h3 className="font-bold mb-3">{group.title}</h3>
              <div className="flex flex-col gap-2">
                {group.links.map(([label,url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#b3b3b3] hover:text-white hover:underline transition">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 4. Icon mạng xã hội: bấm mở tab mới, hover đổi màu nền */}
        <div className="flex gap-3">
          {socials.map(({name,Icon,url}) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" title={name} aria-label={name}
              className="w-10 h-10 shrink-0 bg-[#292929] rounded-full flex items-center justify-center hover:bg-[#727272] transition">
              <Icon size={19}/>
            </a>
          ))}
        </div>
      </div>

      {/* 5. Dòng bản quyền nằm cuối Footer */}
      <div className="border-t border-[#292929] mt-10 pt-8 text-sm text-[#b3b3b3] text-right">
        © {new Date().getFullYear()} Spotify Clone
      </div>
    </footer>
  )
}

export default Footer
