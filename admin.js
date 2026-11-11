import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
const supabase=createClient('https://gghlmpxmiivrkiltydxf.supabase.co','sb_publishable_-oLYi0Su5SXOGmQBuZcvcw_TIHJ1D8h');
const $=id=>document.getElementById(id);
let currentUser=null, templates=[], services=[];
const msg=(id,text)=>$(id).textContent=text||'';
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showDashboard(){ $('login').classList.add('hidden');$('dashboard').classList.remove('hidden');$('logout').classList.remove('hidden');loadAll(); }
async function checkAdmin(){const {data:{user}}=await supabase.auth.getUser();if(!user)return false;const {data,error}=await supabase.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(error||!data)return false;currentUser=user;return true;}
async function boot(){if(await checkAdmin())showDashboard();else $('login').classList.remove('hidden');}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();msg('loginMsg','جارٍ التحقق...');const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error){msg('loginMsg','تعذر تسجيل الدخول: '+error.message);return;}if(!(await checkAdmin())){await supabase.auth.signOut();msg('loginMsg','هذا الحساب ليس ضمن مديري المنصة.');return;}showDashboard();});
$('logout').onclick=async()=>{await supabase.auth.signOut();location.reload();};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.toggle('hidden',x.id!==b.dataset.tab));});
async function loadAll(){await Promise.all([loadTemplates(),loadServices(),loadSettings()]);await Promise.all([loadProducts(),loadCustomers()]);await loadPlans();await loadSubscriptions();}
async function loadTemplates(){const {data,error}=await supabase.from('nexora_templates').select('*').order('sort_order').order('created_at',{ascending:false});if(error){msg('tMsg',error.message);return;}templates=data||[];$('templateList').innerHTML=templates.map(x=>'<div class="record">'+(x.thumbnail_url?'<img src="'+safe(x.thumbnail_url)+'">':'')+'<div class="meta"><b>'+safe(x.title)+'</b><small>'+safe(x.slug)+' · '+safe(x.status)+'</small></div><div class="record-actions"><button data-edit-t="'+x.id+'">تعديل</button><button class="danger" data-delete-t="'+x.id+'">حذف</button></div></div>').join('');document.querySelectorAll('[data-edit-t]').forEach(b=>b.onclick=()=>editTemplate(b.dataset.editT));document.querySelectorAll('[data-delete-t]').forEach(b=>b.onclick=()=>deleteTemplate(b.dataset.deleteT));}
function editTemplate(id){const x=templates.find(v=>v.id===id);if(!x)return;$('tId').value=x.id;$('tTitle').value=x.title;$('tSlug').value=x.slug;$('tCategory').value=x.category;$('tStatus').value=x.status;$('tDescription').value=x.description;$('tPreview').value=x.preview_url||'';$('tDemo').value=x.demo_url||'';$('tStack').value=(x.tech_stack||[]).join(', ');$('tOrder').value=x.sort_order;$('tFeatured').checked=x.is_featured;window.scrollTo({top:0,behavior:'smooth'});}
async function uploadImage(file,folder){if(!file)return null;if(file.size>5*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 5MB');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('صيغة الصورة غير مدعومة');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path='nexora/'+folder+'/'+crypto.randomUUID()+'.'+ext;const {error}=await supabase.storage.from('nexora-media').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return supabase.storage.from('nexora-media').getPublicUrl(path).data.publicUrl;}
$('templateForm').onsubmit=async e=>{e.preventDefault();msg('tMsg','جارٍ الحفظ...');try{const id=$('tId').value;const old=templates.find(x=>x.id===id);const image=await uploadImage($('tImage').files[0],'templates');const row={title:$('tTitle').value.trim(),slug:$('tSlug').value.trim().toLowerCase(),category:$('tCategory').value.trim()||'general',status:$('tStatus').value,description:$('tDescription').value,thumbnail_url:image||old?.thumbnail_url||null,preview_url:$('tPreview').value||null,demo_url:$('tDemo').value||null,tech_stack:$('tStack').value.split(',').map(x=>x.trim()).filter(Boolean),sort_order:Number($('tOrder').value)||0,is_featured:$('tFeatured').checked,updated_at:new Date().toISOString()};const result=id?await supabase.from('nexora_templates').update(row).eq('id',id):await supabase.from('nexora_templates').insert(row);if(result.error)throw result.error;msg('tMsg','تم حفظ القالب بنجاح.');$('templateForm').reset();$('tId').value='';await loadTemplates();}catch(err){msg('tMsg','خطأ: '+err.message);}};
$('tReset').onclick=()=>{$('templateForm').reset();$('tId').value='';msg('tMsg','');};
async function deleteTemplate(id){if(!confirm('تأكيد حذف هذا القالب؟'))return;const {error}=await supabase.from('nexora_templates').delete().eq('id',id);msg('tMsg',error?error.message:'تم الحذف.');await loadTemplates();}
async function loadServices(){const {data,error}=await supabase.from('nexora_services').select('*').order('sort_order').order('created_at',{ascending:false});if(error){msg('sMsg',error.message);return;}services=data||[];$('serviceList').innerHTML=services.map(x=>'<div class="record">'+(x.image_url?'<img src="'+safe(x.image_url)+'" alt="">':'')+'<div class="meta"><b>'+safe(x.title)+'</b><small>'+safe(x.slug)+' · '+safe(x.status)+' · '+(x.starting_price??'بدون سعر')+' '+safe(x.price_currency)+'</small></div><div class="record-actions"><button data-edit-s="'+x.id+'">تعديل</button><button class="danger" data-delete-s="'+x.id+'">حذف</button></div></div>').join('');document.querySelectorAll('[data-edit-s]').forEach(b=>b.onclick=()=>editService(b.dataset.editS));document.querySelectorAll('[data-delete-s]').forEach(b=>b.onclick=()=>deleteService(b.dataset.deleteS));}
function editService(id){const x=services.find(v=>v.id===id);if(!x)return;$('sId').value=x.id;$('sTitle').value=x.title;$('sSlug').value=x.slug;$('sIcon').value=x.icon_key;$('sStatus').value=x.status;$('sShort').value=x.short_description;$('sDescription').value=x.description;$('sPrice').value=x.starting_price??'';$('sCurrency').value=x.price_currency;$('sOrder').value=x.sort_order;$('sFeatured').checked=x.is_featured;$('sImage').value='';window.scrollTo({top:0,behavior:'smooth'});}
$('serviceForm').onsubmit=async e=>{
 e.preventDefault();msg('sMsg','جارٍ الحفظ...');
 try{
  const id=$('sId').value,old=services.find(x=>x.id===id),price=$('sPrice').value;
  const image=await uploadImage($('sImage').files[0],'services');
  const row={title:$('sTitle').value.trim(),slug:$('sSlug').value.trim().toLowerCase(),icon_key:$('sIcon').value.trim()||'sparkles',status:$('sStatus').value,short_description:$('sShort').value,description:$('sDescription').value,starting_price:price===''?null:Number(price),price_currency:$('sCurrency').value,image_url:image||old?.image_url||null,sort_order:Number($('sOrder').value)||0,is_featured:$('sFeatured').checked,updated_at:new Date().toISOString()};
  const result=id?await supabase.from('nexora_services').update(row).eq('id',id):await supabase.from('nexora_services').insert(row);
  if(result.error)throw result.error;
  msg('sMsg','تم حفظ الخدمة بنجاح.');$('serviceForm').reset();$('sId').value='';await loadServices();
 }catch(err){msg('sMsg','خطأ: '+err.message);}
};
$('sReset').onclick=()=>{$('serviceForm').reset();$('sId').value='';msg('sMsg','');};
async function deleteService(id){if(!confirm('تأكيد حذف هذه الخدمة؟'))return;const {error}=await supabase.from('nexora_services').delete().eq('id',id);msg('sMsg',error?error.message:'تم الحذف.');await loadServices();}
async function loadSettings(){const {data,error}=await supabase.from('nexora_site_settings').select('*').eq('singleton',true).single();if(error){msg('settingsMsg',error.message);return;}$('siteName').value=data.site_name||'';$('tagline').value=data.tagline||'';$('contactEmail').value=data.contact_email||'';$('whatsapp').value=data.whatsapp_url||'';$('instagram').value=data.instagram_url||'';$('locale').value=data.locale||'ar';}
$('settingsForm').onsubmit=async e=>{e.preventDefault();const row={site_name:$('siteName').value,tagline:$('tagline').value,contact_email:$('contactEmail').value||null,whatsapp_url:$('whatsapp').value||null,instagram_url:$('instagram').value||null,locale:$('locale').value,updated_at:new Date().toISOString()};const {error}=await supabase.from('nexora_site_settings').update(row).eq('singleton',true);msg('settingsMsg',error?'خطأ: '+error.message:'تم حفظ الإعدادات.');};

let products=[], plans=[], customers=[], subscriptions=[];
const productTypeLabel={restaurant_menu:'منيو إلكتروني',restaurant_system:'نظام مطاعم',clinic_system:'نظام عيادات',pharmacy_system:'نظام صيدليات',custom_system:'نظام مخصص',other:'منتج آخر'};
const subStatusLabel={pending:'بانتظار التفعيل',active:'فعال',expired:'منتهي',suspended:'معلّق',cancelled:'ملغي'};
const paymentLabel={unpaid:'غير مدفوع',paid:'مدفوع',partial:'مدفوع جزئياً',refunded:'مسترجع'};
function resetProduct(){$('productForm').reset();$('pId').value='';$('pMsg').textContent='';}
async function loadProducts(){
 const {data,error}=await supabase.from('nexora_products').select('*').order('sort_order').order('created_at',{ascending:false});
 if(error){msg('pMsg',error.message);return;}
 products=data||[];
 $('productList').innerHTML=products.length?products.map(x=>'<div class="record">'+(x.image_url?'<img src="'+safe(x.image_url)+'" alt="">':'')+'<div class="meta"><b>'+safe(x.name)+'</b><small>'+safe(productTypeLabel[x.product_type]||x.product_type)+' · '+safe(x.pricing_model)+' · '+safe(x.status)+'</small>'+(x.demo_url?'<small><a href="'+safe(x.demo_url)+'" target="_blank" rel="noopener">فتح القالب ↗</a></small>':'')+'</div><div class="record-actions"><button data-edit-p="'+x.id+'">تعديل</button><button class="danger" data-delete-p="'+x.id+'">حذف</button></div></div>').join(''):'<p>لا توجد منتجات بعد. أضف أول نظام من النموذج أعلاه.</p>';
 document.querySelectorAll('[data-edit-p]').forEach(b=>b.onclick=()=>editProduct(b.dataset.editP));
 document.querySelectorAll('[data-delete-p]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.deleteP));
 const opts='<option value="">اختر المنتج</option>'+products.map(x=>'<option value="'+x.id+'">'+safe(x.name)+'</option>').join('');
 $('plProduct').innerHTML=opts;$('subProduct').innerHTML=opts;
}
function editProduct(id){
 const x=products.find(v=>v.id===id);if(!x)return;
 $('pId').value=x.id;$('pName').value=x.name;$('pSlug').value=x.slug;$('pType').value=x.product_type;$('pPricing').value=x.pricing_model;$('pPrice').value=x.one_time_price_iqd??'';$('pStatus').value=x.status;$('pShort').value=x.short_description;$('pDemo').value=x.demo_url||'';$('pDescription').value=x.description;$('pOrder').value=x.sort_order;$('pFeatured').checked=x.is_featured;$('pImage').value='';
 document.querySelector('[data-tab="products"]').click();window.scrollTo({top:0,behavior:'smooth'});
}
$('productForm').onsubmit=async e=>{
 e.preventDefault();msg('pMsg','جارٍ حفظ المنتج...');
 try{
  const id=$('pId').value,old=products.find(x=>x.id===id),image=await uploadImage($('pImage').files[0],'products'),price=$('pPrice').value;
  const row={name:$('pName').value.trim(),slug:$('pSlug').value.trim().toLowerCase(),product_type:$('pType').value,pricing_model:$('pPricing').value,one_time_price_iqd:price===''?null:Number(price),status:$('pStatus').value,short_description:$('pShort').value.trim(),description:$('pDescription').value,image_url:image||old?.image_url||null,sort_order:Number($('pOrder').value)||0,is_featured:$('pFeatured').checked,updated_at:new Date().toISOString()};
  const result=id?await supabase.from('nexora_products').update(row).eq('id',id):await supabase.from('nexora_products').insert(row);
  if(result.error)throw result.error;
  msg('pMsg','تم حفظ المنتج بنجاح.');resetProduct();await loadProducts();await loadPlans();
 }catch(err){msg('pMsg','تعذر الحفظ: '+err.message);}
};
$('pReset').onclick=resetProduct;
async function deleteProduct(id){
 const x=products.find(v=>v.id===id);if(!x||!confirm('حذف المنتج "'+x.name+'"؟ لا يمكن حذفه إذا كان مرتبطاً باشتراكات.'))return;
 const {error}=await supabase.from('nexora_products').delete().eq('id',id);msg('pMsg',error?'تعذر الحذف: '+error.message:'تم حذف المنتج.');await loadProducts();await loadPlans();
}
async function loadPlans(){
 const {data,error}=await supabase.from('nexora_product_plans').select('*').order('sort_order').order('created_at',{ascending:false});
 if(error){msg('plMsg',error.message);return;}
 plans=data||[];
 $('planList').innerHTML=plans.length?plans.map(x=>{const p=products.find(v=>v.id===x.product_id);return '<div class="record"><div class="meta"><b>'+safe(x.plan_name)+'</b><small>'+safe(p?.name||'منتج غير معروف')+' · '+Number(x.price_iqd).toLocaleString('en-US')+' د.ع · '+(x.duration_days?x.duration_days+' يوم':'مدة مفتوحة')+' · '+(x.is_active?'متاحة':'متوقفة')+'</small></div><div class="record-actions"><button data-edit-pl="'+x.id+'">تعديل</button><button class="danger" data-delete-pl="'+x.id+'">حذف</button></div></div>';}).join(''):'<p>لا توجد باقات مضافة بعد.</p>';
 document.querySelectorAll('[data-edit-pl]').forEach(b=>b.onclick=()=>editPlan(b.dataset.editPl));
 document.querySelectorAll('[data-delete-pl]').forEach(b=>b.onclick=()=>deletePlan(b.dataset.deletePl));
 refreshSubPlans();
}
function resetPlan(){$('planForm').reset();$('plId').value='';$('plActive').checked=true;$('plMsg').textContent='';}
function editPlan(id){
 const x=plans.find(v=>v.id===id);if(!x)return;
 $('plId').value=x.id;$('plProduct').value=x.product_id;$('plName').value=x.plan_name;$('plCode').value=x.plan_code;$('plDuration').value=x.duration_days??'';$('plPrice').value=x.price_iqd;$('plFeatures').value=(x.features||[]).join('\n');$('plActive').checked=x.is_active;
 document.querySelector('[data-tab="plans"]').click();window.scrollTo({top:0,behavior:'smooth'});
}
$('planForm').onsubmit=async e=>{
 e.preventDefault();msg('plMsg','جارٍ حفظ الباقة...');
 const id=$('plId').value,duration=$('plDuration').value;
 const row={product_id:$('plProduct').value,plan_name:$('plName').value.trim(),plan_code:$('plCode').value.trim().toLowerCase().replace(/\s+/g,'-'),duration_days:duration?Number(duration):null,price_iqd:Number($('plPrice').value),features:$('plFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean),is_active:$('plActive').checked,updated_at:new Date().toISOString()};
 const result=id?await supabase.from('nexora_product_plans').update(row).eq('id',id):await supabase.from('nexora_product_plans').insert(row);
 msg('plMsg',result.error?'تعذر الحفظ: '+result.error.message:'تم حفظ الباقة.');if(!result.error){resetPlan();await loadPlans();}
};
$('plReset').onclick=resetPlan;
async function deletePlan(id){if(!confirm('تأكيد حذف هذه الباقة؟'))return;const {error}=await supabase.from('nexora_product_plans').delete().eq('id',id);msg('plMsg',error?error.message:'تم حذف الباقة.');await loadPlans();}
async function loadCustomers(){
 const {data,error}=await supabase.from('nexora_customers').select('*').order('created_at',{ascending:false});
 if(error){msg('cMsg',error.message);return;}
 customers=data||[];
 $('customerList').innerHTML=customers.length?customers.map(x=>'<div class="record"><div class="meta"><b>'+safe(x.full_name)+'</b><small>'+safe(x.business_name||'')+' · '+safe(x.phone)+' · '+safe(x.business_type||'')+'</small></div><div class="record-actions"><button data-edit-c="'+x.id+'">تعديل</button></div></div>').join(''):'<p>لا يوجد عملاء مسجلون بعد.</p>';
 $('subCustomer').innerHTML='<option value="">اختر العميل</option>'+customers.map(x=>'<option value="'+x.id+'">'+safe(x.full_name)+' · '+safe(x.phone)+'</option>').join('');
 document.querySelectorAll('[data-edit-c]').forEach(b=>b.onclick=()=>editCustomer(b.dataset.editC));
}
function resetCustomer(){$('customerForm').reset();$('cId').value='';$('cMsg').textContent='';}
function editCustomer(id){const x=customers.find(v=>v.id===id);if(!x)return;$('cId').value=x.id;$('cName').value=x.full_name;$('cPhone').value=x.phone;$('cEmail').value=x.email||'';$('cBusiness').value=x.business_name||'';$('cType').value=x.business_type||'other';$('cNotes').value=x.notes||'';document.querySelector('[data-tab="customers"]').click();window.scrollTo({top:0,behavior:'smooth'});}
$('customerForm').onsubmit=async e=>{
 e.preventDefault();msg('cMsg','جارٍ حفظ العميل...');
 const id=$('cId').value,row={full_name:$('cName').value.trim(),phone:$('cPhone').value.trim(),email:$('cEmail').value.trim()||null,business_name:$('cBusiness').value.trim()||null,business_type:$('cType').value,notes:$('cNotes').value.trim()||null,updated_at:new Date().toISOString()};
 const result=id?await supabase.from('nexora_customers').update(row).eq('id',id):await supabase.from('nexora_customers').insert(row);
 msg('cMsg',result.error?'تعذر الحفظ: '+result.error.message:'تم حفظ بيانات العميل.');if(!result.error){resetCustomer();await loadCustomers();}
};
$('cReset').onclick=resetCustomer;
function refreshSubPlans(){
 const pid=$('subProduct').value,available=plans.filter(x=>x.product_id===pid&&x.is_active);
 $('subPlan').innerHTML='<option value="">بدون باقة / بيع مباشر</option>'+available.map(x=>'<option value="'+x.id+'">'+safe(x.plan_name)+' · '+Number(x.price_iqd).toLocaleString('en-US')+' د.ع</option>').join('');
}
$('subProduct').onchange=()=>{refreshSubPlans();const p=products.find(x=>x.id===$('subProduct').value);if(p?.one_time_price_iqd)$('subPrice').value=p.one_time_price_iqd;};
$('subPlan').onchange=()=>{const p=plans.find(x=>x.id===$('subPlan').value);if(p)$('subPrice').value=p.price_iqd;};
async function loadSubscriptions(){
 const {data,error}=await supabase.from('nexora_subscriptions').select('*').order('created_at',{ascending:false});
 if(error){msg('subMsg',error.message);return;}
 subscriptions=data||[];
 $('subscriptionList').innerHTML=subscriptions.length?subscriptions.map(x=>{const customer=customers.find(v=>v.id===x.customer_id),product=products.find(v=>v.id===x.product_id),plan=plans.find(v=>v.id===x.plan_id);return '<div class="record"><div class="meta"><b>'+safe(customer?.full_name||'عميل')+' · '+safe(product?.name||'منتج')+'</b><small>'+safe(plan?.plan_name||'بيع مباشر')+' · '+safe(subStatusLabel[x.status]||x.status)+' · '+safe(paymentLabel[x.payment_status]||x.payment_status)+' · '+Number(x.price_iqd).toLocaleString('en-US')+' د.ع</small></div><div class="record-actions"><button data-toggle-sub="'+x.id+'">'+(x.status==='active'?'إيقاف مؤقت':'تفعيل')+'</button></div></div>';}).join(''):'<p>لا توجد اشتراكات مسجلة بعد.</p>';
 document.querySelectorAll('[data-toggle-sub]').forEach(b=>b.onclick=async()=>{const x=subscriptions.find(v=>v.id===b.dataset.toggleSub);if(!x)return;const next=x.status==='active'?'suspended':'active';const {error}=await supabase.from('nexora_subscriptions').update({status:next,updated_at:new Date().toISOString()}).eq('id',x.id);msg('subMsg',error?error.message:'تم تحديث حالة الاشتراك.');await loadSubscriptions();});
}
$('subscriptionForm').onsubmit=async e=>{
 e.preventDefault();msg('subMsg','جارٍ إنشاء الاشتراك...');
 const start=$('subStart').value,end=$('subEnd').value;
 const row={customer_id:$('subCustomer').value,product_id:$('subProduct').value,plan_id:$('subPlan').value||null,price_iqd:Number($('subPrice').value),starts_at:start?new Date(start+'T00:00:00').toISOString():null,ends_at:end?new Date(end+'T23:59:59').toISOString():null,status:$('subStatus').value,payment_status:$('subPayment').value,payment_method:$('subMethod').value.trim()||null,reference_code:$('subRef').value.trim()||null,notes:$('subNotes').value.trim()||null,created_by:currentUser?.id||null};
 const {error}=await supabase.from('nexora_subscriptions').insert(row);
 msg('subMsg',error?'تعذر إنشاء الاشتراك: '+error.message:'تم إنشاء الاشتراك بنجاح.');if(!error){$('subscriptionForm').reset();await loadSubscriptions();}
};

boot();