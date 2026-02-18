const createChart=(id,label)=>new Chart(document.getElementById(id),{
type:"line",
data:{labels:[],datasets:[
{label:"Kyber",data:[]},
{label:"RSA",data:[]},
{label:"ECDH",data:[]}
]}
})

const keygen=createChart("keygen")
const encrypt=createChart("encrypt")
const total=createChart("total")

async function update(){
const res=await fetch("/metrics/live")
const d=await res.json()
const t=new Date().toLocaleTimeString()

;[[keygen,"keygen_ms"],[encrypt,"encrypt_ms"],[total,"total_ms"]]
.forEach(([chart,field])=>{
chart.data.labels.push(t)
chart.data.datasets[0].data.push(d.pqc[field])
chart.data.datasets[1].data.push(d.rsa[field])
chart.data.datasets[2].data.push(d.ecdh[field])
chart.update()
})
}

setInterval(update,3000)

new Swiper(".swiper",{effect:"coverflow",slidesPerView:1,centeredSlides:true})
