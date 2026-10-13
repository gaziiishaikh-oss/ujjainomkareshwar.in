const ADMIN_CONFIG = window.ADMIN_CONFIG || {email:"owner@gmail.com", password:"admin123"};
const ADMIN_SESSION_KEY = "ujjainTravellerAdminSession";
const ADMIN_LOCK_KEY = "ujjainTravellerAdminLock";
const ADMIN_MAX_ATTEMPTS = 5;
const STORAGE = "ujjainTravellerV21";
const CONTACTS_KEY = STORAGE+"Contacts";
const BOOKINGS_KEY = STORAGE+"Bookings";
const ROUTES_KEY = STORAGE+"Routes";
const REVIEWS_KEY = STORAGE+"Reviews";
const PLACES_KEY = STORAGE+"FamousPlaces";
const SETTINGS_KEY = STORAGE+"Settings";
const DEFAULT_CONTACTS = {call:"919827430197", whatsapp:"919827430197", sms:"919827430197"};
const DEFAULT_CARS = [{id:"ertiga",name:"Maruti Suzuki Ertiga",seats:7,ac:4500,nonac:4300,km:15,photos:["download.jpg"]}];
const DEFAULT_ROUTES = [
  {id:"r1",name:"Ujjain → Omkareshwar",oneWay:0,twoWay:4300,extra:200,roundTripOnly:true},
  {id:"r2",name:"Ujjain → Indore",oneWay:2800,twoWay:3300,extra:200,roundTripOnly:false},
  {id:"r3",name:"Indore Airport → Ujjain",oneWay:2800,twoWay:3300,extra:200,roundTripOnly:false},
  {id:"r4",name:"Ujjain → Baglamukhi",oneWay:0,twoWay:3300,extra:200,roundTripOnly:true},
  {id:"r5",name:"Ujjain → Maheshwar",oneWay:0,twoWay:4800,extra:200,roundTripOnly:true},
  {id:"r6",name:"Ujjain → Sehore",oneWay:0,twoWay:4300,extra:200,roundTripOnly:true}
];
const DEFAULT_PLACES = [
  {id:"p1",name:"Mahakaleshwar Jyotirlinga",location:"Ujjain",description:"Ujjain's famous Mahakaleshwar Jyotirlinga and one of the city's most important pilgrimage destinations.",photo:"images/ujj 1.jpg"},
  {id:"p2",name:"Harsiddhi Mata Temple",location:"Ujjain",description:"A revered Shakti Peeth and an important spiritual place in Ujjain.",photo:"images/ujjain harisiddhi temple.jpg"},
  {id:"p3",name:"Ram Ghat",location:"Ujjain",description:"Historic ghat on the Shipra River, known for its spiritual atmosphere and evening views.",photo:"images/ramghatr ujjain.jpg"},
  {id:"p4",name:"Bade Ganesh Ji Temple",location:"Ujjain",description:"A popular Lord Ganesha temple near the Mahakal area.",photo:"images/bade-ganeshji.jpg"},
  {id:"p5",name:"Gopal Mandir",location:"Ujjain",description:"A well-known historic temple in the heart of Ujjain.",photo:"images/Gopal-Mandir ujjain(1).webp"},
  {id:"p6",name:"Ujjain Tower Chowk",location:"Ujjain",description:"A recognizable city landmark and busy central area of Ujjain.",photo:"images/tower ujjain1(1).webp"},
  {id:"p7",name:"Ujjain Tower – Night View",location:"Ujjain",description:"A beautiful evening view of Ujjain's iconic tower.",photo:"images/tower ujjain1(1).webp"},
  {id:"p8",name:"Shipra River Ghats",location:"Ujjain",description:"Riverside atmosphere and traditional Ujjain views along the Shipra River.",photo:"images/ujjain3(1).jpg"}
];
const DEFAULT_REVIEWS = [];
const DEFAULT_SETTINGS = {siteName:"Ujjain Omkareshwar",advance:500,address:"Near Mahakal Mandir, Galaxy Hotel, Ujjain, Madhya Pradesh",heroHeading:"Comfortable Journey. Peaceful Darshan."};
let cars = JSON.parse(localStorage.getItem(STORAGE+"Cars")||"null") || DEFAULT_CARS;
let contacts = JSON.parse(localStorage.getItem(CONTACTS_KEY)||"null") || DEFAULT_CONTACTS;
let bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY)||"[]");
let routes = JSON.parse(localStorage.getItem(ROUTES_KEY)||"null") || DEFAULT_ROUTES;
let reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)||"null") || DEFAULT_REVIEWS;
let places = JSON.parse(localStorage.getItem(PLACES_KEY)||"null") || DEFAULT_PLACES;
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)||"null") || DEFAULT_SETTINGS;
// The owner's requested phone number is the same for Call and WhatsApp.
contacts.whatsapp = String(contacts.whatsapp || DEFAULT_CONTACTS.whatsapp).replace(/\D/g, "") || DEFAULT_CONTACTS.whatsapp;
if (contacts.whatsapp.startsWith("00")) contacts.whatsapp = contacts.whatsapp.slice(2);
if (contacts.whatsapp.length === 10) contacts.whatsapp = "91" + contacts.whatsapp;
contacts.call = contacts.whatsapp;
contacts.sms = String(contacts.sms || contacts.whatsapp).replace(/\D/g, "") || contacts.whatsapp;
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");
function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (err) {
    console.error("Website storage write failed:", err);
    alert("Browser storage full ya unavailable hai. Admin panel ke Backup section se pehle backup download karein. Large photos ko compressed format mein upload karein.");
    return false;
  }
}
const save=()=>safeSetItem(STORAGE+"Cars",JSON.stringify(cars));
const saveContacts=()=>safeSetItem(CONTACTS_KEY,JSON.stringify(contacts));
const saveBookings=()=>safeSetItem(BOOKINGS_KEY,JSON.stringify(bookings));
const saveRoutes=()=>safeSetItem(ROUTES_KEY,JSON.stringify(routes));
const saveReviews=()=>safeSetItem(REVIEWS_KEY,JSON.stringify(reviews));
const savePlaces=()=>safeSetItem(PLACES_KEY,JSON.stringify(places));
const saveSettings=()=>safeSetItem(SETTINGS_KEY,JSON.stringify(settings));

