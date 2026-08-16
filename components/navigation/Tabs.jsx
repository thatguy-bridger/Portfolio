import React from 'react';
export function Tabs({tabs=[],value,onChange}){
return React.createElement('div',{style:{display:'flex',gap:4,borderBottom:'1px solid var(--border-default)',fontFamily:'var(--font-sans)'}},
tabs.map(t=>{
const active=t===value;
return React.createElement('button',{
key:t,onClick:()=>onChange&&onChange(t),
style:{
padding:'10px 18px',background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:600,
color:active?'var(--indigo-400)':'var(--text-muted)',borderBottom:active?'2px solid var(--indigo-400)':'2px solid transparent',
transition:'color var(--duration-fast) var(--ease-standard)'
}
},t);
}));
}
