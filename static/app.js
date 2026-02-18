const MAX_POINTS = 5

/* =====================================================
WHITE BACKGROUND FOR CHARTS
===================================================== */
const whiteBackgroundPlugin = {
id: "whiteBackground",
beforeDraw(chart){
const ctx = chart.canvas.getContext("2d")
ctx.save()
ctx.globalCompositeOperation="destination-over"
ctx.fillStyle="white"
ctx.fillRect(0,0,chart.width,chart.height)
ctx.restore()
}
}

/* =====================================================
SAFE ELEMENT GETTER (prevents null crash)
===================================================== */
function getEl(id){
const el=document.getElementById(id)
return el
}

/* =====================================================
CREATE CHART HELPERS
===================================================== */

function createLineChart(id){
const el=getEl(id)
if(!el) return null

return new Chart(el,{
type:"line",
data:{
labels:[],
datasets:[
{label:"Kyber",data:[],borderWidth:2,tension:.3},
{label:"RSA",data:[],borderWidth:2,tension:.3},
{label:"ECDH",data:[],borderWidth:2,tension:.3}
]
},
options:{
responsive:true,
maintainAspectRatio:false,
animation:true,
scales:{y:{beginAtZero:true}}
},
plugins:[whiteBackgroundPlugin]
})
}

function createBarChart(id,label){
const el=getEl(id)
if(!el) return null

return new Chart(el,{
type:"bar",
data:{
labels:["Kyber","RSA","ECDH"],
datasets:[{
label:label,
data:[0,0,0],
borderWidth:1
}]
},
options:{responsive:true,animation:true},
plugins:[whiteBackgroundPlugin]
})
}

/* =====================================================
CREATE ALL 8 CHARTS
===================================================== */

const keygen=createLineChart("keygen")
const encrypt=createLineChart("encrypt")
const decrypt=createLineChart("decrypt")
const total=createLineChart("total")

const pubkey=createBarChart("pubkey","Public Key Size")
const cipher=createBarChart("cipher","Ciphertext Size")
const quantum=createBarChart("quantum","Quantum Score")
const throughput=createBarChart("throughput","Throughput")

/* =====================================================
SLIDING WINDOW (5 VALUES)
===================================================== */

function pushData(chart,time,p,r,e){
if(!chart) return

chart.data.labels.push(time)
chart.data.datasets[0].data.push(p)
chart.data.datasets[1].data.push(r)
chart.data.datasets[2].data.push(e)

if(chart.data.labels.length>MAX_POINTS){
chart.data.labels.shift()
chart.data.datasets.forEach(d=>d.data.shift())
}

chart.update()
}

/* =====================================================
REALTIME UPDATE (every 3s)
===================================================== */

