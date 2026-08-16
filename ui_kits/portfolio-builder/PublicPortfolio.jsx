function PublicPortfolio(){
return (
<div style={{minHeight:'100%',background:'var(--bg)',padding:'56px 24px',fontFamily:'var(--font-sans)'}}>
<div style={{maxWidth:960,margin:'0 auto'}}>
<header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:64}}>
<div style={{fontWeight:800,fontSize:20,color:'var(--text-heading)'}}>Jane Doe</div>
<nav style={{display:'flex',gap:28,fontSize:14,fontWeight:600,color:'var(--text-muted)'}}><span>Work</span><span>About</span><span>Contact</span></nav>
</header>
<section style={{marginBottom:80}}>
<div style={{fontSize:14,fontWeight:600,color:'var(--indigo-400)',letterSpacing:'0.04em',textTransform:'uppercase',marginBottom:12}}>Product Designer</div>
<h1 style={{fontSize:64,fontWeight:800,letterSpacing:'-0.02em',margin:0,lineHeight:1.1,color:'var(--text-heading)'}}>Designing calm, <span style={{background:'linear-gradient(90deg,var(--indigo-400),var(--purple-400))',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>useful</span> software.</h1>
<p style={{fontSize:18,color:'var(--text-body)',maxWidth:560,marginTop:20,lineHeight:1.6}}>I partner with startups to turn fuzzy ideas into shipped products — from first sketch to design system.</p>
</section>
<section style={{marginBottom:80}}>
<h2 style={{fontSize:28,fontWeight:700,color:'var(--text-heading)',marginBottom:24}}>Selected work</h2>
<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
{[{t:'Nimbus Finance',c:'indigo',d:'Redesigning a banking app for clarity'},{t:'Loop Studio',c:'purple',d:'Brand + web for a design collective'},{t:'Fielda',c:'orange',d:'Field-service scheduling, reimagined'}].map((p,i)=>(
<div key={i} style={{background:'var(--surface-glass)',backdropFilter:'var(--blur-glass)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-xl)',padding:24,transition:'transform .3s var(--ease-standard), box-shadow .3s var(--ease-standard)',cursor:'pointer'}}
onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-8px)';e.currentTarget.style.boxShadow='var(--shadow-lg)'}}
onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
<div style={{width:'100%',height:120,borderRadius:'var(--radius-md)',background:`var(--${p.c}-500)`,marginBottom:16,opacity:0.85}}></div>
<h4 style={{margin:'0 0 6px',fontSize:17,fontWeight:700,color:'var(--text-heading)'}}>{p.t}</h4>
<p style={{margin:0,fontSize:13,color:'var(--text-muted)'}}>{p.d}</p>
</div>))}
</div>
</section>
<footer style={{borderTop:'1px solid var(--border-default)',paddingTop:24,display:'flex',justifyContent:'space-between',color:'var(--text-muted)',fontSize:13}}>
<span>© 2026 Jane Doe</span><span>Built with Portfolio Builder</span>
</footer>
</div>
</div>);
}

window.PublicPortfolio = PublicPortfolio;
