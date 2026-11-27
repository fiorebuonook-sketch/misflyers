(function(){
const $=id=>document.getElementById(id);
const pages=[];let uid=0,pdfCache=null;
const MAX=2400;
const SIZES={a4:[595.28,841.89],letter:[612,792],legal:[612,1008]};
const MODES=[['auto','Color mejorado'],['doc','Blanco y negro'],['gray','Grises'],['orig','Original']];
const ICON={up:'<path d="m15 6-6 6 6 6"/>',down:'<path d="m9 6 6 6-6 6"/>',rot:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',del:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',crop:'<path d="M6 2v16h16"/><path d="M2 6h16v16"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICON[k]}</svg>`;
const tick=()=>new Promise(r=>setTimeout(r));
function say(t,err){const m=$('smsg');m.textContent=t;m.classList.toggle('err',!!err)}
const libs={};
function lib(url,name){return libs[url]||(libs[url]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=url;s.onload=()=>window[name]?res(window[name]):rej(new Error('lib'));s.onerror=()=>{delete libs[url];rej(new Error('lib'))};document.head.appendChild(s)}))}
function toCanvas(src,w,h){const s=Math.min(1,MAX/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingQuality='high';x.drawImage(src,0,0,c.width,c.height);return c}
async function nativeDecode(blob){
  if(window.createImageBitmap){try{const b=await createImageBitmap(blob,{imageOrientation:'from-image'});const c=toCanvas(b,b.width,b.height);b.close&&b.close();return c}catch(e){}}
  return new Promise((res,rej)=>{const u=URL.createObjectURL(blob),i=new Image();i.onload=()=>{const c=toCanvas(i,i.naturalWidth,i.naturalHeight);URL.revokeObjectURL(u);res(c)};i.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('native'))};i.src=u});
}
async function sniff(file){const b=new Uint8Array(await file.slice(0,16).arrayBuffer());const s=String.fromCharCode(...b);
  if(s.slice(4,8)==='ftyp'&&/hei|hev|mif1|msf1|heix/.test(s.slice(8,16)))return'heic';
  if((b[0]===73&&b[1]===73&&b[2]===42)||(b[0]===77&&b[1]===77&&b[3]===42))return'tiff';return''}
