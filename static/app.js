const MAX_POINTS = 5

/* =========================
CREATE CHART HELPERS
========================= */

function createLineChart(id){
return new Chart(document.getElementById(id),{
type:"line",
data:{
labels:[],
datasets:[
{label:"Kyber",data:[],borderWidth:2},
{label:"RSA",data:[],borderWidth:2},
{label:"ECDH",data:[],borderWidth:2}
]
},
options:{
responsive:true,
scales:{y:{type:"logarithmic"}}
}
})
}

function createBarChart(id,label){
return new Chart(document.getElementById(id),{
type:"bar",
data:{
labels:["Kyber","RSA","ECDH"],
datasets:[{label:label,data:[0,0,0]}]
},
options:{responsive:true}
})
}

/* =========================
CREATE ALL 8 CHARTS
========================= */

const keygen=createLineChart("keygen")
const encrypt=createLineChart("encrypt")
const decrypt=createLineChart("decrypt")
const total=createLineChart("total")

const pubkey=createBarChart("pubkey","Public Key Size")
const cipher=createBarChart("cipher","Ciphertext Size")
const quantum=createBarChart("quantum","Quantum Score")
const throughput=createBarChart("throughput","Throughput")

/* =========================
SLIDING WINDOW
========================= */

function pushData(chart,time,p,r,e){
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

/* =========================
REALTIME UPDATE
========================= */

async function update(){
const res=await fetch("/metrics/live")
const d=await res.json()
const t=new Date().toLocaleTimeString()

pushData(keygen,t,d.pqc.keygen_ms,d.rsa.keygen_ms,d.ecdh.keygen_ms)
pushData(encrypt,t,d.pqc.encrypt_ms,d.rsa.encrypt_ms,d.ecdh.encrypt_ms)
pushData(decrypt,t,d.pqc.decrypt_ms,d.rsa.decrypt_ms,d.ecdh.decrypt_ms)
pushData(total,t,d.pqc.total_ms,d.rsa.total_ms,d.ecdh.total_ms)

pubkey.data.datasets[0].data=[d.pqc.public_key,d.rsa.public_key,d.ecdh.public_key]
cipher.data.datasets[0].data=[d.pqc.ciphertext,d.rsa.ciphertext,d.ecdh.ciphertext]
quantum.data.datasets[0].data=[d.pqc.quantum_score,d.rsa.quantum_score,d.ecdh.quantum_score]
throughput.data.datasets[0].data=[d.pqc.throughput_ops,d.rsa.throughput_ops,d.ecdh.throughput_ops]

pubkey.update()
cipher.update()
quantum.update()
throughput.update()
}

update()
setInterval(update,3000)

/* =========================
ROTATING CAROUSEL
========================= */

new Swiper(".mySwiper",{
effect:"coverflow",
grabCursor:true,
centeredSlides:true,
slidesPerView:"auto",
coverflowEffect:{
rotate:50,
depth:200,
slideShadows:true
}
})

/* =========================
CLICK → MAXIMIZE GRAPH
========================= */

document.querySelectorAll("canvas").forEach(c=>{
c.addEventListener("click",()=>openModal(c.id))
})

function openModal(id){
document.getElementById("modal").style.display="block"

const src=Chart.getChart(id)

new Chart(document.getElementById("modalChart"),{
type:src.config.type,
data:JSON.parse(JSON.stringify(src.data))
})

buildTable(src.data)
}

function closeModal(){
document.getElementById("modal").style.display="none"
}

/* =========================
DATA TABLE FOR GRAPH
========================= */

function buildTable(data){
let html="<tr><th>Time</th><th>Kyber</th><th>RSA</th><th>ECDH</th></tr>"

for(let i=0;i<data.labels.length;i++){
html+=`<tr>
<td>${data.labels[i]||"-"}</td>
<td>${data.datasets[0].data[i]||"-"}</td>
<td>${data.datasets[1].data[i]||"-"}</td>
<td>${data.datasets[2].data[i]||"-"}</td>
</tr>`
}

document.getElementById("dataTable").innerHTML=html
}