const ROUTE_PRICE_VERSION_KEY = STORAGE + "RoutePricingVersion";
const ROUTE_PRICE_VERSION = "2026-10-13-final-routes-v3";
const routeKey = name => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// Catch common spellings such as "Omkareshwar → Ujjain", "Omkareshwar to Ujjain"
// and "From Omkareshwar to Ujjain" so the unwanted ₹2,400 reverse route stays removed.
const isOmkareshwarReverseRoute = name => {
  const key = routeKey(name);
  return /^(?:from)?omkareshwar.*ujjain/.test(key);
};
// Apply the agreed rates once so older saved prices are corrected without overwriting later owner edits.
if (localStorage.getItem(ROUTE_PRICE_VERSION_KEY) !== ROUTE_PRICE_VERSION) {
  const savedRoutes = Array.isArray(routes) ? routes : [];
  const finalRoutes = DEFAULT_ROUTES.map(def => {
    const old = savedRoutes.find(r => r.id === def.id || routeKey(r.name) === routeKey(def.name));
    return { ...(old || {}), ...def };
  });
  // Remove any old reverse-direction Omkareshwar route (e.g. "Omkareshwar → Ujjain").
  // The agreed fare list offers Ujjain → Omkareshwar as round-trip only.
  const customRoutes = savedRoutes.filter(old => {
    const isDefaultRoute = DEFAULT_ROUTES.some(def => old.id === def.id || routeKey(old.name) === routeKey(def.name));
    return !isDefaultRoute && !isOmkareshwarReverseRoute(old.name);
  });
  routes = [...finalRoutes, ...customRoutes];
  saveRoutes();
  localStorage.setItem(ROUTE_PRICE_VERSION_KEY, ROUTE_PRICE_VERSION);
  cars = cars.map(c => (c.id === "ertiga" || /ertiga/i.test(c.name || "")) ? { ...c, ac: 4500, nonac: 4300 } : c);
  save();
} else {
  // Also enforce the route rule if this browser already has the latest price version.
  const filteredRoutes = routes.filter(r => !isOmkareshwarReverseRoute(r.name));
  if (filteredRoutes.length !== routes.length) { routes = filteredRoutes; saveRoutes(); }
}

const esc=s=>String(s??"").replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
// Resolve photos from the repository root. Legacy images/ prefixes are stripped; data URLs from admin uploads are supported too.
function imagePath(value) {
  const path = String(value || "").trim();
  if (!path) return "";
  if (/^(data:|https?:|blob:)/i.test(path)) return path;
  const filename = path.replace(/^\.\/?images\//i, "").replace(/^images\//i, "").replace(/^\.\//, "");
  return encodeURI(filename);
}
let pendingPhotos = [];
// Compress uploaded local images before putting them in browser storage; this reduces quota errors.
function compressImageFile(file, maxSide=1280, quality=0.76) {
  return new Promise((resolve,reject)=>{
    if(!file || !String(file.type||"").startsWith("image/")){reject(new Error("Please choose a valid image file."));return;}
    const objectUrl=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{
      try {
        const ratio=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*ratio));
        canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*ratio));
        const ctx=canvas.getContext("2d");
        if(!ctx) throw new Error("Image compression is not available in this browser.");
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        let data=canvas.toDataURL("image/jpeg",quality);
        if(data.length>900000) data=canvas.toDataURL("image/jpeg",0.58);
        URL.revokeObjectURL(objectUrl); resolve(data);
      } catch(err) { URL.revokeObjectURL(objectUrl); reject(new Error("Image compress nahi ho saki. Smaller image try karein.")); }
    };
    img.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error("Image open nahi hui. Dusri JPG/PNG image try karein."));};
    img.src=objectUrl;
  });
}
function isRoundTripOnly(route) {
  if (!route) return false;
  if (route.roundTripOnly === true) return true;
  return ["r1", "r4", "r5", "r6"].includes(route.id) ||
    ["ujjainomkareshwar", "ujjainbaglamukhi", "ujjainmaheshwar", "ujjainsehore"].includes(routeKey(route.name));
}
function routePriceSummary(route) {
  if (isRoundTripOnly(route)) {
    const nonAC = Number(route.twoWay || 0);
    return `Round Trip only • Non-AC ${nonAC ? money(nonAC) : "On Request"} • AC ${nonAC ? money(nonAC + Number(route.extra || 0)) : "On Request"}`;
  }
  const one = Number(route.oneWay || 0), two = Number(route.twoWay || 0), extra = Number(route.extra || 0);
  const oneText = one ? `Single Trip — Non-AC ${money(one)} / AC ${money(one + extra)}` : "Single Trip fare on request";
  const twoText = two ? `Round Trip — Non-AC ${money(two)} / AC ${money(two + extra)}` : "Round Trip fare on request";
  return `${oneText} • ${twoText}`;
}