async function decode(file){
  try{return await nativeDecode(file)}catch(e){}
  const ext=(file.name.split('.').pop()||'').toLowerCase(),kind=await sniff(file)||({heic:'heic',heif:'heic',tif:'tiff',tiff:'tiff'})[ext];
  if(kind==='heic'){
    const h=await lib('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js','heic2any');
    let out=await h({blob:file,toType:'image/jpeg',quality:.95});if(Array.isArray(out))out=out[0];
    return nativeDecode(out);
  }
  if(kind==='tiff'){
    const U=await lib('https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js','UTIF');
    const buf=await file.arrayBuffer(),ifds=U.decode(buf);U.decodeImage(buf,ifds[0]);
    const rgba=U.toRGBA8(ifds[0]),w=ifds[0].width,h=ifds[0].height,c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer,rgba.byteOffset,w*h*4),w,h),0,0);
    return toCanvas(c,w,h);
  }
  throw new Error('formato');
}
function detectAll(src){
  const s=360/Math.max(src.width,src.height),w=Math.max(8,Math.round(src.width*s)),h=Math.max(8,Math.round(src.height*s));
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingQuality='high';x.drawImage(src,0,0,w,h);
  const a=x.getImageData(0,0,w,h).data,n=w*h,L=new Float32Array(n),hist=new Float64Array(256);
  for(let i=0;i<n;i++){const r=a[i*4],g=a[i*4+1],b=a[i*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    const v=Math.max(0,Math.min(255,(r*.299+g*.587+b*.114)-(mx-mn)*.6));L[i]=v;hist[v|0]++}
  let sum=0;for(let v=0;v<256;v++)sum+=v*hist[v];
  let sb=0,wb=0,best=0,t=128;for(let v=0;v<256;v++){wb+=hist[v];if(!wb)continue;const wf=n-wb;if(!wf)break;sb+=v*hist[v];const mb=sb/wb,mf=(sum-sb)/wf,bt=wb*wf*(mb-mf)**2;if(bt>best){best=bt;t=v}}
  const lab=new Int32Array(n).fill(-1),q=new Int32Array(n),comps=[];let id=0;
  const flood=(start,ok,mark)=>{let hd=0,tl=0,cnt=0;q[tl++]=start;mark(start);while(hd<tl){const j=q[hd++];cnt++;const X=j%w,Y=(j/w)|0;
    for(const k of [X>0?j-1:-1,X<w-1?j+1:-1,Y>0?j-w:-1,Y<h-1?j+w:-1])if(k>=0&&ok(k)){mark(k);q[tl++]=k}}return cnt};
  for(let i=0;i<n;i++){if(lab[i]!==-1||L[i]<=t)continue;const cid=id++;const cnt=flood(i,k=>lab[k]===-1&&L[k]>t,k=>{lab[k]=cid});comps.push({id:cid,cnt})}
  comps.sort((p,q)=>q.cnt-p.cnt);
  const big=comps.length?comps[0].cnt:0,out=[];
  for(const cp of comps.slice(0,6)){
    if(cp.cnt<n*.02||cp.cnt<big*.25)break;
    let tl=[0,0],tr=[0,0],br=[0,0],bl=[0,0],a1=1e9,a2=-1e9,a3=-1e9,a4=1e9;
    for(let i=0;i<n;i++){if(lab[i]!==cp.id)continue;const X=i%w,Y=(i/w)|0;
      if(X+Y<a1){a1=X+Y;tl=[X,Y]}if(X+Y>a2){a2=X+Y;br=[X,Y]}if(X-Y>a3){a3=X-Y;tr=[X,Y]}if(X-Y<a4){a4=X-Y;bl=[X,Y]}}
    const quad=[tl,tr,br,bl],area=Math.abs(quad.reduce((acc,p,i)=>{const o=quad[(i+1)%4];return acc+p[0]*o[1]-o[0]*p[1]},0))/2;
    if(area<n*.02||area>n*.985)continue;
    const seen=new Uint8Array(n);let outside=0;
    for(let i=0;i<n;i++){const X=i%w,Y=(i/w)|0;if((X===0||Y===0||X===w-1||Y===h-1)&&!seen[i]&&lab[i]!==cp.id)outside+=flood(i,k=>!seen[k]&&lab[k]!==cp.id,k=>{seen[k]=1})}
    if((n-outside)/area<.85)continue;
    out.push(quad.map(([X,Y])=>[(X+.5)/s,(Y+.5)/s]));
  }
  const ctr=q4=>[q4.reduce((v,p)=>v+p[0],0)/4,q4.reduce((v,p)=>v+p[1],0)/4],rowH=src.height*.25;
  return out.sort((p,q)=>{const A=ctr(p),B=ctr(q);return Math.abs(A[1]-B[1])>rowH?A[1]-B[1]:A[0]-B[0]});
}
function solve(A,b){const n=b.length;for(let i=0;i<n;i++){let m=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[m][i]))m=r;[A[i],A[m]]=[A[m],A[i]];[b[i],b[m]]=[b[m],b[i]];
  for(let r=i+1;r<n;r++){const f=A[r][i]/A[i][i];for(let k=i;k<n;k++)A[r][k]-=f*A[i][k];b[r]-=f*b[i]}}
  const x=new Array(n);for(let i=n-1;i>=0;i--){let v=b[i];for(let k=i+1;k<n;k++)v-=A[i][k]*x[k];x[i]=v/A[i][i]}return x}
