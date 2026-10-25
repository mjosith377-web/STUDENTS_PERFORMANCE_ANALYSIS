/*
 * Optional Supabase setup:
 * 1. Create a Supabase project and run supabase_schema.sql.
 * 2. Replace the empty values below with your project URL and anon/publishable key.
 * 3. Keep Row Level Security enabled. Never put a service-role key in browser code.
 */
const SUPABASE_URL = "https://znhsxhgwcljpeyjklker.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZurOQvWRYHdzPLEAXJFAdA_c27WNjXb";
const STORAGE_KEY = "studyHabitsResponses_v1";
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = hasSupabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let responses = [];

const form = document.querySelector("#surveyForm");
const message = document.querySelector("#formMessage");
const fields = ["study_hours","attendance","revision","study_days","study_method","sleep_hours","practice","phone_distraction","entertainment_hours","cgpa"];

function readLocal(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveLocal(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(responses)); }
function num(v){ const x = Number(v); return Number.isFinite(x) ? x : null; }
function average(a){ const v=a.filter(Number.isFinite); return v.length ? v.reduce((s,x)=>s+x,0)/v.length : null; }
function fmt(v,d=2){ return v===null || !Number.isFinite(v) ? "—" : v.toFixed(d); }
function validRow(r){ return fields.every(k => r[k] !== undefined && r[k] !== null && r[k] !== "") && Number(r.cgpa)>=0 && Number(r.cgpa)<=10; }

