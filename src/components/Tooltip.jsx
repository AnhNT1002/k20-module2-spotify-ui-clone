
function Tooltip({text,children,position='bottom'}){
  const positions={
    top:'bottom-full mb-2',
    bottom:'top-full mt-2',
    left:'right-full mr-2',
    right:'left-full ml-2'
  }

  return (
    <div className="relative group/tooltip inline-flex">
      {children}

      <span className={`absolute ${positions[position]}
        left-1/2 -translate-x-1/2 z-[100]
        px-3 py-1.5 rounded bg-[#303030]
        text-white text-xs font-medium whitespace-nowrap
        shadow-lg opacity-0 invisible
        group-hover/tooltip:opacity-100 group-hover/tooltip:visible
        group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:visible
        transition-opacity duration-150 pointer-events-none`}>
        {text}
      </span>
    </div>
  )
}

export default Tooltip