function warp(src,quad){
  const d=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]),[tl,tr,br,bl]=quad;
  let W=Math.max(d(tl,tr),d(bl,br)),H=Math.max(d(tl,bl),d(tr,br));const k=Math.min(1,MAX/Math.max(W,H));W=Math.max(2,Math.round(W*k));H=Math.max(2,Math.round(H*k));
  const dst=[[0,0],[W,0],[W,H],[0,H]],A=[],b=[];
  for(let i=0;i<4;i++){const[u,v]=dst[i],[X,Y]=quad[i];A.push([u,v,1,0,0,0,-u*X,-v*X]);b.push(X);A.push([0,0,0,u,v,1,-u*Y,-v*Y]);b.push(Y)}
  const m=solve(A,b),sw=src.width,sh=src.height,si=src.getContext('2d',{willReadFrequently:true}).getImageData(0,0,sw,sh).data;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),out=x.createImageData(W,H),o=out.data;
  for(let v=0;v<H;v++)for(let u=0;u<W;u++){const z=m[6]*u+m[7]*v+1;let X=(m[0]*u+m[1]*v+m[2])/z,Y=(m[3]*u+m[4]*v+m[5])/z;
    X=Math.max(0,Math.min(sw-1.001,X));Y=Math.max(0,Math.min(sh-1.001,Y));const x0=X|0,y0=Y|0,fx=X-x0,fy=Y-y0,i0=(y0*sw+x0)*4,i1=i0+sw*4,j=(v*W+u)*4;
    for(let ch=0;ch<3;ch++)o[j+ch]=(si[i0+ch]*(1-fx)+si[i0+4+ch]*fx)*(1-fy)+(si[i1+ch]*(1-fx)+si[i1+4+ch]*fx)*fy;o[j+3]=255}
  x.putImageData(out,0,0);return c;
}
function background(src){
  const W=src.width,H=src.height,k=Math.max(8,Math.round(Math.max(W,H)/48)),w=Math.max(4,Math.round(W/k)),h=Math.max(4,Math.round(H/k));
  const s=document.createElement('canvas');s.width=w;s.height=h;const x=s.getContext('2d',{willReadFrequently:true});x.imageSmoothingQuality='high';x.drawImage(src,0,0,w,h);
  let d=x.getImageData(0,0,w,h),a=d.data;
  for(let pass=0;pass<5;pass++){const b=new Uint8ClampedArray(a);
    for(let y=0;y<h;y++)for(let X=0;X<w;X++){const o=(y*w+X)*4;let r=0,g=0,bl=0,best=-1;
      for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){const xx=X+dx;if(xx<0||xx>=w)continue;const q=(yy*w+xx)*4,l=b[q]*3+b[q+1]*6+b[q+2];if(l>best){best=l;r=b[q];g=b[q+1];bl=b[q+2]}}}
      a[o]=r;a[o+1]=g;a[o+2]=bl}}
  x.putImageData(d,0,0);x.filter='blur(2px)';x.drawImage(s,0,0);x.filter='none';
  {const e=x.getImageData(0,0,w,h),q=e.data,ls=[];for(let i=0;i<q.length;i+=4)ls.push(q[i]*.299+q[i+1]*.587+q[i+2]*.114);ls.sort((p,r)=>p-r);
   const floor=ls[(ls.length*.9)|0]*.4;for(let i=0;i<q.length;i+=4){const l=q[i]*.299+q[i+1]*.587+q[i+2]*.114;if(l<floor&&l>0){const f=floor/l;q[i]*=f;q[i+1]*=f;q[i+2]*=f}}x.putImageData(e,0,0)}
  const big=document.createElement('canvas');big.width=W;big.height=H;const bx=big.getContext('2d',{willReadFrequently:true});bx.imageSmoothingQuality='high';bx.drawImage(s,0,0,W,H);
  return bx.getImageData(0,0,W,H).data;
}
function pct(hist,n,p){let acc=0;for(let v=0;v<256;v++){acc+=hist[v];if(acc>=n*p)return v}return 255}
function enhance(src,mode){
  const c=document.createElement('canvas');c.width=src.width;c.height=src.height;
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0);
  if(mode==='orig')return c;
  const d=x.getImageData(0,0,c.width,c.height),a=d.data,n=a.length/4,hist=new Uint32Array(256);
  if(mode==='gray'){
    for(let i=0;i<a.length;i+=4){const l=(a[i]*.299+a[i+1]*.587+a[i+2]*.114)|0;a[i]=l;hist[l]++}
    const lo=pct(hist,n,.005),hi=Math.max(lo+20,pct(hist,n,.995));
    for(let i=0;i<a.length;i+=4){const v=(a[i]-lo)*255/(hi-lo);a[i]=a[i+1]=a[i+2]=v}
  }else{
    const bg=background(src);
    for(let i=0;i<a.length;i+=4){
      const L=a[i]*.299+a[i+1]*.587+a[i+2]*.114,BL=Math.max(24,bg[i]*.299+bg[i+1]*.587+bg[i+2]*.114),r=Math.min(1,L/(BL*.9));
      hist[(r*255)|0]++;
      if(mode==='auto'){for(let ch=0;ch<3;ch++)a[i+ch]=Math.min(255,a[i+ch]/Math.max(24,bg[i+ch]*.9)*255)}
      else a[i]=r*255;
    }
    const lo=Math.min(pct(hist,n,.01),150),span=Math.max(40,250-lo);
    const lut=new Uint8ClampedArray(256);
    for(let v=0;v<256;v++){const t=Math.max(0,Math.min(1,(v-lo)/span));lut[v]=255*(mode==='doc'?Math.pow(t,1.6):Math.pow(t,1.15))}
    for(let i=0;i<a.length;i+=4){
      if(mode==='doc'){a[i]=a[i+1]=a[i+2]=lut[a[i]];continue}
      const r=lut[a[i]],g=lut[a[i+1]],b=lut[a[i+2]],m=(r+g+b)/3,sat=1.2;
      a[i]=m+(r-m)*sat;a[i+1]=m+(g-m)*sat;a[i+2]=m+(b-m)*sat;
    }
  }
  if(mode!=='orig')sharpen(a,c.width,c.height,mode==='doc'?.9:.6);
  x.putImageData(d,0,0);return c;
}
function sharpen(a,w,h,amt){const src=new Uint8ClampedArray(a);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;
    for(let ch=0;ch<3;ch++){const v=src[i+ch],bl=(src[i+ch-4]+src[i+ch+4]+src[i+ch-w*4]+src[i+ch+w*4]+v*4)/8;a[i+ch]=v+(v-bl)*amt*2}}}
