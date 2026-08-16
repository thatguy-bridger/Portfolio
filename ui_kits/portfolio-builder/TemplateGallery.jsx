function TemplateGallery({onClose}){
const templates=[{n:'Monochrome',c:'indigo'},{n:'Warm Studio',c:'orange'},{n:'Bold Grid',c:'purple'},{n:'Editorial',c:'pink500'}];
return (
<div style={{position:'fixed',inset:0,background:'var(--surface-overlay)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-sans)',zIndex:50}}>
<div style={{background:'var(--surface-panel)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',width:'min(90vw,720px)',maxHeight:'85vh',padding:28,overflowY:'auto'}}>
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
<h3 style={{margin:0,fontSize:24,fontWeight:700,color:'var(--text-heading)'}}>Choose a template</h3>
<button onClick={onClose} style={{background:'none',border:'none',fontSize:20,color:'var(--text-muted)',cursor:'pointer'}}>✕</button>
</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
{templates.map((t,i)=>(
<div key={i} style={{border:'1px solid var(--border-default)',borderRadius:'var(--radius-lg)',overflow:'hidden',cursor:'pointer',transition:'transform .3s var(--ease-standard), box-shadow .3s var(--ease-standard)'}}
onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='var(--shadow-lg)'}}
onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
<div style={{height:110,background:t.c==='pink500'?'linear-gradient(135deg,var(--pink-500),var(--pink-900))':`linear-gradient(135deg,var(--${t.c}-500),var(--${t.c}-600))`}}></div>
<div style={{padding:14}}><div style={{fontWeight:700,fontSize:15,color:'var(--text-heading)'}}>{t.n}</div></div>
</div>))}
</div>
</div>
</div>);
}

window.TemplateGallery = TemplateGallery;
