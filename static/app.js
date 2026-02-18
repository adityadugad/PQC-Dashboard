const MAX_POINTS = 5

function createLineChart(id,label){
return new Chart(document.getElementById(id),{
type:"line",
data:{
labels:[],
datasets:[
{label:"Kyber",data:[]},
{label:"RSA",data:[]},
{label:"ECDH",data:[]}
]
}
})
}

function createBarChart(id,label){
return new Chart(document.getElementById(id),{
type:"bar",
data:{
labels:["Kyber","RSA","ECDH"],
datasets:[{label:label,data:[0,0,0]}]
}
})
}

// ---------- CREATE ALL 8 GRAPHS ----------
const keygen=createLineChart("keygen")
const encrypt=createLineChart("encrypt")
const decrypt=createLineChart("decrypt")
const total=createLineChart("total")

const pubkey=createBarChart("pubkey","Public Key Size")
const cipher=createBarChart("cipher","Ciphertext Size")
const quantum=createBarChart("quantum","Quantum Score")
const throughput=createBarChart("throughput","Throughput")

// ---------- SLIDING WINDOW ----------
function pushData(chart,time,pqc,rsa,ecdh){
chart.data.labels.push(time)
chart.data.datasets[0].data.push(pqc)
chart.data.datasets[1].data.push(rsa)
chart.data.datasets[2].data.push(ecdh)

if(chart.data.labels.length>MAX_POINTS){
chart.data.labels.shift()
chart.data.datasets.forEach(d=>d.data.shift())
}
chart.update()
}

// ---------- UPDATE DATA ----------
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

pubkey.update();cipher.update();quantum.update();throughput.update()
}

setInterval(update,3000)

// ---------- ROTATING SLIDES ----------
new Swiper(".swiper",{
effect:"coverflow",
slidesPerView:1,
centeredSlides:true,
coverflowEffect:{rotate:30,depth:200}
})

// ---------- MAXIMIZE GRAPH ----------
document.querySelectorAll("canvas").forEach(c=>{
c.onclick=()=>openModal(c.id)
})

function openModal(id){
document.getElementById("modal").style.display="block"

const src=Chart.getChart(id)
const modalChart=new Chart(document.getElementById("modalChart"),{
type:src.config.type,
data:JSON.parse(JSON.stringify(src.data))
})

createTable(src.data)
}

function closeModal(){
document.getElementById("modal").style.display="none"
}

function createTable(data){
let html="<tr><th>Time</th><th>Kyber</th><th>RSA</th><th>ECDH</th></tr>"
for(let i=0;i<data.labels.length;i++){
html+=`<tr><td>${data.labels[i]}</td>
<td>${data.datasets[0].data[i]}</td>
<td>${data.datasets[1].data[i]}</td>
<td>${data.datasets[2].data[i]}</td></tr>`
}
document.getElementById("dataTable").innerHTML=html
}