function renderCars(){const box=document.getElementById("carContainer");if(!box)return;box.innerHTML=cars.map(c=>{const photo=imagePath(c.photos?.[0]||"download.jpg");return `<div class="car-card"><div class="car-photo" style="background-image:url('${esc(photo)}')"><span>${c.seats} SEATER</span></div><div class="car-details"><h2>${esc(c.name)}</h2><p>Comfortable private travel option for Ujjain and nearby pilgrimage routes.</p><div class="prices"><div><small>AC</small><h3>${money(c.ac)}</h3><p>Omkareshwar Round Trip</p></div><div><small>NON-AC</small><h3>${money(c.nonac)}</h3><p>Omkareshwar Round Trip</p></div></div><button class="select-btn" onclick="selectCar('${esc(c.id)}')">Select Car</button></div></div>`}).join("");renderVehicleOptions();}
function renderVehicleOptions(){const v=document.getElementById("vehicle");if(!v)return;const current=v.value;v.innerHTML=cars.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");if(cars.some(c=>c.id===current))v.value=current;updateFare();}
function renderPublicRoutes(){
 const box=document.getElementById("publicRoutes");
 const dest=document.getElementById("destination");
 if(box) box.innerHTML=routes.map((r,i)=>`<div class="route-card"><span>${String(i+1).padStart(2,"0")}</span><h3>${esc(r.name)}</h3><p>${esc(routePriceSummary(r))}</p><button class="route-book-btn" data-route-name="${esc(r.name)}">Book this route →</button></div>`).join("");
 if(dest){const current=dest.value;dest.innerHTML=routes.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join("")+`<option value="Custom Route">Custom Route</option>`;if([...dest.options].some(o=>o.value===current))dest.value=current;}
 document.querySelectorAll(".route-book-btn").forEach(b=>b.onclick=()=>{if(dest){dest.value=b.dataset.routeName;updateFare()}document.getElementById("booking")?.scrollIntoView({behavior:"smooth"})});
 updateFare();
}
function renderPublicPlaces(){
 const box=document.getElementById("ujjainSlider");
 if(!box)return;
 box.innerHTML=places.map(p=>`<article class="place-card"><img src="${esc(imagePath(p.photo||"ujj 1.jpg"))}" alt="${esc(p.name)}"><div class="place-info"><span>${esc(p.location||"Ujjain")}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p></div></article>`).join("");
}
function getCar(){return cars.find(c=>c.id===document.getElementById("vehicle")?.value)||cars[0];}
function calculateFare(route, ac, journeyType){
 if(!route) return 0;
 if(isRoundTripOnly(route) && journeyType !== "Round Trip") return 0;
 const base=Number(journeyType==="Round Trip"?route.twoWay:route.oneWay)||0;
 return base ? base + (ac==="AC" ? Number(route.extra||0) : 0) : 0;
}
function updateFare(){
 const f=document.getElementById("fare"),ac=document.getElementById("ac")?.value,d=document.getElementById("destination")?.value;
 const journeyControl=document.getElementById("journeyType");
 const r=routes.find(x=>x.name===d);
 const oneWayOption=journeyControl?.querySelector('option[value="One Way"]');
 if(oneWayOption) oneWayOption.disabled=isRoundTripOnly(r);
 if(r && isRoundTripOnly(r) && journeyControl) journeyControl.value="Round Trip";
 const journey=journeyControl?.value||"One Way";
 const note=document.querySelectorAll(".payment-note")[0];
 if(note) note.textContent = r && isRoundTripOnly(r) ? "This route is Round Trip only. Single Trip is not available." : "Choose Single Trip or Round Trip. Final fare is shown above.";
 if(f){const base=calculateFare(r,ac,journey);f.textContent=base?money(base):"On Request";}
}
function selectCar(id){const v=document.getElementById("vehicle");if(v){v.value=id;updateFare()}document.getElementById("booking")?.scrollIntoView({behavior:"smooth"})} window.selectCar=selectCar;
function bookingMessage(){const c=getCar(),name=document.getElementById("name").value.trim(),mobile=document.getElementById("mobile").value.trim(),date=document.getElementById("date").value,time=document.getElementById("time").value,pickup=document.getElementById("pickup").value,trip=document.getElementById("trip").value,journey=document.getElementById("journeyType")?.value||"One Way",ac=document.getElementById("ac").value,pass=document.getElementById("passengers").value,dest=document.getElementById("destination").value,msg=document.getElementById("message").value.trim();return `🚕 *NEW CAB BOOKING*\n\n👤 *Customer:* ${name}\n📱 *Mobile:* ${mobile}\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n📍 *Pickup:* ${pickup}\n🛣️ *Destination:* ${dest}\n🚗 *Vehicle:* ${c?.name||"Not selected"}\n❄️ *AC:* ${ac}\n👥 *Passengers:* ${pass}\n🎟️ *Booking Type:* ${trip}\n🔁 *Journey:* ${journey}\n💰 *Estimated Fare:* ${(()=>{const r=routes.find(x=>x.name===dest);const v=calculateFare(r,ac,journey);return v?money(v):"On Request"})()}\n💵 *Advance Required:* ${money(settings.advance)}\n💳 *Balance:* Remaining payment when the car reaches the pickup point.\n📝 *Special Request:* ${msg||"None"}\n\n🏢 *${settings.siteName}*\n📍 ${settings.address}`;}
const form=document.getElementById("bookingForm");form?.addEventListener("submit",async e=>{e.preventDefault();const m=document.getElementById("mobile").value.replace(/\D/g,"");if(m.length!==10){alert("Please enter a valid 10 digit mobile number.");return}const c=getCar(),name=document.getElementById("name").value.trim(),date=document.getElementById("date").value,time=document.getElementById("time").value,pickup=document.getElementById("pickup").value,trip=document.getElementById("trip").value,journey=document.getElementById("journeyType")?.value||"One Way",ac=document.getElementById("ac").value,pass=document.getElementById("passengers").value,destination=document.getElementById("destination").value,message=document.getElementById("message").value.trim();const r=routes.find(x=>x.name===destination);if(r&&isRoundTripOnly(r)&&journey!=="Round Trip"){alert("Is route par sirf Round Trip booking available hai.");document.getElementById("journeyType").value="Round Trip";updateFare();return;}let fare=calculateFare(r,ac,journey);const localBooking={id:Date.now(),name,mobile:m,date,time,pickup,trip,journeyType:journey,ac,passengers:pass,destination,vehicle:c?.name||"",message,estimatedFare:fare,advance:Number(settings.advance||0),createdAt:new Date().toISOString(),status:"Pending"};bookings.unshift(localBooking);saveBookings();renderStats();renderBookings();window.open("https://wa.me/"+contacts.whatsapp+"?text="+encodeURIComponent(bookingMessage()),"_blank")});
window.sendSMS=()=>window.location.href="sms:+"+contacts.sms+"?body="+encodeURIComponent(bookingMessage());
function applyContacts(){const call=contacts.call.replace(/\D/g,"");const wa=contacts.whatsapp.replace(/\D/g,"");const sms=contacts.sms.replace(/\D/g,"");["floatingCall","headerCall","mainCallButton"].forEach(id=>{const el=document.getElementById(id);if(el)el.href="tel:+"+call});const w=document.getElementById("floatingWhatsapp");if(w){w.href="https://wa.me/"+wa;w.target="_blank"}const mw=document.getElementById("mainWhatsappButton");if(mw)mw.href="https://wa.me/"+wa;document.querySelectorAll(".call-number").forEach(x=>x.textContent=call);}
function applySettings(){document.querySelectorAll(".logo h2,.footer-logo h2").forEach(x=>x.textContent=settings.siteName);const h=document.querySelector(".hero h1");if(h&&settings.heroHeading.includes(".")){const [a,...rest]=settings.heroHeading.split(".");h.innerHTML=esc(a)+".<br><span>"+esc(rest.join(".").trim())+"</span>"}document.querySelectorAll(".footer-address").forEach(x=>x.textContent="📍 "+settings.address);const n=document.querySelector(".advance-notice");if(n)n.innerHTML=`<strong>💰 Booking Payment Rule</strong><p>Booking confirm karne ke liye <b>${money(settings.advance)} advance</b> dena hoga. Baaki payment <b>car aapke pickup point par pahunchne par</b> pura dena hoga.</p>`;const pn=document.querySelector(".payment-note");if(pn)pn.innerHTML=`🔐 <b>Advance: ${money(settings.advance)}</b> &nbsp; | &nbsp; Remaining amount: car arrival par.`;}
function renderPublicReviews(){const box=document.getElementById("reviewSlider");const count=document.getElementById("publicReviewCount");const stars=document.getElementById("publicReviewStars");if(!box)return;const verified=reviews.filter(r=>r.verified);if(!verified.length){box.innerHTML='<div class="review-empty"><div>⭐</div><h3>No verified reviews yet</h3><p>Your genuine customer reviews will appear here after you add them from Admin.</p></div>';if(count)count.textContent="No verified reviews yet.";if(stars)stars.textContent="—";return}const avg=verified.reduce((a,r)=>a+Number(r.rating||0),0)/verified.length;if(stars)stars.textContent="★".repeat(Math.round(avg))+"☆".repeat(5-Math.round(avg));if(count)count.textContent=`${verified.length} verified customer review${verified.length===1?"":"s"}`;box.innerHTML=verified.map(r=>`<article class="review-card"><div class="review-head"><div class="review-avatar">${esc((r.name||"C").charAt(0).toUpperCase())}</div><div><h3>${esc(r.name)}</h3><span>${esc(r.source||"Customer")}</span></div><b>✓</b></div><div class="stars">${"★".repeat(Number(r.rating||5))}${"☆".repeat(5-Number(r.rating||5))}</div><p>“${esc(r.text)}”</p><small>✓ Verified customer feedback${r.bookingId?` • ${esc(r.bookingId)}`:""}</small></article>`).join("");}

["vehicle","ac","destination","journeyType"].forEach(id=>document.getElementById(id)?.addEventListener("change",updateFare));
function openAdmin(){document.getElementById("adminModal").setAttribute("aria-hidden","false")}function closeAdmin(){document.getElementById("adminModal").setAttribute("aria-hidden","true")}
document.getElementById("openAdmin")?.addEventListener("click",openAdmin);document.getElementById("closeAdmin")?.addEventListener("click",closeAdmin);document.getElementById("adminModal")?.addEventListener("click",e=>{if(e.target.id==="adminModal")closeAdmin()});
function getAdminLock(){try{return JSON.parse(localStorage.getItem(ADMIN_LOCK_KEY)||"null")}catch{return null}}
function setAdminLock(v){localStorage.setItem(ADMIN_LOCK_KEY,JSON.stringify(v))}
function adminLocked(){const lock=getAdminLock();return lock&&lock.until>Date.now()}

document.getElementById("adminLogin")?.addEventListener("click",()=>{
  const email=document.getElementById("adminEmail")?.value.trim().toLowerCase();
  const password=document.getElementById("adminPassword")?.value;
  if(adminLocked()){const lock=getAdminLock();alert("Too many failed attempts. Please try again after "+Math.ceil((lock.until-Date.now())/60000)+" minute(s).");return;}
  if(!email||!password){alert("Enter owner email and password.");return;}
  if(email===String(ADMIN_CONFIG.email).toLowerCase() && password===String(ADMIN_CONFIG.password)){
    localStorage.removeItem(ADMIN_LOCK_KEY);
    sessionStorage.setItem(ADMIN_SESSION_KEY,"1");
    document.getElementById("adminLoginBox").hidden=true;
    document.getElementById("adminDashboard").hidden=false;
    const em=document.getElementById("adminUserEmail");if(em)em.textContent=ADMIN_CONFIG.email;
    const st=document.getElementById("cloudSecurityState");if(st)st.textContent="Local owner login active";
    renderAdmin();setStatus("Admin login successful.");
  }else{
    const lock=getAdminLock()||{attempts:0};lock.attempts++;
    if(lock.attempts>=ADMIN_MAX_ATTEMPTS){lock.until=Date.now()+15*60*1000;setAdminLock(lock);alert("Too many failed attempts. Admin login is locked for 15 minutes.");}
    else{setAdminLock(lock);alert("Invalid admin email or password. Attempts remaining: "+(ADMIN_MAX_ATTEMPTS-lock.attempts));}
  }
});

document.getElementById("adminResetPassword")?.addEventListener("click",()=>{
  alert("This offline/static version does not send real email OTPs. For real OTP password reset, we will add a PHP + MySQL + email backend when you move the site to hosting.");
});

document.getElementById("logoutAdmin")?.addEventListener("click",()=>{
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById("adminDashboard").hidden=true;
  document.getElementById("adminLoginBox").hidden=false;
  document.getElementById("adminPassword").value="";
});
function renderAdmin(){
 const box=document.getElementById("adminCarList");
 if(box){box.innerHTML=cars.map(c=>`<div class="admin-car-row"><div class="admin-car-main"><img src="${esc(imagePath(c.photos?.[0]||"download.jpg"))}" alt=""><div><b>${esc(c.name)}</b><small>${c.seats} seats • ₹${c.km}/km</small></div></div><label>AC ₹<input type="number" data-id="${c.id}" data-field="ac" value="${c.ac}"></label><label>Non-AC ₹<input type="number" data-id="${c.id}" data-field="nonac" value="${c.nonac}"></label><label>₹/KM <input type="number" data-id="${c.id}" data-field="km" value="${c.km}"></label><label>Photos<input type="file" class="edit-photos" data-id="${c.id}" accept="image/*" multiple></label><button class="admin-save-car" data-id="${c.id}">Save</button><button class="admin-delete-car" data-id="${c.id}" ${cars.length<=1?'disabled':''}>Delete</button></div>`).join("");
  box.querySelectorAll(".admin-save-car").forEach(b=>b.onclick=()=>{const c=cars.find(x=>x.id===b.dataset.id);box.querySelectorAll(`[data-id="${c.id}"]`).forEach(el=>{if(el.dataset.field)c[el.dataset.field]=Number(el.value)});save();renderCars();renderAdmin();setStatus("Car price/rate updated successfully.")});
  box.querySelectorAll(".admin-delete-car").forEach(b=>b.onclick=()=>{if(confirm("Delete this car?")){cars=cars.filter(x=>x.id!==b.dataset.id);save();renderCars();renderAdmin();setStatus("Car removed.")}});
  box.querySelectorAll(".edit-photos").forEach(inp=>inp.addEventListener("change",async e=>{const c=cars.find(x=>x.id===e.target.dataset.id),files=[...(e.target.files||[])];if(!c||!files.length)return;if(files.length>5){e.target.value="";alert("Ek baar mein maximum 5 photos upload karein.");return}try{c.photos=await Promise.all(files.map(f=>compressImageFile(f)));if(!save())return;renderCars();renderAdmin();setStatus("Compressed car photos saved in this browser.")}catch(err){alert(err.message||"Photo update failed.")}}));
 }
 document.getElementById("callNumber").value=contacts.call.replace(/^91/,"");document.getElementById("whatsappNumber").value=contacts.whatsapp.replace(/^91/,"");document.getElementById("smsNumber").value=contacts.sms.replace(/^91/,"");
 renderPlacesAdmin();renderRoutesAdmin();renderReviewsAdmin();renderSettingsAdmin();renderBookings();renderStats();
}
function renderPlacesAdmin(){
 const box=document.getElementById("adminPlaces");
 if(!box)return;
 box.innerHTML=places.length?places.map((p,i)=>`<div class="admin-place-row" data-place-row="${esc(p.id)}"><div class="admin-place-preview"><img src="${esc(imagePath(p.photo||"ujj 1.jpg"))}" alt=""><div><b>${esc(p.name)}</b><small>${esc(p.location||"Ujjain")}</small></div></div><label>Name<input type="text" data-pfield="name" value="${esc(p.name)}"></label><label>Location<input type="text" data-pfield="location" value="${esc(p.location||"")}"></label><label class="place-desc-field">Description<textarea data-pfield="description" rows="2">${esc(p.description||"")}</textarea></label><label>Change Photo<input type="file" class="edit-place-photo" accept="image/*" data-place="${esc(p.id)}"></label><div class="place-row-actions"><button class="admin-place-save" data-place="${esc(p.id)}">Save Changes</button><button class="admin-place-up" data-place="${esc(p.id)}" ${i===0?'disabled':''}>↑</button><button class="admin-place-down" data-place="${esc(p.id)}" ${i===places.length-1?'disabled':''}>↓</button><button class="admin-place-delete" data-place="${esc(p.id)}">Delete</button></div></div>`).join(""):"<p>No famous places added yet.</p>";
 box.querySelectorAll(".admin-place-save").forEach(btn=>btn.onclick=()=>{const id=btn.dataset.place,p=places.find(x=>x.id===id),row=box.querySelector(`[data-place-row="${id}"]`);if(!p||!row)return;row.querySelectorAll("[data-pfield]").forEach(el=>p[el.dataset.pfield]=el.value.trim());savePlaces();renderPublicPlaces();renderPlacesAdmin();setStatus("Famous place updated successfully.")});
 box.querySelectorAll(".edit-place-photo").forEach(inp=>inp.addEventListener("change",async e=>{const f=e.target.files[0],id=e.target.dataset.place,p=places.find(x=>x.id===id);if(!f||!p)return;try{p.photo=await compressImageFile(f);if(!savePlaces())return;renderPublicPlaces();renderPlacesAdmin();setStatus("Compressed famous-place photo saved in this browser.")}catch(err){alert(err.message||"Place photo update failed.")}}));
 box.querySelectorAll(".admin-place-delete").forEach(btn=>btn.onclick=()=>{if(places.length<=1){alert("Keep at least one famous place.");return}if(confirm("Delete this famous place?")){places=places.filter(x=>x.id!==btn.dataset.place);savePlaces();renderPublicPlaces();renderPlacesAdmin();setStatus("Famous place removed.")}});
 box.querySelectorAll(".admin-place-up,.admin-place-down").forEach(btn=>btn.onclick=()=>{const i=places.findIndex(x=>x.id===btn.dataset.place),dir=btn.classList.contains("admin-place-up")?-1:1;if(i<0||i+dir<0||i+dir>=places.length)return;[places[i],places[i+dir]]=[places[i+dir],places[i]];savePlaces();renderPublicPlaces();renderPlacesAdmin();setStatus("Famous place order updated.")});
}
function renderRoutesAdmin(){const box=document.getElementById("adminRoutes");if(!box)return;box.innerHTML=routes.map(r=>`<div class="admin-route-row"><div><b>${esc(r.name)}</b><small class="route-id">ID: ${esc(r.id)}</small></div><label>One-way ₹<input type="number" data-route="${r.id}" data-rfield="oneWay" value="${r.oneWay}"></label><label>2-way ₹<input type="number" data-route="${r.id}" data-rfield="twoWay" value="${r.twoWay}"></label><label>AC extra ₹<input type="number" data-route="${r.id}" data-rfield="extra" value="${r.extra}"></label><button class="admin-save-route" data-route="${r.id}">Save</button><button class="admin-delete-route" data-route="${r.id}">Delete</button></div>`).join("");box.querySelectorAll(".admin-save-route").forEach(b=>b.onclick=()=>{const r=routes.find(x=>x.id===b.dataset.route);box.querySelectorAll(`[data-route="${r.id}"]`).forEach(el=>{if(el.dataset.rfield)r[el.dataset.rfield]=Math.max(0,Number(el.value)||0)});saveRoutes();renderPublicRoutes();renderRoutesAdmin();setStatus("Route fare updated successfully.")});box.querySelectorAll(".admin-delete-route").forEach(b=>b.onclick=()=>{if(routes.length<=1){alert("Keep at least one route.");return}if(confirm("Delete this route?")){routes=routes.filter(r=>r.id!==b.dataset.route);saveRoutes();renderPublicRoutes();renderRoutesAdmin();setStatus("Route removed successfully.")}})}
function renderReviewsAdmin(){const box=document.getElementById("adminReviews");if(!box)return;box.innerHTML=reviews.length?reviews.map(r=>`<div class="admin-review-row"><div><b>${esc(r.name)}</b><small>${esc(r.source||"Customer")} ${r.bookingId?`• ${esc(r.bookingId)}`:""}</small></div><span>⭐ ${r.rating}</span><span>${esc(r.text)}</span><span>${r.verified?"✓ Verified":"Pending"}</span><button data-review="${r.id}">Delete</button></div>`).join(""):"<p>No reviews added. Add only real customer feedback.</p>";box.querySelectorAll("button").forEach(b=>b.onclick=()=>{reviews=reviews.filter(r=>r.id!==b.dataset.review);saveReviews();renderReviewsAdmin();renderPublicReviews();setStatus("Review removed.")})}
function renderSettingsAdmin(){document.getElementById("siteName").value=settings.siteName;document.getElementById("advanceAmount").value=settings.advance;document.getElementById("siteAddress").value=settings.address;document.getElementById("heroHeading").value=settings.heroHeading;}
function renderBookings(){const box=document.getElementById("adminBookings");if(!box)return;box.innerHTML=bookings.length?bookings.slice(0,100).map(b=>`<div class="booking-row"><b>${esc(b.name||b.customer_name)}</b><span>${esc(b.mobile)}</span><span>${esc(b.date||b.booking_date||"")} ${esc(b.time||b.booking_time||"")}</span><span>${esc(b.destination||"")}</span><select data-booking="${b.cloudId||b.id}" class="booking-status"><option ${b.status==="Pending"?"selected":""}>Pending</option><option ${b.status==="Confirmed"?"selected":""}>Confirmed</option><option ${b.status==="Completed"?"selected":""}>Completed</option><option ${b.status==="Cancelled"?"selected":""}>Cancelled</option></select></div>`).join(""):"<p>No bookings yet.</p>";box.querySelectorAll(".booking-status").forEach(s=>s.onchange=async()=>{const b=bookings.find(x=>String(x.cloudId||x.id)===s.dataset.booking);if(b){b.status=s.value;saveBookings();renderStats();setStatus("Booking status updated.")}})}
function renderStats(){const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-"),month=today.slice(0,7);document.getElementById("statBookings").textContent=bookings.length;document.getElementById("statToday").textContent=bookings.filter(b=>{const d=String(b.createdAt||"").slice(0,10);return d===today}).length;document.getElementById("statMonth").textContent=bookings.filter(b=>String(b.createdAt||"").slice(0,7)===month).length}
function setStatus(t){const x=document.getElementById("adminStatus");if(x)x.textContent=t}
document.getElementById("newCarPhotos")?.addEventListener("change", async e => {
  const files=[...(e.target.files||[])], preview=document.getElementById("newCarPhotoPreview");
  pendingPhotos=[]; if(preview)preview.innerHTML=""; if(!files.length)return;
  if(files.length>5){e.target.value="";alert("Ek baar mein maximum 5 photos upload karein.");return;}
  try {
    pendingPhotos=await Promise.all(files.map(f=>compressImageFile(f)));
    if(preview)pendingPhotos.forEach(src=>{const img=document.createElement("img");img.alt="Compressed car photo preview";img.src=src;preview.appendChild(img);});
  } catch(err){pendingPhotos=[];e.target.value="";alert(err.message||"Photo upload failed.");}
});
document.getElementById("addCar")?.addEventListener("click",()=>{const name=document.getElementById("newCarName").value.trim();if(!name){alert("Enter car name.");return}cars.push({id:"car-"+Date.now(),name,seats:Number(document.getElementById("newCarSeats").value)||7,ac:Number(document.getElementById("newCarAC").value)||0,nonac:Number(document.getElementById("newCarNonAC").value)||0,km:Number(document.getElementById("newCarKm").value)||0,photos:pendingPhotos.length?pendingPhotos:["download.jpg"]});save();pendingPhotos=[];document.getElementById("newCarPhotos").value="";document.getElementById("newCarPhotoPreview").innerHTML="";renderCars();renderAdmin();setStatus("New car added with uploaded photos.")});
document.getElementById("saveContacts")?.addEventListener("click",()=>{
 const norm=x=>{let n=String(x||"").replace(/\D/g,"");if(n.startsWith("00"))n=n.slice(2);if(n.length===10)n="91"+n;if(n.length<11||n.length>15)throw new Error("Enter a valid 10-digit Indian mobile number.");return n};
 try {
  const whatsapp=norm(document.getElementById("whatsappNumber").value);
  const smsInput=document.getElementById("smsNumber").value;
  contacts={call:whatsapp,whatsapp,sms:smsInput.trim()?norm(smsInput):whatsapp};
  if(!saveContacts()) return;
  applyContacts();
  document.getElementById("callNumber").value=whatsapp.replace(/^91/,"");
  document.getElementById("whatsappNumber").value=whatsapp.replace(/^91/,"");
  document.getElementById("smsNumber").value=contacts.sms.replace(/^91/,"");
  setStatus("Call aur WhatsApp dono ab +"+whatsapp+" par set hain.");
 } catch(err) { alert(err.message||"Please check the phone numbers."); }
});
let pendingPlacePhoto="";
document.getElementById("newPlacePhoto")?.addEventListener("change",async e=>{const f=e.target.files[0],preview=document.getElementById("newPlacePhotoPreview");pendingPlacePhoto="";if(preview)preview.innerHTML="";if(!f)return;try{pendingPlacePhoto=await compressImageFile(f);if(preview){const img=document.createElement("img");img.alt="Compressed place photo preview";img.src=pendingPlacePhoto;preview.appendChild(img)}}catch(err){e.target.value="";alert(err.message||"Place photo upload failed.")}});
document.getElementById("addPlace")?.addEventListener("click",()=>{const name=document.getElementById("newPlaceName").value.trim(),location=document.getElementById("newPlaceLocation").value.trim()||"Ujjain",description=document.getElementById("newPlaceDescription").value.trim();if(!name||!description){alert("Enter place name and description.");return}if(!pendingPlacePhoto){alert("Please upload a place photo.");return}places.push({id:"place-"+Date.now(),name,location,description,photo:pendingPlacePhoto});savePlaces();renderPublicPlaces();renderPlacesAdmin();document.getElementById("newPlaceName").value="";document.getElementById("newPlaceLocation").value="";document.getElementById("newPlaceDescription").value="";document.getElementById("newPlacePhoto").value="";document.getElementById("newPlacePhotoPreview").innerHTML="";pendingPlacePhoto="";setStatus("New famous place added successfully.")});
document.getElementById("addRoute")?.addEventListener("click",()=>{const name=document.getElementById("newRouteName").value.trim();if(!name){alert("Enter route name.");return}if(routes.some(r=>r.name.toLowerCase()===name.toLowerCase())){alert("This route already exists.");return}routes.push({id:"route-"+Date.now(),name,oneWay:Math.max(0,Number(document.getElementById("newRouteOneWay").value)||0),twoWay:Math.max(0,Number(document.getElementById("newRouteTwoWay").value)||0),extra:Math.max(0,Number(document.getElementById("newRouteExtra").value)||0)});saveRoutes();renderPublicRoutes();renderRoutesAdmin();document.getElementById("newRouteName").value="";document.getElementById("newRouteOneWay").value=0;document.getElementById("newRouteTwoWay").value=0;document.getElementById("newRouteExtra").value=200;setStatus("New route added successfully.")});
document.getElementById("addReview")?.addEventListener("click",()=>{const name=document.getElementById("reviewName").value.trim(),text=document.getElementById("reviewText").value.trim(),source=document.getElementById("reviewSource").value.trim()||"Customer",bookingId=document.getElementById("reviewBookingId").value.trim(),rating=Math.min(5,Math.max(1,Number(document.getElementById("reviewRating").value)||5)),verified=document.getElementById("reviewVerified").checked;if(!name||!text){alert("Enter the real customer's name and actual review text.");return}if(!verified){alert("For public display, please confirm this is genuine customer feedback by checking the verified box.");return}reviews.unshift({id:"rev-"+Date.now(),name,rating,text,source,bookingId,verified:true});saveReviews();renderReviewsAdmin();renderPublicReviews();document.getElementById("reviewName").value="";document.getElementById("reviewText").value="";document.getElementById("reviewSource").value="";document.getElementById("reviewBookingId").value="";document.getElementById("reviewVerified").checked=false;setStatus("Verified genuine review added.")});
document.getElementById("saveSettings")?.addEventListener("click",()=>{settings={siteName:document.getElementById("siteName").value.trim()||DEFAULT_SETTINGS.siteName,advance:Number(document.getElementById("advanceAmount").value)||500,address:document.getElementById("siteAddress").value.trim()||DEFAULT_SETTINGS.address,heroHeading:document.getElementById("heroHeading").value.trim()||DEFAULT_SETTINGS.heroHeading};saveSettings();applySettings();setStatus("Website settings updated.")});
// Local backup tools: export sensitive booking information only to a device you control.
const BACKUP_FORMAT="ujjain-traveller-local-backup-v1";
function makeBackupPayload(){
  return {format:BACKUP_FORMAT,version:1,createdAt:new Date().toISOString(),note:"This is a local-browser backup; it is not synced to a server.",data:{cars,contacts,bookings,routes:routes.filter(r=>!isOmkareshwarReverseRoute(r.name)),reviews,places,settings}};
}
function downloadTextFile(name,text,type){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
document.getElementById("downloadFullBackup")?.addEventListener("click",()=>{
  try { const payload=makeBackupPayload(); downloadTextFile("ujjain-traveller-backup-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(payload,null,2),"application/json;charset=utf-8"); setStatus("Full JSON backup downloaded. Keep it private because it contains customer details."); }
  catch(err){alert("Backup nahi ban saka: "+(err.message||"unknown error"));}
});
function csvCell(value){let v=String(value??"");if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
document.getElementById("exportBookingsCsv")?.addEventListener("click",()=>{
 const cols=[["id","Booking ID"],["createdAt","Created At"],["name","Customer Name"],["mobile","Mobile"],["date","Journey Date"],["time","Time"],["pickup","Pickup"],["destination","Destination"],["vehicle","Vehicle"],["ac","AC"],["journeyType","Journey Type"],["passengers","Passengers"],["estimatedFare","Estimated Fare INR"],["advance","Advance INR"],["status","Status"],["message","Special Request"]];
 const rows=[cols.map(c=>c[1]),...bookings.map(b=>cols.map(c=>b[c[0]]))];
 const csv="\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
 downloadTextFile("ujjain-traveller-bookings-"+new Date().toISOString().slice(0,10)+".csv",csv,"text/csv;charset=utf-8");setStatus("Booking CSV exported. Store it securely; it contains customer details.");
});
document.getElementById("restoreBackupFile")?.addEventListener("change",async e=>{
 const file=e.target.files?.[0]; if(!file)return;
 if(file.size>25*1024*1024){alert("Backup file 25 MB se badi hai. File check karein.");e.target.value="";return;}
 try {
  const parsed=JSON.parse(await file.text()),d=parsed?.data;
  if(parsed?.format!==BACKUP_FORMAT||!d||!Array.isArray(d.cars)||!Array.isArray(d.bookings)||!Array.isArray(d.routes)||!Array.isArray(d.reviews)||!Array.isArray(d.places)||!d.contacts||!d.settings){throw new Error("Yeh valid Ujjain Traveller backup file nahi hai.");}
  const restoredRoutes=d.routes.filter(r=>r&&typeof r.name==="string"&&!isOmkareshwarReverseRoute(r.name));
  if(!restoredRoutes.some(r=>routeKey(r.name)===routeKey("Ujjain → Omkareshwar"))) restoredRoutes.unshift(DEFAULT_ROUTES[0]);
  if(!confirm("Restore backup se is browser ka current website data replace hoga. Pehle current data ka Full Backup download kar lena zaroori hai. Continue?")){e.target.value="";return;}
  // Keep an automatic copy of the current keys before replacing them.
  downloadTextFile("ujjain-traveller-before-restore-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(makeBackupPayload(),null,2),"application/json;charset=utf-8");
  const pairs=[[STORAGE+"Cars",d.cars],[CONTACTS_KEY,{...d.contacts,call:String(d.contacts.whatsapp||DEFAULT_CONTACTS.whatsapp).replace(/\D/g,"")}],[BOOKINGS_KEY,d.bookings],[ROUTES_KEY,restoredRoutes],[REVIEWS_KEY,d.reviews],[PLACES_KEY,d.places],[SETTINGS_KEY,d.settings],[ROUTE_PRICE_VERSION_KEY,ROUTE_PRICE_VERSION]];
  const before=pairs.map(([key])=>[key,localStorage.getItem(key)]);
  try { pairs.forEach(([key,value])=>localStorage.setItem(key,JSON.stringify(value))); }
  catch(writeErr){before.forEach(([key,value])=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch(rollbackErr){console.error("Restore rollback failed",rollbackErr)}});throw new Error("Browser storage mein space kam hai, isliye restore cancel kiya. Current data ko change karne ki koshish undo kar di gayi. Backup file aur photo size check karein.");}
  alert("Backup restore ho gaya. Website reload hogi.");location.reload();
 } catch(err){console.error(err);alert("Backup restore nahi hua: "+(err.message||"file ya browser storage check karein."));}
 finally {e.target.value="";}
});
const slider=document.getElementById("ujjainSlider");document.getElementById("ujjainPrev")?.addEventListener("click",()=>slider?.scrollBy({left:-320,behavior:"smooth"}));document.getElementById("ujjainNext")?.addEventListener("click",()=>slider?.scrollBy({left:320,behavior:"smooth"}));
// Remove legacy Eeco data and old placeholder reviews from older demos.
reviews=reviews.filter(r=>r.verified===true);saveReviews();
cars=cars.filter(c=>!String(c.name).toLowerCase().includes("eeco"));if(!cars.length)cars=DEFAULT_CARS;save();
applyContacts();applySettings();renderCars();renderPublicPlaces();renderPublicRoutes();renderPublicReviews();
