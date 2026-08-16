function SettingsScreen({onClose}){
const [tab,setTab]=React.useState('Profile');
const tabs=['Profile','Domain','Billing'];
return (
<div style={{position:'fixed',inset:0,background:'var(--surface-overlay)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-sans)',zIndex:50}}>
<div style={{background:'var(--surface-panel)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',width:'min(90vw,560px)',maxHeight:'85vh',display:'flex',flexDirection:'column',padding:28}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
<h3 style={{margin:0,fontSize:22,fontWeight:700,color:'var(--text-heading)'}}>Site settings</h3>
<button onClick={onClose} style={{background:'none',border:'none',fontSize:20,color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
</div>
<div style={{display:'flex',gap:4,borderBottom:'1px solid var(--border-default)',marginBottom:20}}>
{tabs.map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:'10px 18px',background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:600,color:tab===t?'var(--indigo-400)':'var(--text-muted)',borderBottom:tab===t?'2px solid var(--indigo-400)':'2px solid transparent'}}>{t}</button>))}
</div>
<div style={{display:'flex',flexDirection:'column',gap:16}}>
{tab==='Profile'&&<>
<div style={{display:'flex',flexDirection:'column',gap:6}}><label style={{fontSize:13,fontWeight:600,color:'var(--text-body)'}}>Site title</label><input defaultValue="Jane Doe — Portfolio" style={{padding:'12px 14px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-default)',background:'var(--surface-card)',color:'var(--text-heading)',fontSize:14}}/></div>
<div style={{display:'flex',flexDirection:'column',gap:6}}><label style={{fontSize:13,fontWeight:600,color:'var(--text-body)'}}>Theme</label>
<div style={{display:'inline-flex',background:'var(--surface-panel)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-pill)',padding:4,gap:2,width:'fit-content'}}>
{['Light','Dark','System'].map(o=>(<button key={o} style={{padding:'6px 16px',borderRadius:'var(--radius-pill)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:o==='Dark'?'var(--indigo-500)':'transparent',color:o==='Dark'?'#fff':'var(--text-body)'}}>{o}</button>))}
</div></div>
</>}
{tab==='Domain'&&<div style={{display:'flex',flexDirection:'column',gap:6}}><label style={{fontSize:13,fontWeight:600,color:'var(--text-body)'}}>Custom domain</label><input placeholder="janedoe.com" style={{padding:'12px 14px',borderRadius:'var(--radius-md)',border:'1px solid var(--border-default)',background:'var(--surface-card)',color:'var(--text-heading)',fontSize:14}}/></div>}
{tab==='Billing'&&<div style={{fontSize:14,color:'var(--text-body)'}}>Pro plan — $12/mo. <span style={{color:'var(--indigo-400)',fontWeight:600}}>Manage</span></div>}
</div>
<div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:24}}>
<button onClick={onClose} style={{padding:'11px 22px',borderRadius:'var(--radius-pill)',border:'1px solid var(--border-strong)',background:'none',color:'var(--text-body)',fontWeight:600,cursor:'pointer'}}>Cancel</button>
<button style={{padding:'11px 22px',borderRadius:'var(--radius-pill)',border:'none',background:'var(--indigo-500)',color:'#fff',fontWeight:600,cursor:'pointer'}}>Save</button>
</div>
</div>
</div>);
}

window.SettingsScreen = SettingsScreen;