async function update(){
try{
const res=await fetch("/metrics/live")
const d=await res.json()
const t=new Date().toLocaleTimeString()

pushData(keygen,t,d.pqc.keygen_ms,d.rsa.keygen_ms,d.ecdh.keygen_ms)
pushData(encrypt,t,d.pqc.encrypt_ms,d.rsa.encrypt_ms,d.ecdh.encrypt_ms)
pushData(decrypt,t,d.pqc.decrypt_ms,d.rsa.decrypt_ms,d.ecdh.decrypt_ms)
pushData(total,t,d.pqc.total_ms,d.rsa.total_ms,d.ecdh.total_ms)

/* update bar charts */
if(pubkey){
pubkey.data.datasets[0].data=[d.pqc.public_key,d.rsa.public_key,d.ecdh.public_key]
pubkey.update()
}

if(cipher){
cipher.data.datasets[0].data=[d.pqc.ciphertext,d.rsa.ciphertext,d.ecdh.ciphertext]
cipher.update()
}

if(quantum){
quantum.data.datasets[0].data=[d.pqc.quantum_score,d.rsa.quantum_score,d.ecdh.quantum_score]
quantum.update()
}

if(throughput){
throughput.data.datasets[0].data=[d.pqc.throughput_ops,d.rsa.throughput_ops,d.ecdh.throughput_ops]
throughput.update()
}

/* =====================================================
PQC SUPREMACY CALCULATION
===================================================== */

const pqcTotal=d.pqc.total_ms
const rsaTotal=d.rsa.total_ms
const ecdhTotal=d.ecdh.total_ms

/* security winner */
const securityWinner=d.pqc.quantum_score===1 ? "Kyber (PQC)" : "Classical"

/* performance winner (lowest time wins) */
let perfWinner="Kyber"
let min=Math.min(pqcTotal,rsaTotal,ecdhTotal)
if(min===rsaTotal) perfWinner="RSA"
if(min===ecdhTotal) perfWinner="ECDH"

/* overall score */
let scores={
Kyber:(d.pqc.quantum_score*2)+(1/pqcTotal),
RSA:(d.rsa.quantum_score*2)+(1/rsaTotal),
ECDH:(d.ecdh.quantum_score*2)+(1/ecdhTotal)
}

let overall=Object.keys(scores).reduce((a,b)=>scores[a]>scores[b]?a:b)

/* update UI safely */
const secEl=getEl("securityWinner")
const perfEl=getEl("performanceWinner")
const overEl=getEl("overallWinner")

if(secEl) secEl.innerText=securityWinner
if(perfEl) perfEl.innerText=perfWinner
if(overEl) overEl.innerText=overall

}catch(err){
console.error("Metrics fetch failed",err)
}
}

update()
setInterval(update,3000)

/* =====================================================
SMOOTH 3D ROTATING CAROUSEL
===================================================== */

if(document.querySelector(".mySwiper")){
new Swiper(".mySwiper",{
effect:"coverflow",
grabCursor:true,
centeredSlides:true,
slidesPerView:3,
spaceBetween:50,
coverflowEffect:{
rotate:40,
stretch:0,
depth:320,
modifier:1,
slideShadows:true
},
speed:1200,
autoplay:{delay:2500,disableOnInteraction:false},
loop:true,
keyboard:{enabled:true},
mousewheel:true
})
}

/* =====================================================
GRAPH TITLES (for modal)
===================================================== */

const graphTitles={
keygen:"Key Generation Time",
encrypt:"Encryption Time",
decrypt:"Decryption Time",
total:"Total Operation Time",
pubkey:"Public Key Size",
cipher:"Ciphertext Size",
quantum:"Quantum Security Score",
throughput:"Throughput"
}

/* =====================================================
CLICK → BIG GRAPH MODAL
===================================================== */

let modalChartInstance=null

document.querySelectorAll("canvas").forEach(c=>{
c.addEventListener("click",()=>openModal(c.id))
})

function openModal(id){

const modal=getEl("modal")
const modalTitle=getEl("modalTitle")
const ctx=getEl("modalChart")

if(!modal||!ctx) return

modal.style.display="block"
if(modalTitle) modalTitle.innerText=graphTitles[id]||"Graph"

const src=Chart.getChart(id)
if(!src) return

if(modalChartInstance) modalChartInstance.destroy()

modalChartInstance=new Chart(ctx,{
type:src.config.type,
data:JSON.parse(JSON.stringify(src.data)),
options:{responsive:true,maintainAspectRatio:false},
plugins:[whiteBackgroundPlugin]
})

buildTable(src.data)
}

function closeModal(){
const modal=getEl("modal")
if(modal) modal.style.display="none"
if(modalChartInstance) modalChartInstance.destroy()
}

/* =====================================================
DATA TABLE FOR GRAPH
===================================================== */

function buildTable(data){
const table=getEl("dataTable")
if(!table) return

let html=`
<tr>
<th>Time</th>
<th>Kyber</th>
<th>RSA</th>
<th>ECDH</th>
</tr>
`

for(let i=0;i<data.labels.length;i++){
html+=`
<tr>
<td>${data.labels[i]||"-"}</td>
<td>${data.datasets[0].data[i]||"-"}</td>
<td>${data.datasets[1].data[i]||"-"}</td>
<td>${data.datasets[2].data[i]||"-"}</td>
</tr>`
}

table.innerHTML=html
}
