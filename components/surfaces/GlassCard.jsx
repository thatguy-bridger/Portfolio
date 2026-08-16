import React from 'react';
export function GlassCard({title,subtitle,accent='indigo',onClick,children}){
const [hover,setHover]=React.useState(false);
const accentColor={indigo:'var(--indigo-400)',purple:'var(--purple-400)',orange:'var(--orange-400)',pink:'var(--pink-500)'}[accent]||'var(--indigo-400)';
return React.createElement('div',{
onClick,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),
style:{
background:'var(--surface-glass)',backdropFilter:'var(--blur-glass)',border:'1px solid var(--border-default)',
borderRadius:'var(--radius-xl)',padding:'20px',cursor:onClick?'pointer':'default',
transform:hover?'translateY(-8px)':'translateY(0)',boxShadow:hover?'var(--shadow-lg)':'var(--shadow-md)',
transition:'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
fontFamily:'var(--font-sans)'
}
},
title&&React.createElement('h4',{style:{margin:'0 0 4px',color:accentColor,fontSize:18,fontWeight:700}},title),
subtitle&&React.createElement('p',{style:{margin:'0 0 12px',color:'var(--text-muted)',fontSize:13}},subtitle),
children);
}
