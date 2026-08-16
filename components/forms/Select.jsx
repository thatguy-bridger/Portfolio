import React from 'react';
export function Select({label,value,onChange,options=[]}){
return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,fontFamily:'var(--font-sans)'}},
label&&React.createElement('label',{style:{fontSize:13,fontWeight:600,color:'var(--text-body)'}},label),
React.createElement('select',{
value,onChange,
style:{
padding:'12px 14px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-default)',
background:'var(--surface-card)',color:'var(--text-heading)',fontSize:14,outline:'none',fontFamily:'var(--font-sans)'
}
},options.map((o,i)=>React.createElement('option',{key:i,value:o.value},o.label))));
}
