const BUSINESS_NUMBER = "918462834667";
const ADMIN_PASSWORD = "admin123"; // local demo only; production needs server-side auth
const DEFAULT_CARS = [
  {id:"ertiga", name:"Maruti Suzuki Ertiga", seats:7, ac:4500, nonac:4000, km:15},
  {id:"eeco", name:"Maruti Suzuki Eeco", seats:7, ac:4000, nonac:3500, km:13}
];

let cars = JSON.parse(localStorage.getItem("ujjainTravellerCars") || "null") || DEFAULT_CARS;
const saveCars = () => localStorage.setItem("ujjainTravellerCars", JSON.stringify(cars));
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");

function renderCars(){
  const box=document.getElementById("carContainer");
  if(!box) return;
  box.innerHTML=cars.map((c,i)=>`<div class="car-card"><div class="car-photo ${i%2?'car-eeco':'car-ertiga'}"><span>${c.seats} SEATER</span></div><div class="car-details"><h2>${escapeHtml(c.name)}</h2><p>Comfortable option for Ujjain and nearby pilgrimage travel.</p><div class="prices"><div><small>AC</small><h3>${money(c.ac)}</h3><p>Ujjain → Omkareshwar</p></div><div><small>NON-AC</small><h3>${money(c.nonac)}</h3><p>Ujjain → Omkareshwar</p></div></div><button class="select-btn" onclick="selectCar('${c.id}')">Select Car</button></div></div>`).join("");
  renderVehicleOptions();
}
function renderVehicleOptions(){
  const v=document.getElementById("vehicle"); if(!v) return;
  const current=v.value;
  v.innerHTML=cars.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if(cars.some(c=>c.id===current)) v.value=current;
  updateFare();
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function getSelectedCar(){ return cars.find(c=>c.id===document.getElementById("vehicle")?.value) || cars[0]; }
function updateFare(){
  const f=document.getElementById("fare"); if(!f) return;
  const c=getSelectedCar(), ac=document.getElementById("ac")?.value, dest=document.getElementById("destination")?.value;
  f.textContent=(dest==="Ujjain → Omkareshwar" && c) ? money(ac==="AC"?c.ac:c.nonac) : "On Request";
}
function selectCar(id){ const v=document.getElementById("vehicle"); if(v){v.value=id;updateFare();} document.getElementById("booking")?.scrollIntoView({behavior:"smooth"}); }
window.selectCar=selectCar;

function createBookingMessage(){
  const c=getSelectedCar();
  const name=document.getElementById("name").value.trim(), mobile=document.getElementById("mobile").value.trim();
  const date=document.getElementById("date").value, time=document.getElementById("time").value;
  const pickup=document.getElementById("pickup").value, trip=document.getElementById("trip").value;
  const ac=document.getElementById("ac").value, passengers=document.getElementById("passengers").value;
  const dest=document.getElementById("destination").value, msg=document.getElementById("message").value.trim();
  const finalFare=(dest==="Ujjain → Omkareshwar"&&c)?money(ac==="AC"?c.ac:c.nonac):"On Request";
  return `🚕 *NEW CAB BOOKING*\n\n👤 *Customer:* ${name}\n📱 *Mobile:* ${mobile}\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n📍 *Pickup:* ${pickup}\n🛣️ *Destination:* ${dest}\n🚗 *Vehicle:* ${c?.name || "Not selected"}\n❄️ *AC:* ${ac}\n👥 *Passengers:* ${passengers}\n🎟️ *Type:* ${trip}\n💰 *Estimated Fare:* ${finalFare}\n💵 *Advance Required:* ₹500\n💳 *Balance:* Remaining payment when the car reaches the pickup point.\n📝 *Special Request:* ${msg||"None"}\n\n🏢 *Ujjain Omkareshwar Baglamukhi Tour & Travellers*\n📍 Near Mahakal Mandir, Galaxy Hotel, Ujjain\n📍 Alternate Pickup: Hari Phatak Bridge, Ujjain`;
}

const form=document.getElementById("bookingForm");
form?.addEventListener("submit",e=>{e.preventDefault();const m=document.getElementById("mobile").value.replace(/\D/g,"");if(m.length!==10){alert("Please enter a valid 10 digit mobile number.");return;}window.open("https://wa.me/"+BUSINESS_NUMBER+"?text="+encodeURIComponent(createBookingMessage()),"_blank");});
window.sendSMS=()=>{window.location.href="sms:+"+BUSINESS_NUMBER+"?body="+encodeURIComponent(createBookingMessage());};

document.getElementById("vehicle")?.addEventListener("change",updateFare); document.getElementById("ac")?.addEventListener("change",updateFare); document.getElementById("destination")?.addEventListener("change",updateFare);

function openAdmin(){document.getElementById("adminModal").setAttribute("aria-hidden","false");}
function closeAdmin(){document.getElementById("adminModal").setAttribute("aria-hidden","true");}
document.getElementById("openAdmin")?.addEventListener("click",openAdmin); document.getElementById("closeAdmin")?.addEventListener("click",closeAdmin);
document.getElementById("adminModal")?.addEventListener("click",e=>{if(e.target.id==="adminModal")closeAdmin();});

document.getElementById("adminLogin")?.addEventListener("click",()=>{if(document.getElementById("adminPassword").value!==ADMIN_PASSWORD){alert("Wrong admin password.");return;}document.getElementById("adminLoginBox").hidden=true;document.getElementById("adminDashboard").hidden=false;renderAdmin();});
document.getElementById("logoutAdmin")?.addEventListener("click",()=>{document.getElementById("adminDashboard").hidden=true;document.getElementById("adminLoginBox").hidden=false;document.getElementById("adminPassword").value="";});
function renderAdmin(){const box=document.getElementById("adminCarList");if(!box)return;box.innerHTML=cars.map(c=>`<div class="admin-car-row"><div><b>${escapeHtml(c.name)}</b><small>${c.seats} seats • ₹${c.km}/km</small></div><label>AC ₹<input type="number" data-id="${c.id}" data-field="ac" value="${c.ac}"></label><label>Non-AC ₹<input type="number" data-id="${c.id}" data-field="nonac" value="${c.nonac}"></label><label>₹/KM <input type="number" data-id="${c.id}" data-field="km" value="${c.km}"></label><button class="admin-save-car" data-id="${c.id}">Save</button><button class="admin-delete-car" data-id="${c.id}" ${cars.length<=1?'disabled':''}>Delete</button></div>`).join("");
box.querySelectorAll(".admin-save-car").forEach(b=>b.onclick=()=>{const c=cars.find(x=>x.id===b.dataset.id);box.querySelectorAll(`[data-id="${c.id}"]`).forEach(el=>{if(el.dataset.field)c[el.dataset.field]=Number(el.value);});saveCars();renderCars();renderAdmin();setStatus("Car price updated successfully.");});
box.querySelectorAll(".admin-delete-car").forEach(b=>b.onclick=()=>{if(confirm("Delete this car?")){cars=cars.filter(x=>x.id!==b.dataset.id);saveCars();renderCars();renderAdmin();setStatus("Car removed.");}});}
function setStatus(t){const x=document.getElementById("adminStatus");if(x)x.textContent=t;}
document.getElementById("addCar")?.addEventListener("click",()=>{const name=document.getElementById("newCarName").value.trim();if(!name){alert("Enter car name.");return;}cars.push({id:"car-"+Date.now(),name,seats:Number(document.getElementById("newCarSeats").value)||7,ac:Number(document.getElementById("newCarAC").value)||0,nonac:Number(document.getElementById("newCarNonAC").value)||0,km:Number(document.getElementById("newCarKm").value)||0});saveCars();renderCars();renderAdmin();setStatus("New car added successfully.");document.getElementById("newCarName").value="";});

// Ujjain slider
const slider=document.getElementById("ujjainSlider"); document.getElementById("ujjainPrev")?.addEventListener("click",()=>slider?.scrollBy({left:-320,behavior:"smooth"})); document.getElementById("ujjainNext")?.addEventListener("click",()=>slider?.scrollBy({left:320,behavior:"smooth"}));
renderCars();
