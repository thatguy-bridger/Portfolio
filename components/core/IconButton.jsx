import React from 'react';
export function IconButton({icon,tone='default',size=44,onClick,title}){
const [hover,setHover]=React.useState(false);
const bg=tone==='accent'?'var(--indigo-500)':tone==='danger'?'var(--red-600)':'var(--surface-card)';
const color=tone==='default'?'var(--text-body)':'#fff';
return React.createElement('button',{
onClick,title,
onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),
style:{
width:size,height:size,borderRadius:'50%',background:bg,color,border:tone==='default'?'1px solid var(--border-default)':'none',
display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:size*0.45,
transform:hover?'scale(1.1)':'scale(1)',boxShadow:hover?'var(--shadow-md)':'none',
transition:'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)'
}
},icon);
}