function rotated(c,rot){if(!rot)return c;const o=document.createElement('canvas');o.width=rot%180?c.height:c.width;o.height=rot%180?c.width:c.height;const x=o.getContext('2d');x.translate(o.width/2,o.height/2);x.rotate(rot*Math.PI/180);x.drawImage(c,-c.width/2,-c.height/2);return o}
function finalCanvas(p){const key=p.mode+'|'+(p.quad?p.quad.flat().map(v=>v|0).join(','):'');if(!p.out||p.key!==key){p.out=enhance(p.quad?warp(p.src,p.quad):p.src,p.mode);p.key=key}return rotated(p.out,p.rot)}
function thumb(p){const c=finalCanvas(p),s=Math.min(1,700/Math.max(c.width,c.height)),t=document.createElement('canvas');t.width=Math.round(c.width*s);t.height=Math.round(c.height*s);const x=t.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(c,0,0,t.width,t.height);p.thumb=t.toDataURL('image/jpeg',.9)}
async function add(files){
  const list=[...files].filter(f=>f.type.startsWith('image/')||/\.(heic|heif|avif|webp|tiff?|bmp|gif|jfif|jpe?g|png)$/i.test(f.name));
  if(!list.length){say('Esos archivos no son imágenes.',1);return}
  let bad=0,found=0;
  for(let i=0;i<list.length;i++){
    say(`Procesando foto ${i+1} de ${list.length}…`);await tick();
    try{const src=await decode(list[i]);const qs=detectAll(src);
      if(qs.length>1)found+=qs.length;
      for(const q of (qs.length?qs:[null])){const p={id:++uid,src,rot:0,mode:$('sallf').value,quad:q,auto:q};thumb(p);pages.push(p)}
      changed()}
    catch(e){bad++}
  }
  if(found&&!bad)say(`Encontré ${found} documentos en la misma foto y los separé en páginas. Para frente y dorso en una hoja, elegí “2 por hoja”.`);
  if(bad)say(bad===1?'Una imagen no se pudo abrir. Si es HEIC, revisá tener conexión a internet la primera vez.':`${bad} imágenes no se pudieron abrir.`,1);
}
function changed(){pdfCache=null;draw()}
function draw(){
  const g=$('sgrid');
  $('smake').disabled=$('ssend').disabled=!pages.length;
  $('sbar').hidden=!pages.length;
  if(!pages.length){g.innerHTML='<p class="sempty">Las páginas que agregues van a aparecer acá, en el orden del PDF.</p>';say('Sin páginas todavía.');return}
  g.innerHTML=pages.map((p,i)=>`<article class="spg" data-id="${p.id}">
    <button class="sth" data-a="zoom" aria-label="Ampliar página ${i+1}"><img src="${p.thumb}" alt=""></button>
    <div class="sn">Pág. ${i+1}<button class="sic" data-a="del" aria-label="Borrar página ${i+1}">${svg('del')}</button></div>
    <div class="srow"><button class="sic" data-a="up" aria-label="Mover antes" ${i?'':'disabled'}>${svg('up')}</button><button class="sic" data-a="down" aria-label="Mover después" ${i<pages.length-1?'':'disabled'}>${svg('down')}</button><button class="sic" data-a="rot" aria-label="Rotar">${svg('rot')}</button><button class="sic" data-a="crop" aria-label="Ajustar bordes">${svg('crop')}</button></div>
    <select data-a="mode" aria-label="Modo de la página ${i+1}">${MODES.map(([v,t])=>`<option value="${v}"${p.mode===v?' selected':''}>${t}</option>`).join('')}</select>
  </article>`).join('');
  say(pages.length+(pages.length>1?' páginas listas.':' página lista.'));
}
$('sgrid').addEventListener('click',e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;
  const i=pages.findIndex(p=>p.id==b.closest('.spg').dataset.id),p=pages[i],a=b.dataset.a;
  if(a==='zoom'){$('sbig').src=finalCanvas(p).toDataURL('image/jpeg',.9);$('sview').classList.add('on');return}
  if(a==='crop'){openEd(p);return}
  if(a==='up'&&i>0)[pages[i-1],pages[i]]=[pages[i],pages[i-1]];
  if(a==='down'&&i<pages.length-1)[pages[i+1],pages[i]]=[pages[i],pages[i+1]];
  if(a==='rot'){p.rot=(p.rot+90)%360;thumb(p)}
  if(a==='del')pages.splice(i,1);
  changed();
});
let edP=null,edQ=null,edK=1,drag=-1;
function full(p){const w=p.src.width,h=p.src.height;return[[0,0],[w,0],[w,h],[0,h]]}
function openEd(p){
  edP=p;edQ=(p.quad||p.auto||full(p)).map(q=>q.slice());
  const mw=Math.min(innerWidth-32,900),mh=innerHeight-190;edK=Math.min(mw/p.src.width,mh/p.src.height);
  const c=$('sedc');c.width=Math.round(p.src.width*edK);c.height=Math.round(p.src.height*edK);c.getContext('2d').drawImage(p.src,0,0,c.width,c.height);
  $('sstage').style.width=c.width+'px';$('sstage').style.height=c.height+'px';
  $('sedHint').textContent='Arrastrá los 4 círculos hasta las esquinas de la hoja.';$('sed').classList.add('on');edDraw();
}
function edDraw(){const P=edQ.map(([x,y])=>[x*edK,y*edK]);
  $('seds').innerHTML=`<polygon points="${P.map(p=>p.join(',')).join(' ')}" fill="rgba(194,160,90,.22)" stroke="#e2cf9f" stroke-width="2"/>`+P.map((p,i)=>`<circle data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="16"/>`).join('')}
