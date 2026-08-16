import React from 'react';
const COLORS={indigo:'var(--indigo-500)',purple:'var(--purple-500)',orange:'var(--orange-600)',pink:'var(--pink-500)',green:'var(--green-600)',red:'var(--red-600)'};
export function Badge({color='indigo',children}){
return React.createElement('span',{
style:{
background:COLORS[color]||COLORS.indigo,color:'#fff',fontSize:'12px',fontWeight:600,
padding:'4px 12px',borderRadius:'var(--radius-pill)',display:'inline-flex',alignItems:'center',
fontFamily:'var(--font-sans)',letterSpacing:'0.01em'
}
},children);
}
