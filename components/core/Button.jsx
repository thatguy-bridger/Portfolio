import React from 'react';
const VARIANTS={
primary:{background:'var(--indigo-500)',color:'#fff'},
secondary:{background:'var(--purple-500)',color:'#fff'},
danger:{background:'var(--red-600)',color:'#fff'},
success:{background:'var(--green-600)',color:'#fff'},
ghost:{background:'transparent',color:'var(--text-body)',border:'1px solid var(--border-strong)'}
};
export function Button({variant='primary',size='md',disabled=false,onClick,children}){
const pad=size==='sm'?'8px 16px':size==='lg'?'14px 28px':'11px 22px';
const fontSize=size==='sm'?'13px':size==='lg'?'16px':'14px';
const v=VARIANTS[variant]||VARIANTS.primary;
const [hover,setHover]=React.useState(false);
return React.createElement('button',{
onClick,disabled,
onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),
style:{
...v,padding:pad,fontSize,fontWeight:600,borderRadius:'var(--radius-pill)',border:v.border||'none',
cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,
transform:hover&&!disabled?'scale(1.05)':'scale(1)',
boxShadow:hover&&!disabled?'var(--shadow-lg)':'var(--shadow-sm)',
transition:'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
fontFamily:'var(--font-sans)'
}
},children);
}