const eds=$('seds');
eds.addEventListener('pointerdown',e=>{const c=e.target.closest('circle');if(!c)return;drag=+c.dataset.i;eds.setPointerCapture(e.pointerId);e.preventDefault()});
eds.addEventListener('pointermove',e=>{if(drag<0)return;const r=eds.getBoundingClientRect();
  edQ[drag]=[Math.max(0,Math.min(edP.src.width,(e.clientX-r.left)/edK)),Math.max(0,Math.min(edP.src.height,(e.clientY-r.top)/edK))];edDraw()});
eds.addEventListener('pointerup',()=>{drag=-1});eds.addEventListener('pointercancel',()=>{drag=-1});
$('sedAuto').addEventListener('click',()=>{const all=detectAll(edP.src);if(!all.length){$('sedHint').textContent='No pude detectar la hoja: ajustá las esquinas a mano.';return}
  const cx=q=>[q.reduce((v,p)=>v+p[0],0)/4,q.reduce((v,p)=>v+p[1],0)/4],c0=cx(edQ);all.sort((p,q)=>{const a=cx(p),b=cx(q);return Math.hypot(a[0]-c0[0],a[1]-c0[1])-Math.hypot(b[0]-c0[0],b[1]-c0[1])});
  edQ=all[0].map(v=>v.slice());edDraw()});
