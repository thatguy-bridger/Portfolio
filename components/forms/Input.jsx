import React from 'react';
export function Input({label,placeholder,value,onChange,type='text'}){
return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,fontFamily:'var(--font-sans)'}},
label&&React.createElement('label',{style:{fontSize:13,fontWeight:600,color:'var(--text-body)'}},label),
React.createElement('input',{
type,placeholder,value,onChange,
style:{
padding:'12px 14px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-default)',
background:'var(--surface-card)',color:'var(--text-heading)',fontSize:14,outline:'none',
fontFamily:'var(--font-sans)',transition:'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)'
},
onFocus:e=>{e.target.style.borderColor='var(--indigo-500)';e.target.style.boxShadow='0 0 0 2px rgba(99,102,241,0.35)'},
onBlur:e=>{e.target.style.borderColor='var(--border-default)';e.target.style.boxShadow='none'}
}));
}
