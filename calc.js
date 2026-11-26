(function(){
const $=i=>document.getElementById(i);
const st={tab:'alq',ag:50,cur:'$',pct1:4,iva1:false,iva1o:false,pv:3,pc:4,ivaC:false,ivaV:false};
const D={};
const num=v=>{v=String(v||'').trim().replace(/\./g,'').replace(',','.');const n=parseFloat(v);return isFinite(n)&&n>0?n:0};
const money=(n,c)=>c+' '+n.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:2});
// formato de miles al escribir
document.querySelectorAll('#calc input[data-m]').forEach(el=>el.addEventListener('input',()=>{
  const raw=el.value.replace(/[^\d,]/g,'');const [i,d]=raw.split(',');
  const s=(i||'').replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  el.value=d!==undefined?s+','+d.slice(0,2):s;calc()}));
document.querySelectorAll('#calc input:not([data-m])').forEach(el=>el.addEventListener('input',calc));
// controles segmentados
function seg(id,key,vals,fmt){const box=$(id);if(!box)return;box.innerHTML='';vals.forEach(v=>{const b=document.createElement('button');b.type='button';b.textContent=fmt?fmt(v):v;b.onclick=()=>{st[key]=v;paint();calc()};b.dataset.v=v;box.append(b)})}
seg('sAg','ag',[50,70,90],v=>v+'%');
seg('sCur','cur',['$','US$'],v=>v==='$'?'Pesos':'Dólares');
seg('sP1','pct1',[1,2,3,4,5],v=>v+'%');
seg('sIva1','iva1',[false,true],v=>v?'Con IVA':'Sin IVA');
seg('sIva1o','iva1o',[false,true],v=>v?'Con IVA':'Sin IVA');
seg('sPv','pv',[1,2,3,4,5],v=>v+'%');
seg('sPc','pc',[1,2,3,4,5],v=>v+'%');
seg('sIvaV','ivaV',[false,true],v=>v?'Con IVA':'Sin IVA');
seg('sIvaC','ivaC',[false,true],v=>v?'Con IVA':'Sin IVA');
const map={sAg:'ag',sCur:'cur',sP1:'pct1',sIva1:'iva1',sIva1o:'iva1o',sPv:'pv',sPc:'pc',sIvaV:'ivaV',sIvaC:'ivaC'};
function paint(){for(const id in map)$(id)?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v)===String(st[map[id]])));
  document.querySelectorAll('.ctab').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===st.tab));
  $('cAlq').hidden=st.tab!=='alq';$('cVen').hidden=st.tab!=='ven';
  document.querySelectorAll('.curs').forEach(e=>e.textContent=st.cur)}
