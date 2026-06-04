function calc(){
let z=parseFloat(document.getElementById('z').value);
let p=Math.exp(-0.717*z*z-0.416*z*z*z);
document.getElementById('out').innerHTML='Approx p-value: '+p.toFixed(4);
}
document.getElementById('csv').addEventListener('change',e=>{
document.getElementById('out').innerHTML='CSV loaded successfully';
});