import React from 'react';
export function Modal({open,title,onClose,children,footer}){
if(!open) return null;
return React.createElement('div',{
onClick:onClose,
style:{position:'fixed',inset:0,background:'var(--surface-overlay)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,fontFamily:'var(--font-sans)'}
},React.createElement('div',{
onClick:e=>e.stopPropagation(),
style:{background:'var(--surface-panel)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',width:'min(90vw,480px)',maxHeight:'85vh',display:'flex',flexDirection:'column',padding:28}
},
React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}},
React.createElement('h3',{style:{margin:0,fontSize:22,fontWeight:700,color:'var(--text-heading)'}},title),
React.createElement('button',{onClick:onClose,style:{background:'none',border:'none',fontSize:20,color:'var(--text-muted)',cursor:'pointer'}},'✕')),
React.createElement('div',{style:{flex:1,overflowY:'auto',color:'var(--text-body)',fontSize:14}},children),
footer&&React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}},footer)
));
}
