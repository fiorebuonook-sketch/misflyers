(function(){
const P={nombre:'Mónica Feltrinelli',corto:'Mónica',cargo:'Asesora inmobiliaria',zona:'Bernal · Quilmes',tel:'11 5045-3972',wa:'5491150453972',telI:'+541150453972',mail:'moni@veltripropiedades.com.ar',ig:'monicafeltrinelli_realestate'};
const $=s=>document.querySelector(s);
const base=location.origin+location.pathname;
const msg=()=>`¡Hola! Soy ${P.nombre}, ${P.cargo.toLowerCase()} de Veltri Propiedades. Te dejo mi tarjeta con mis datos de contacto.`;
$('#kWa').href='https://wa.me/'+P.wa;$('#kTel').href='tel:'+P.telI;$('#kIg').href='https://www.instagram.com/'+P.ig+'/';$('#kMail').href='mailto:'+P.mail;
function toast(m){const t=$('#ctoast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),3500)}
function ls(c,v){if('letterSpacing' in c)c.letterSpacing=v}
async function img(){
  await Promise.all(['700 80px Lora','600 80px Lora','500 30px "DM Sans"','700 30px "DM Sans"'].map(f=>document.fonts.load(f))).catch(()=>{});
  const ph=new Image();ph.src='moni.jpg';await ph.decode().catch(()=>{});
  const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
  const g=c.createRadialGradient(W*.85,0,50,W*.6,H*.4,H);g.addColorStop(0,'#1b5a42');g.addColorStop(.5,'#0f3d2c');g.addColorStop(1,'#0a2e21');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(255,255,255,.03)';c.lineWidth=4;for(let x=-H;x<W;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x+H,H);c.stroke()}
  c.textAlign='center';c.fillStyle='#faf3eb';c.font='700 104px Lora';c.fillText('Veltri',W/2,180);
  c.font='500 24px "DM Sans"';ls(c,'14px');const tw=c.measureText('PROPIEDADES').width;c.fillStyle='#e2cf9f';c.fillText('PROPIEDADES',W/2+7,232);ls(c,'0px');
  c.fillStyle='#c2a05a';c.fillRect(W/2-tw/2-70,224,46,3);c.fillRect(W/2+tw/2+24,224,46,3);
  const cx=W/2,cy=520,r=190;const rg=c.createLinearGradient(cx-r,cy-r,cx+r,cy+r);rg.addColorStop(0,'#c2a05a');rg.addColorStop(.5,'#e2cf9f');rg.addColorStop(1,'#c2a05a');
  c.beginPath();c.arc(cx,cy,r+12,0,7);c.fillStyle=rg;c.fill();c.beginPath();c.arc(cx,cy,r+3,0,7);c.fillStyle='#0a2e21';c.fill();
  c.save();c.beginPath();c.arc(cx,cy,r-6,0,7);c.clip();if(ph.naturalWidth){const s=Math.min(ph.naturalWidth,ph.naturalHeight);c.drawImage(ph,(ph.naturalWidth-s)/2,(ph.naturalHeight-s)/2,s,s,cx-r,cy-r,2*r,2*r)}c.restore();
  c.fillStyle='#faf3eb';c.font='600 84px Lora';c.fillText(P.nombre,W/2,830);
  c.fillStyle='#e2cf9f';c.font='700 27px "DM Sans"';ls(c,'9px');c.fillText(P.cargo.toUpperCase(),W/2+4,890);ls(c,'0px');
  c.fillStyle='#c2a05a';c.fillRect(W/2-50,935,100,3);
  c.fillStyle='rgba(250,243,235,.92)';c.font='500 36px "DM Sans"';c.fillText('WhatsApp  '+P.tel,W/2,1020);c.fillText(P.mail,W/2,1082);c.fillText('@'+P.ig,W/2,1144);
  
  c.fillStyle='#c2a05a';c.fillRect(0,H-10,W,10);
  return new Promise(res=>cv.toBlob(b=>res(new File([b],'Tarjeta_Monica_Feltrinelli.png',{type:'image/png'})),'image/png'));
}
window.__cardImg=img;
const dl=f=>{const u=URL.createObjectURL(f);const a=document.createElement('a');a.href=u;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)};
$('#kSend').onclick=async()=>{try{const f=await img();
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:msg()});return}
  dl(f);window.open('https://wa.me/?text='+encodeURIComponent(msg()),'_blank');toast('Se descargó tu tarjeta: adjuntala en el chat que se abrió.')}
  catch(e){if(e?.name!=='AbortError')toast('No se pudo compartir. Probá de nuevo.')}};
$('#kSave').onclick=async()=>{let photo='';try{const b=await fetch('moni.jpg').then(r=>r.blob());photo=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(b)})}catch(e){}
  const v=['BEGIN:VCARD','VERSION:3.0','N:Feltrinelli;Mónica;;;','FN:'+P.nombre,'ORG:Veltri Propiedades','TITLE:'+P.cargo,'TEL;TYPE=CELL:'+P.telI,'EMAIL;TYPE=WORK:'+P.mail,'X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/'+P.ig+'/',photo?'PHOTO;ENCODING=b;TYPE=JPEG:'+photo:'','END:VCARD'].filter(Boolean).join('\r\n');
  dl(new File([v],'Monica_Feltrinelli.vcf',{type:'text/vcard'}));toast('Abrí el archivo descargado para guardar el contacto.')};
})();