async function loadResponses(){
  if(db){
    try {
      const {data,error}=await db.from("study_habits").select("study_hours,attendance,revision,study_days,study_method,sleep_hours,practice,phone_distraction,entertainment_hours,cgpa,created_at").order("created_at",{ascending:false}).limit(1000);
      if(error) throw error;
      responses=(data||[]).filter(validRow);
    } catch(e){ responses=readLocal(); message.textContent="Supabase unavailable; showing this browser's local data."; }
  } else responses=readLocal();
  render();
}
form.addEventListener("submit", async e=>{
  e.preventDefault();
  const fd=new FormData(form), r={};
  for(const k of fields){ const raw=fd.get(k); r[k]=["study_method"].includes(k)?String(raw):Number(raw); }
  r.student_code=String(fd.get("student_code")||"").trim();
  r.created_at=new Date().toISOString();
  if(!validRow(r)){message.textContent="Please check the values and submit again.";return;}
  if(db){
    const {error}=await db.from("study_habits").insert([{...r,student_code:r.student_code||null}]);
    if(error){message.textContent="Could not save to Supabase. Check table setup and RLS policies.";return;}
    message.textContent="Response saved to Supabase.";
  } else { responses.unshift(r); saveLocal(); message.textContent="Response saved in this browser."; }
  form.reset();
  await loadResponses();
});
document.querySelector("#clearBtn").addEventListener("click",()=>{
  if(db){message.textContent="Remote data is not deleted here. Delete records securely in Supabase if needed.";return;}
  if(confirm("Delete all locally saved responses from this browser?")){responses=[];saveLocal();render();message.textContent="Local data cleared.";}
});
document.querySelector("#exportBtn").addEventListener("click",()=>{
  if(!responses.length){message.textContent="No data to export yet.";return;}
  const cols=["study_hours","attendance","revision","study_days","study_method","sleep_hours","practice","phone_distraction","entertainment_hours","cgpa","created_at"];
  const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[cols.join(","),...responses.map(r=>cols.map(c=>quote(r[c])).join(","))].join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));a.download="study-habits-data.csv";a.click();URL.revokeObjectURL(a.href);
});
document.querySelector("#demoBtn").addEventListener("click",()=>{
  if(db){message.textContent="Demo data is disabled when Supabase is configured.";return;}
  const methods=["Practice questions","Reading notes","Mixed methods","Videos / online lessons","Teaching others","Practice questions","Group study","Mixed methods","Reading notes","Practice questions","Teaching others","Videos / online lessons"];
  responses=methods.map((m,i)=>({study_hours:[1,2,3,4,2.5,5,1.5,3.5,2,4.5,6,3][i],attendance:[70,80,90,88,75,95,65,92,78,91,96,84][i],revision:[2,3,4,4,3,5,2,4,3,5,5,4][i],study_days:[3,5,6,6,4,7,3,6,5,7,7,5][i],study_method:m,sleep_hours:[6,7,8,7,6.5,8,5,7.5,7,8,7.5,6.5][i],practice:[2,3,4,4,3,5,2,4,3,5,5,4][i],phone_distraction:[5,4,2,3,4,1,5,2,4,2,1,3][i],entertainment_hours:[5,3,2,2,4,1,6,2,4,1.5,1,3][i],cgpa:[5.8,6.7,8.4,8.1,6.5,9.2,5.4,8.7,6.8,9,9.5,7.6][i],created_at:new Date().toISOString()}));
  saveLocal();render();message.textContent="Demo dataset loaded locally. These are fictional example records.";
});
function pearson(xs,ys){
  const pairs=xs.map((x,i)=>[x,ys[i]]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
  if(pairs.length<2)return null;
  const mx=average(pairs.map(p=>p[0])),my=average(pairs.map(p=>p[1]));
  const nume=pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0);
  const dx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),dy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);
  return dx===0||dy===0?null:nume/Math.sqrt(dx*dy);
}
function regression(xs,ys){
  const mx=average(xs),my=average(ys);
  if(mx===null||my===null)return null;
  const den=xs.reduce((s,x)=>s+(x-mx)**2,0);
  if(den===0)return null;
  const slope=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/den;
  return {slope,intercept:my-slope*mx};
}
function drawScatter(canvas, rows){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,p={l:48,r:20,t:20,b:42};
  ctx.clearRect(0,0,w,h);ctx.font="13px sans-serif";ctx.strokeStyle="#dfe6dd";ctx.fillStyle="#65736d";
  for(let i=0;i<=5;i++){const y=h-p.b-i*(h-p.t-p.b)/5;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText((i*2).toString(),12,y+4);}
  for(let i=0;i<=6;i++){const x=p.l+i*(w-p.l-p.r)/6;ctx.fillText((i*1).toString(),x-4,h-18);}
  ctx.fillText("Study hours per day",w/2-55,h-3);ctx.save();ctx.translate(14,h/2+25);ctx.rotate(-Math.PI/2);ctx.fillText("CGPA",0,0);ctx.restore();
  rows.forEach(r=>{const x=p.l+Math.max(0,Math.min(6,Number(r.study_hours)))/6*(w-p.l-p.r);const y=h-p.b-Math.max(0,Math.min(10,Number(r.cgpa)))/10*(h-p.t-p.b);ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle="#146b50";ctx.fill();});
}
function drawBars(canvas, rows){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,p={l:45,r:15,t:22,b:90};ctx.clearRect(0,0,w,h);
  const groups={};rows.forEach(r=>{const k=r.study_method||"Unknown";(groups[k] ||= []).push(Number(r.cgpa));});
  const entries=Object.entries(groups).map(([k,v])=>[k,average(v)]).filter(x=>x[1]!==null).slice(0,8);
  ctx.font="12px sans-serif";ctx.strokeStyle="#dfe6dd";ctx.fillStyle="#65736d";
  for(let i=0;i<=5;i++){const y=h-p.b-i*(h-p.t-p.b)/5;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText((i*2).toString(),12,y+4);}
  if(!entries.length){ctx.fillText("Submit responses to see group averages.",p.l+10,h/2);return;}
  const bw=(w-p.l-p.r)/entries.length*.55,slot=(w-p.l-p.r)/entries.length;
  entries.forEach(([name,val],i)=>{const x=p.l+i*slot+(slot-bw)/2,barH=val/10*(h-p.t-p.b),y=h-p.b-barH;ctx.fillStyle="#146b50";ctx.fillRect(x,y,bw,barH);ctx.fillStyle="#17251f";ctx.fillText(val.toFixed(1),x,y-6);ctx.save();ctx.translate(x+bw/2,h-p.b+10);ctx.rotate(-.55);ctx.textAlign="right";ctx.fillText(name.length>19?name.slice(0,17)+"…":name,0,0);ctx.restore();});
}
function render(){
  const rows=responses.filter(validRow),cgpas=rows.map(r=>Number(r.cgpa)),hours=rows.map(r=>Number(r.study_hours));
  document.querySelector("#countMetric").textContent=rows.length;
  document.querySelector("#meanMetric").textContent=fmt(average(cgpas));
  document.querySelector("#studyMetric").textContent=fmt(average(hours));
  const m=average(cgpas),sd=m===null?null:Math.sqrt(average(cgpas.map(x=>(x-m)**2)));
  document.querySelector("#sdMetric").textContent=fmt(sd);
  const corr=pearson(hours,cgpas),reg=regression(hours,cgpas);
  document.querySelector("#correlationText").textContent=corr===null?"Correlation requires at least two responses with varying values.":`Pearson r = ${corr.toFixed(3)}. ${Math.abs(corr)<.2?"Very weak":Math.abs(corr)<.4?"Weak":Math.abs(corr)<.7?"Moderate":"Strong"} ${corr>0?"positive":"negative"} linear association in this sample.`;
  document.querySelector("#regressionText").textContent=reg===null?"Regression needs at least two responses with different study-hour values.":`Fitted line: predicted CGPA = ${reg.intercept.toFixed(3)} ${reg.slope>=0?"+":"−"} ${Math.abs(reg.slope).toFixed(3)} × study hours. This is a sample-based estimate, not a guarantee.`;
  const body=document.querySelector("#dataRows");
  body.innerHTML=rows.length?rows.slice(0,20).map(r=>`<tr><td>${Number(r.study_hours).toFixed(1)}</td><td>${Number(r.attendance)}%</td><td>${r.revision}/5</td><td>${escapeHtml(r.study_method)}</td><td>${Number(r.sleep_hours).toFixed(1)}</td><td>${Number(r.cgpa).toFixed(2)}</td></tr>`).join(""):'<tr><td colspan="6">No responses yet. Submit the survey above or load demo data.</td></tr>';
  drawScatter(document.querySelector("#scatterChart"),rows);drawBars(document.querySelector("#methodChart"),rows);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
loadResponses();
