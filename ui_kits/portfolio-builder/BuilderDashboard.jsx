function BuilderDashboard({onOpenGallery,onOpenSettings}){
const [sections,setSections]=React.useState([
{id:1,name:'Hero',color:'indigo'},{id:2,name:'Work grid',color:'purple'},{id:3,name:'About',color:'orange'},{id:4,name:'Contact',color:'pink'}
]);
return (
<div style={{display:'flex',height:'100%',fontFamily:'var(--font-sans)',background:'var(--bg)'}}>
<div style={{width:260,borderRight:'1px solid var(--border-default)',padding:24,display:'flex',flexDirection:'column',gap:8}}>
<div style={{fontWeight:800,fontSize:18,color:'var(--text-heading)',marginBottom:20}}>Jane's site</div>
{sections.map(s=>(
<div key={s.id} draggable style={{
display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:'var(--radius-md)',
background:'var(--surface-card)',border:'1px solid var(--border-default)',cursor:'grab',
transition:'transform .3s var(--ease-bounce)'
}}>
<span style={{color:'var(--text-muted)'}}>⠿</span>
<span style={{width:8,height:8,borderRadius:'50%',background:`var(--${s.color}-500)`}}></span>
<span style={{fontSize:14,fontWeight:600,color:'var(--text-heading)'}}>{s.name}</span>
</div>))}
<button onClick={onOpenGallery} style={{marginTop:8,padding:'10px 16px',borderRadius:'var(--radius-pill)',border:'1px dashed var(--border-strong)',background:'none',color:'var(--text-muted)',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Add section</button>
</div>
<div style={{flex:1,padding:32,overflowY:'auto'}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
<h2 style={{margin:0,fontSize:22,fontWeight:700,color:'var(--text-heading)'}}>Live preview</h2>
<div style={{display:'flex',gap:10}}>
<button onClick={onOpenSettings} style={{width:40,height:40,borderRadius:'50%',border:'1px solid var(--border-default)',background:'var(--surface-card)',color:'var(--text-body)',cursor:'pointer'}}>⚙</button>
<button style={{padding:'10px 22px',borderRadius:'var(--radius-pill)',background:'var(--indigo-500)',color:'#fff',border:'none',fontWeight:600,cursor:'pointer',boxShadow:'var(--shadow-sm)'}}>Publish</button>
</div>
</div>
<div style={{border:'1px solid var(--border-default)',borderRadius:'var(--radius-xl)',padding:24,background:'var(--surface-panel)',minHeight:340}}>
<div style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Preview — janedoe.portfoliobuilder.co</div>
<div style={{height:64,borderRadius:'var(--radius-md)',background:'linear-gradient(90deg,var(--indigo-600),var(--purple-600))',marginBottom:14}}></div>
<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
{[0,1,2].map(i=>(<div key={i} style={{height:70,borderRadius:'var(--radius-md)',background:'var(--surface-card)',border:'1px solid var(--border-default)'}}></div>))}
</div>
</div>
</div>
</div>);
}

window.BuilderDashboard = BuilderDashboard;
