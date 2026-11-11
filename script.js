import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
const supabase=createClient('https://gghlmpxmiivrkiltydxf.supabase.co','sb_publishable_-oLYi0Su5SXOGmQBuZcvcw_TIHJ1D8h');
let lang='ar';
const langButton=document.getElementById('lang');
langButton.onclick=()=>{lang=lang==='ar'?'en':'ar';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-ar][data-en]').forEach(x=>x.innerHTML=x.dataset[lang]);langButton.textContent=lang==='ar'?'EN':'عربي';};
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('menu').onclick=()=>document.querySelector('nav').classList.toggle('open');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadPublicContent(){
 const [{data:templates},{data:services},{data:settings}]=await Promise.all([
  supabase.from('nexora_templates').select('id,title,slug,description,category,thumbnail_url,preview_url,demo_url,is_featured').eq('status','published').order('sort_order'),
  supabase.from('nexora_services').select('id,title,short_description,description,icon_key,starting_price,price_currency,image_url,is_featured').eq('status','published').order('sort_order'),
  supabase.from('nexora_site_settings').select('*').eq('singleton',true).maybeSingle()
 ]);
 if(settings){document.title=settings.site_name||'NEXORA Digital Studio';const contact=document.querySelector('#contact');if(settings.contact_email){const a=contact.querySelector('.btn');a.href='mailto:'+encodeURIComponent(settings.contact_email)+'?subject=Project%20inquiry';}if(settings.whatsapp_url){const a=document.createElement('a');a.className='btn';a.href=settings.whatsapp_url;a.target='_blank';a.rel='noopener';a.textContent=lang==='ar'?'واتساب ↗':'WhatsApp ↗';contact.appendChild(a);}}
 const serviceGrid=document.querySelector('#services .grid');
 if(Array.isArray(services)&&services.length){
  serviceGrid.innerHTML=services.map((x,i)=>'<article>'+(x.image_url?'<img src="'+esc(x.image_url)+'" alt="" style="width:100%;height:130px;object-fit:cover;border-radius:8px">':'')+'<b>'+String(i+1).padStart(2,'0')+'</b><h3>'+esc(x.title)+'</h3><p>'+esc(x.short_description||x.description)+'</p>'+(x.starting_price!==null?'<small>'+esc(x.starting_price)+' '+esc(x.price_currency)+'</small>':'')+'</article>').join('');
 }else{
  serviceGrid.innerHTML='<p class="empty-state">نعمل حالياً على تجهيز خدماتنا. تواصل معنا لطلب خدمة مخصصة.</p>';
 }
 const projectGrid=document.querySelector('.projects');
 if(Array.isArray(templates)&&templates.length){const grid=document.querySelector('.projects');grid.innerHTML=templates.map(x=>'<article><a href="'+esc(x.demo_url||x.preview_url||'#contact')+'" '+(x.demo_url||x.preview_url?'target="_blank" rel="noopener"':'')+'><div class="visual" style="'+(x.thumbnail_url?'background-image:linear-gradient(0deg,#061321bb,#06132133),url(\''+esc(x.thumbnail_url)+'\');background-size:cover;background-position:center':'background:linear-gradient(135deg,#12394b,#0b1b2b)')+'"><small>'+esc(x.category.toUpperCase())+'</small><strong>'+esc(x.title)+'</strong></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><i class="live">'+(x.demo_url||x.preview_url?(lang==='ar'?'معاينة القالب ↗':'Preview template ↗'):(lang==='ar'?'اطلب معاينة':'Request a preview'))+'</i></a></article>').join('');}else{projectGrid.innerHTML='<p class="empty-state">قريباً نعرض هنا نماذج من أعمالنا. تواصل معنا لمشاهدة نماذج خاصة.</p>';}
}
loadPublicContent();