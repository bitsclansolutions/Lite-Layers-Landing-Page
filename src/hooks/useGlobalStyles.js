import { useEffect } from 'react';

export function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById('ll-gs')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);

    const s = document.createElement('style');
    s.id = 'll-gs';
    s.textContent = `
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      html { scroll-behavior:smooth; }
      body { overflow-x:hidden; }
      #root { width:100%!important; max-width:100%!important; margin:0!important; border:none!important; min-height:100vh; display:block!important; }

      @keyframes float  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-18px)} }
      @keyframes floatB { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-12px)} }
      @keyframes gradS  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
      @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

      .ll-f1{animation:float  5s   ease-in-out infinite;}
      .ll-f2{animation:floatB 6s   ease-in-out infinite 1.6s;}
      .ll-f3{animation:floatB 7s   ease-in-out infinite 3.2s;}
      .ll-f4{animation:float  5.5s ease-in-out infinite 2.4s;}

      .gb  { background:linear-gradient(135deg,#FF6B35,#E91E8C,#7B2FBE); background-size:200% 200%; animation:gradS 4s ease infinite; }
      .gt  { background:linear-gradient(135deg,#FF6B35,#E91E8C,#7B2FBE); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      .llb { display:inline-flex; align-items:center; gap:10px; color:#fff; border:none; cursor:pointer; text-decoration:none; font-family:inherit; transition:transform .2s,box-shadow .2s; }
      .llb:hover { transform:translateY(-3px); box-shadow:0 22px 55px rgba(233,30,140,.44); }

      *{transition:background-color .28s ease,border-color .28s ease,color .28s ease,box-shadow .28s ease;}
      img,svg{transition:none!important;}

      ::-webkit-scrollbar{width:5px;}
      ::-webkit-scrollbar-thumb{background:linear-gradient(#E91E8C,#7B2FBE);border-radius:4px;}

      @media(max-width:960px){
        .c2{grid-template-columns:1fr!important;}
        .c3{grid-template-columns:1fr!important;}
        .c4{grid-template-columns:repeat(2,1fr)!important;}
        .s4{grid-template-columns:repeat(2,1fr)!important;}
        .mh{display:none!important;}
        .hr{display:none!important;}
      }
      @media(max-width:540px){
        .c4{grid-template-columns:repeat(2,1fr)!important;}
        .s4{grid-template-columns:repeat(2,1fr)!important;}
      }
      @media(max-width:720px){
        .nav-pill{
          width:calc(100vw - 24px)!important;
          left:12px!important;
          transform:none!important;
          padding:10px 14px!important;
        }
        .nav-pill .nav-links{display:none!important;}
        .nav-pill .nav-sep{display:none!important;}
      }
      @media(max-width:960px){
        .ba-wrap{height:300px!important;}
      }
      @media(max-width:540px){
        .ba-wrap{height:240px!important;}
      }
      @media(max-width:960px){
        .up-grid{grid-template-columns:1fr!important;}
      }
    `;
    document.head.appendChild(s);
  }, []);
}