document.querySelectorAll('.ctab').forEach(b=>b.onclick=()=>{st.tab=b.dataset.t;paint();calc()});
const ap=()=>st.ag/100;
function rows(a,c){return a.filter(r=>r.v>0).map(r=>`<div class="crow${r.neg?' neg':''}"><div>${r.l}${r.s?`<small>${r.s}</small>`:''}</div><b>${r.neg?'− ':''}${money(r.v,c)}</b></div>`).join('')||'<p class="cempty">Completá los datos para ver el detalle.</p>'}
function rep(el,base,c){const a=Math.round(st.ag);$(el).innerHTML=base>0?`<div class="rbar"><i style="width:${100-a}%"></i><i style="width:${a}%"></i></div><div class="rl"><span>Oficina ${100-a}%<b>${money(base*(1-ap()),c)}</b></span><span>Agente ${a}%<b>${money(base*ap(),c)}</b></span></div>`:''}
function calc(){
  const c=st.cur,rent=num($('rent').value),m=num($('months').value),dep=num($('dep').value),pct=st.pct1,firm=num($('firm').value),inf=num($('inf').value),res=num($('res').value),own=num($('own').value);
  const hon=rent*m*pct/100,ownV=rent*own,iv=st.iva1?hon*.21:0,tot=Math.max(rent+dep+hon+iv+firm+inf-res,0);
  const list=[{l:'Mes de ingreso',v:rent},{l:'Depósito',v:dep},{l:'Honorarios inmobiliarios',s:pct+'% sobre '+m+' meses',v:hon},{l:'Certificación de firmas',v:firm},{l:'Informes',v:inf},{l:'Reserva ya abonada',v:res,neg:true}];
  if(iv)list.splice(3,0,{l:'IVA 21%',s:'sobre honorarios inmobiliarios',v:iv});
  const ivO=st.iva1o?ownV*.21:0,totO=ownV+ivO;const ol=[{l:'Honorarios inmobiliarios',s:own+' '+(own===1?'mes':'meses')+' de alquiler',v:ownV}];if(ivO)ol.push({l:'IVA 21%',s:'sobre honorarios inmobiliarios',v:ivO});
  $('r1').innerHTML=rows(list,c);$('t1').textContent=money(tot,c);$('r1o').innerHTML=rows(ol,c);$('t1o').textContent=money(totO,c);
  rep('rp1',hon,c);rep('rp1o',ownV,c);
  D.alq={title:'Gastos de alquiler',cur:c,extra:[['Alquiler mensual',money(rent,c)],['Duración',m+' meses']],sections:[{name:'Inquilino',lines:list,tot},{name:'Propietario',lines:ol,tot:totO}],
    reparto:[mk('Reparto · punta inquilino',hon),mk('Reparto · punta propietario',ownV)].filter(g=>g.base>0)};
  const U='US$',p=num($('price').value),pv=st.pv,pc=st.pc,hv=p*pv/100,hc=p*pc/100,net=hv+hc,ivaB=st.ivaC?hc*.21:0,ivaS=st.ivaV?hv*.21:0;
  const side=(n,h,pp,v)=>{const L=[{l:'Honorarios inmobiliarios',s:pp+'% del valor',v:h}];if(v)L.push({l:'IVA 21%',s:'sobre honorarios',v});return{name:n,lines:L,tot:h+v}};
  const sb=side('Comprador',hc,pc,ivaB),ss=side('Vendedor',hv,pv,ivaS);
  $('r2c').innerHTML=rows(sb.lines,U);$('t2c').textContent=money(sb.tot,U);$('r2v').innerHTML=rows(ss.lines,U);$('t2v').textContent=money(ss.tot,U);
  $('t2').textContent=money(sb.tot+ss.tot,U);rep('rp2',net,U);
  D.ven={title:'Compra y venta',cur:U,extra:[['Valor de la propiedad',money(p,U)]],sections:[sb,ss],reparto:[mk('Reparto · honorarios sin IVA',net)].filter(g=>g.base>0)};
  for(const k in D)D[k].totAg=D[k].reparto.reduce((t,g)=>t+g.a,0);
  const x=D[st.tab];const W=$('bt1').querySelector('svg')?.outerHTML||'';$('bt1').innerHTML=W+(st.tab==='alq'?'Al inquilino':'Al comprador');$('bt2').innerHTML=W+(st.tab==='alq'?'Al propietario':'Al vendedor');
}
function mk(n,b){const a=st.ag;return{name:n,base:b,o:b*(1-ap()),a:b*ap(),lo:'Oficina '+(100-a)+'%',la:'Agente '+a+'%'}}
// imagen para WhatsApp
function fit(c,t,w){const o=t;while(t.length>2&&c.measureText(t).width>w)t=t.slice(0,-1);return t===o?t:t.trim()+'…'}
function ls(c,v){if('letterSpacing' in c)c.letterSpacing=v}
function render(d){
  const W=1080,X=96,R=W-96,FS='Lora,Georgia,serif',FB='"DM Sans",system-ui,sans-serif',G='#0f3d2c',GOLD='#c2a05a',IV='#faf3eb',MUT='#6f6c63',TX='#1b1b19',LN='#e8dfd1';
  const secs=d.sections.map(s=>({name:s.name,tot:s.tot,L:s.lines.filter(r=>r.v>0)})).filter(s=>s.tot>0);
  let H=520+d.info.length*58+20;secs.forEach(s=>{H+=50;s.L.forEach(r=>H+=r.s?106:84);H+=146});
  if(d.reparto){d.reparto.forEach(()=>H+=50+84*3+36);H+=146}H+=150;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  c.fillStyle=IV;c.fillRect(0,0,W,H);c.fillStyle=G;c.fillRect(0,0,W,320);c.fillStyle=GOLD;c.fillRect(0,320,W,8);
  c.textAlign='center';c.fillStyle=IV;c.font='700 120px '+FS;c.fillText('Veltri',W/2,150);
  c.font='500 22px '+FB;ls(c,'14px');const tw=c.measureText('PROPIEDADES').width;c.fillText('PROPIEDADES',W/2+7,206);ls(c,'0px');
  c.fillStyle=GOLD;c.fillRect(W/2-tw/2-64,199,44,3);c.fillRect(W/2+tw/2+20,199,44,3);
  c.font='600 25px '+FB;ls(c,'9px');c.fillText('CALCULADORA DE HONORARIOS',W/2+4,272);ls(c,'0px');
  c.textAlign='left';c.fillStyle=G;c.font='700 58px '+FS;c.fillText(d.title,X,410);
  c.fillStyle=MUT;c.font='400 25px '+FB;c.fillText(new Date().toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'}),X,454);
  if(d.internal){c.textAlign='right';c.fillStyle=GOLD;c.font='700 22px '+FB;ls(c,'6px');c.fillText('USO INTERNO',R,454);ls(c,'0px')}
  let y=520;
  d.info.forEach(r=>{c.textAlign='left';c.fillStyle=MUT;c.font='400 26px '+FB;c.fillText(r[0],X,y);c.textAlign='right';c.fillStyle=TX;c.font='500 28px '+FB;c.fillText(fit(c,r[1],560),R,y);y+=58});y+=20;
  secs.forEach(s=>{c.textAlign='left';c.fillStyle=GOLD;c.font='700 24px '+FB;ls(c,'7px');c.fillText(s.name.toUpperCase(),X,y+30);ls(c,'0px');y+=50;
    s.L.forEach(r=>{const rh=r.s?106:84;c.textAlign='left';c.fillStyle=TX;c.font='400 31px '+FB;c.fillText(r.l,X,y+38);
      if(r.s){c.fillStyle=MUT;c.font='400 23px '+FB;c.fillText(r.s,X,y+76)}
      c.textAlign='right';c.fillStyle=r.neg?'#a3473b':TX;c.font='500 33px '+FB;c.fillText((r.neg?'− ':'')+money(r.v,d.cur),R,y+38);
      c.fillStyle=LN;c.fillRect(X,y+rh-14,R-X,2);y+=rh});
    c.fillStyle=G;c.fillRect(X,y+10,R-X,3);c.textAlign='left';c.fillStyle=MUT;c.font='600 22px '+FB;ls(c,'6px');c.fillText('TOTAL A PAGAR',X,y+70);ls(c,'0px');
    c.textAlign='right';c.fillStyle=G;c.font='700 60px '+FS;c.fillText(money(s.tot,d.cur),R,y+78);y+=146});
  if(d.reparto){d.reparto.forEach(g=>{c.textAlign='left';c.fillStyle=GOLD;c.font='700 24px '+FB;ls(c,'7px');c.fillText(g.name.toUpperCase(),X,y+30);ls(c,'0px');y+=50;
      [['Honorarios cobrados',g.base,0],[g.lo,g.o,0],[g.la,g.a,1]].forEach(r=>{c.textAlign='left';c.fillStyle=TX;c.font=(r[2]?'700 ':'400 ')+'31px '+FB;c.fillText(r[0],X,y+38);
        c.textAlign='right';c.font=(r[2]?'700 ':'500 ')+'33px '+FB;c.fillText(money(r[1],d.cur),R,y+38);c.fillStyle=LN;c.fillRect(X,y+70,R-X,2);y+=84});y+=36});
    c.fillStyle=G;c.fillRect(X,y+10,R-X,4);c.textAlign='left';c.fillStyle=MUT;c.font='600 22px '+FB;ls(c,'6px');c.fillText('TOTAL PARA EL AGENTE',X,y+70);ls(c,'0px');
    c.textAlign='right';c.fillStyle=G;c.font='700 60px '+FS;c.fillText(money(d.totAg,d.cur),R,y+78);y+=146}
  y+=40;c.textAlign='center';c.fillStyle=MUT;c.font='400 22px '+FB;c.fillText('Valores estimados. Confirmá los montos finales con tu asesora.',W/2,y+24);
  if(d.ag){c.fillStyle=G;c.font='500 27px '+FB;c.fillText('Preparado por '+fit(c,d.ag,700),W/2,y+70)}
  return new Promise(r=>cv.toBlob(r,'image/png'));
}
const draw=d=>Promise.all(['700 40px Lora','400 24px "DM Sans"','500 24px "DM Sans"','600 24px "DM Sans"','700 24px "DM Sans"'].map(f=>document.fonts.load(f))).catch(()=>{}).then(()=>render(d));
function toast(m){const t=$('ctoast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),3500)}
function save(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.append(a);a.click();a.remove();toast('Imagen descargada. Adjuntala en el chat de WhatsApp.')}
function send(idx,internal){calc();const x=D[st.tab];const secs=idx==null?x.sections:[x.sections[idx]];
  if(!secs.some(s=>s.tot>0)){toast('Cargá los valores primero.');return}
  const ttl=internal?'Liquidación completa':idx==null?x.title:('Gastos del '+secs[0].name.toLowerCase());
  const info=[],cli=$('cli').value.trim(),dir=$('cdir').value.trim(),ag=$('cag').value.trim();
  if(cli)info.push(['Para',cli]);if(dir)info.push(['Propiedad',dir]);info.push(...x.extra);
  const n=(internal?'liquidacion-completa':'honorarios')+'.png';
  draw({title:ttl,sections:secs,reparto:internal?x.reparto:null,totAg:x.totAg,internal,cur:x.cur,info,ag}).then(b=>{const f=new File([b],n,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f],title:ttl}).catch(e=>{if(e?.name!=='AbortError')save(b,n)});save(b,n)})}
$('bt1').onclick=()=>send(0);$('bt2').onclick=()=>send(1);$('btL').onclick=()=>send(null,true);
paint();calc();
})();