$('sedMore').addEventListener('click',async()=>{const f=full(edP),same=edQ.every((q,i)=>Math.hypot(q[0]-f[i][0],q[1]-f[i][1])<2);edP.quad=same?null:edQ;thumb(edP);
  const w=edP.src.width,h=edP.src.height,np={id:++uid,src:edP.src,rot:0,mode:edP.mode,quad:null,auto:null};
  pages.splice(pages.indexOf(edP)+1,0,np);thumb(np);changed();openEd(np);edQ=[[w*.25,h*.25],[w*.75,h*.25],[w*.75,h*.75],[w*.25,h*.75]];edDraw();
  $('sedHint').textContent='Nueva página de la misma foto: marcá las esquinas del otro documento.'});
$('sedFull').addEventListener('click',()=>{edQ=full(edP);edDraw()});
$('sedNo').addEventListener('click',()=>{$('sed').classList.remove('on')});
$('sedOk').addEventListener('click',async()=>{const f=full(edP),same=edQ.every((q,i)=>Math.hypot(q[0]-f[i][0],q[1]-f[i][1])<2);edP.quad=same?null:edQ;$('sed').classList.remove('on');say('Aplicando…');await tick();thumb(edP);changed()});
$('sview').addEventListener('click',()=>$('sview').classList.remove('on'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('sview').classList.remove('on');$('sed').classList.remove('on')}});
$('sgrid').addEventListener('change',async e=>{
  if(e.target.dataset.a!=='mode')return;
  const p=pages.find(p=>p.id==e.target.closest('.spg').dataset.id);p.mode=e.target.value;say('Aplicando…');await tick();thumb(p);changed();
});
$('sallf').addEventListener('change',async e=>{say('Aplicando a todas…');await tick();for(const p of pages){p.mode=e.target.value;thumb(p)}changed()});
$('ssize').addEventListener('change',()=>{pdfCache=null});$('sper').addEventListener('change',()=>{pdfCache=null});
$('sfname').addEventListener('input',()=>{pdfCache=null});
for(const id of ['scam','sgal'])$(id).addEventListener('change',e=>{add(e.target.files);e.target.value=''});
const dz=$('sdrop');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');add(e.dataTransfer.files)});
function jpeg(c,q){return new Promise(r=>c.toBlob(b=>b.arrayBuffer().then(x=>r(new Uint8Array(x))),'image/jpeg',q))}
async function buildPDF(imgs,size,per){
  const enc=new TextEncoder(),parts=[],offs=[];let len=0;
  const put=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length};
  put(new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10]));
  const f=v=>v.toFixed(2),obj=(k,s)=>{offs[k]=len;put(k+' 0 obj\n'+s+'\nendobj\n')};
  const sheets=[];for(let i=0;i<imgs.length;i+=per)sheets.push(imgs.slice(i,i+per));
  let next=3;const plan=sheets.map(sh=>({page:next++,content:next++,ims:sh.map(()=>next++)}));
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,`<< /Type /Pages /Count ${plan.length} /Kids [${plan.map(p=>p.page+' 0 R').join(' ')}] >>`);
  plan.forEach((pl,si)=>{
    const sh=sheets[si],m=size==='fit'&&per===1?0:18;let W,H;
    if(size==='fit'&&per===1){W=595.28;H=W*sh[0].h/sh[0].w}else[W,H]=SIZES[size==='fit'?'a4':size].slice();
    if(per===1&&size!=='fit'&&sh[0].w>sh[0].h)[W,H]=[H,W];
    let cs='';
    sh.forEach((im,j)=>{
      let sx=m,sy=m,sw=W-2*m,shh=H-2*m;
      if(per===2){shh=(H-3*m)/2;sy=j===0?H-m-shh:m;sw=Math.min(sw,W*.62)+0;sx=(W-sw)/2}
      const k=Math.min(sw/im.w,shh/im.h),dw=im.w*k,dh=im.h*k;
      cs+=`q ${f(dw)} 0 0 ${f(dh)} ${f(sx+(sw-dw)/2)} ${f(sy+(shh-dh)/2)} cm /Im${j} Do Q\n`;
    });
    obj(pl.page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(W)} ${f(H)}] /Resources << /XObject << ${pl.ims.map((n,j)=>`/Im${j} ${n} 0 R`).join(' ')} >> >> /Contents ${pl.content} 0 R >>`);
    obj(pl.content,`<< /Length ${cs.length} >>\nstream\n${cs}endstream`);
    sh.forEach((im,j)=>{const k=pl.ims[j];offs[k]=len;
      put(`${k} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`);
      put(im.bytes);put('\nendstream\nendobj\n')});
  });
  const xref=len;let t=`xref\n0 ${next}\n0000000000 65535 f \n`;
  for(let k=1;k<next;k++)t+=String(offs[k]).padStart(10,'0')+' 00000 n \n';
  put(t+`trailer\n<< /Size ${next} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
function fileName(){return(($('sfname').value||'').trim().replace(/[\\/:*?"<>|]+/g,'-')||'escaneo')+'.pdf'}
async function getPDF(){
  if(pdfCache)return pdfCache;
  const imgs=[];
  for(let i=0;i<pages.length;i++){say(`Armando página ${i+1} de ${pages.length}…`);await tick();const c=finalCanvas(pages[i]);imgs.push({w:c.width,h:c.height,bytes:await jpeg(c,pages[i].mode==='orig'?.9:.85)})}
  const blob=await buildPDF(imgs,$('ssize').value,+$('sper').value),name=fileName();
  pdfCache={blob,name,file:new File([blob],name,{type:'application/pdf'}),mb:(blob.size/1048576).toFixed(1)};
  return pdfCache;
}
async function save(pdf,tip){
  const a=document.createElement('a');a.href=URL.createObjectURL(pdf.blob);a.download=pdf.name;document.body.appendChild(a);a.click();a.remove();
  say(tip||`PDF generado: ${pdf.name} (${pdf.mb} MB).`);return true;
}
async function run(fn){$('smake').disabled=$('ssend').disabled=true;try{await fn()}catch(e){say('Algo falló al crear el PDF.',1)}$('smake').disabled=$('ssend').disabled=!pages.length}
$('smake').addEventListener('click',()=>run(async()=>{await save(await getPDF())}));
$('ssend').addEventListener('click',()=>run(async()=>{
  const pdf=await getPDF();
  if(navigator.canShare&&navigator.share){
    try{if(navigator.canShare({files:[pdf.file]})){await navigator.share({files:[pdf.file]});say('Enviado. ¡Listo!');return}}
    catch(e){if(e&&e.name==='AbortError'){say('Envío cancelado.');return}}
  }
  await save(pdf,`Se guardó “${pdf.name}”. En WhatsApp abrí el chat, tocá el clip › Documento y elegilo.`);
}));
draw();
})();
