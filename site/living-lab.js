
import {PROTOCOLS,SOLIDS,simulate,makeNotebookEntry,makeNotebookExport} from "./experiment-models.mjs";
const $=id=>document.getElementById(id);
const make=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;};
const NS="http://www.w3.org/2000/svg";
const svg=(tag,attrs)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
let active=PROTOCOLS[0],lastRun=null,committedPrediction="",runs=[],sourceMap=new Map();
const controls={lengthMeters:1,mode:2,solid:"cube",seed:369};
function config(){if(active.id==="standing-waves")return{lengthMeters:controls.lengthMeters,mode:controls.mode};
 if(active.id==="platonic-solids")return{solid:controls.solid};
 return{seed:controls.seed};
}
function clearResult(){
 lastRun=null;committedPrediction="";$("living-interpretation").hidden=true;
 $("living-outcome-body").replaceChildren(make("h3","Run a new model","living-h3"),
  make("p","Record a prediction first; then the calculated or simulated result will appear here."));
 $("living-run-status").textContent="";$("living-capture-status").textContent="";
 $("living-observation").value="";$("living-alternative").value="";
}
function inputNumber(label,key,min,max,step){
 const row=make("label",label),field=make("input");
 field.type="number";field.min=String(min);field.max=String(max);field.step=String(step);field.value=String(controls[key]);field.name=key;
 field.addEventListener("change",()=>{const value=Number(field.value);
  if(!Number.isFinite(value)||value<min||value>max||(step===1&&!Number.isInteger(value))){field.value=String(controls[key]);return;}
  controls[key]=Math.round(value/step)*step;
  controls[key]=Number(controls[key].toFixed(3));field.value=String(controls[key]);clearResult();
 });
 row.append(field);return row;
}
function renderParameters(){
 const root=$("living-parameters");root.replaceChildren();
 if(active.id==="standing-waves"){
  root.append(inputNumber("String length (meters)","lengthMeters",.5,3,.1),inputNumber("Harmonic mode (1–6)","mode",1,6,1));
 }else if(active.id==="platonic-solids"){
  const label=make("label","Choose a solid"),select=make("select");
  for(const [id,s] of Object.entries(SOLIDS)){const opt=make("option",s.name);opt.value=id;select.append(opt);}
  select.value=controls.solid;select.addEventListener("change",()=>{controls.solid=select.value;clearResult();});
  label.append(select);root.append(label);
 }else root.append(inputNumber("Reproducible seed (1–9999)","seed",1,9999,1));
}
function showSources(){
 const root=$("living-sources");root.replaceChildren(make("p","Contextual references. These do not independently validate the simulation."));
 for(const id of active.sourceIds){const source=sourceMap.get(id);if(!source)continue;
  const a=make("a",source.title+" · "+source.publisher+" ↗");a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";root.append(a);
 }
}
function selectProtocol(id){
 const p=PROTOCOLS.find(x=>x.id===id);if(!p)return;active=p;
 $("living-protocol-title").textContent=p.title;$("living-question").textContent=p.question;
 $("living-method").textContent=p.method;$("living-boundary").textContent=p.boundary;
 $("living-followup").textContent=p.nextTest;
 $("living-prediction").value="";
 document.querySelectorAll("#living-protocols button").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.protocol===id)));
 showSources();renderParameters();clearResult();
}
function renderProtocolCards(){
 const root=$("living-protocols");root.replaceChildren();
 for(const p of PROTOCOLS){
  const b=make("button");b.type="button";b.dataset.protocol=p.id;
  b.setAttribute("aria-pressed",String(active.id===p.id));
  b.append(make("small",p.lens),make("strong",p.title),make("span",p.challenge));
  b.addEventListener("click",()=>selectProtocol(p.id));root.append(b);
 }
}
function showWave(parent,run){
 const points=run.outputs.sampleWave;
 const figure=make("figure",undefined,"living-visual");
 const graph=svg("svg",{viewBox:"0 0 620 190",role:"img","aria-label":"Calculated fixed-end standing wave, with harmonic displacement over normalized string position"});
 graph.append(svg("line",{x1:20,y1:92,x2:600,y2:92,stroke:"#6a9e91","stroke-width":1.4}));
 const d=points.map((p,i)=>(i?"L":"M")+(20+p.x*580).toFixed(2)+","+(92-p.y*63).toFixed(2)).join(" ");
 graph.append(svg("path",{d,stroke:"#a3efdc",fill:"none","stroke-width":3}));
 for(let i=0;i<=run.inputs.mode;i++)graph.append(svg("circle",{cx:20+580*i/run.inputs.mode,cy:92,r:4,fill:"#edc88d"}));
 figure.append(graph,make("figcaption","Calculated mode shape, not an audio capture. Gold dots indicate fixed-string nodes."));parent.append(figure);
}
function showFlips(parent,run){
 const fig=make("figure",undefined,"living-visual");const grid=make("div",undefined,"living-flip-sequence");
 for(const flip of run.outputs.flips)grid.append(make("span",flip,flip==="T"?"tails":""));
 fig.append(grid,make("figcaption","40 deterministically generated pseudorandom symbols; H = heads, T = tails. No hardware random sample was collected."));
 parent.append(fig);
}
function showResult(run){
 const root=$("living-outcome-body");root.replaceChildren(make("h3",active.title+" · Result"));
 const tag=make("p",run.kind.replaceAll("-"," ").toUpperCase(),"living-kind");root.append(tag);
 root.append(make("p",run.summary));
 const dl=make("dl",undefined,"living-results-dl");
 let values=[];
 if(run.protocolId==="standing-waves")values=[
  ["Fundamental assumptions","Ideal fixed string, v = 120 m/s"],
  ["Predicted frequency",String(run.outputs.frequencyHz)+" Hz"],
  ["Wavelength",String(run.outputs.wavelengthMeters)+" m"],
  ["Nodes",run.outputs.nodePositionsMeters.join(", ")+" m"],
  ["Antinodes",run.outputs.antinodePositionsMeters.join(", ")+" m"]];
 if(run.protocolId==="platonic-solids")values=[
  ["Faces",String(run.outputs.faces)],["Edges",String(run.outputs.edges)],["Vertices",String(run.outputs.vertices)],
  ["Euler V − E + F",String(run.outputs.eulerCharacteristic)],["Regular faces",run.outputs.faceKind]];
 if(run.protocolId==="chance-null-model")values=[
  ["Heads",String(run.outputs.heads)],["Tails",String(run.outputs.tails)],
  ["Two-sided binomial tail",run.outputs.pTwoSided.toFixed(6)],
  ["Model","40 fair tosses, deterministic seeded PRNG"]];
 for(const [k,v] of values){dl.append(make("dt",k),make("dd",v));}
 root.append(dl);
 if(run.protocolId==="standing-waves")showWave(root,run);
 if(run.protocolId==="chance-null-model")showFlips(root,run);
 root.append(make("p",run.limitation,"living-limit"));
 $("living-interpretation").hidden=false;
}
function runModel(){
 const prediction=$("living-prediction").value.trim();
 if(prediction.length<8){$("living-run-status").textContent="Write a prediction of at least 8 characters before running the model.";return;}
 try{
  const run=simulate(active.id,config());committedPrediction=prediction;lastRun=run;
  $("living-run-status").textContent="Model executed locally. Prediction captured for this run.";
  $("living-observation").value="";$("living-alternative").value="";$("living-capture-status").textContent="";
  showResult(run);
 }catch(e){$("living-run-status").textContent="Cannot run model: "+String(e.message).slice(0,150);}
}
function updateJournal(){
 const root=$("living-records");root.replaceChildren();
 if(!runs.length)root.append(make("p","No learning records captured."));
 runs.forEach((record,i)=>{
  const row=make("div",undefined,"living-record"),content=make("div");
  content.append(make("strong",PROTOCOLS.find(p=>p.id===record.protocolId)?.title||record.protocolId),
    make("small",new Date(record.createdAt).toLocaleString()+" · "+record.result.summary));
  const remove=make("button","Remove");remove.type="button";remove.addEventListener("click",()=>{runs.splice(i,1);updateJournal();});
  row.append(content,remove);root.append(row);
 });
 $("living-export").disabled=runs.length===0;$("living-clear").disabled=runs.length===0;
}
function captureRun(){
 if(!lastRun){$("living-capture-status").textContent="Run a model first.";return;}
 if(runs.length>=12){$("living-capture-status").textContent="Journal limit: 12 records. Export or remove an earlier record.";return;}
 try{
  const record=makeNotebookEntry({run:lastRun,prediction:committedPrediction,observation:$("living-observation").value,
    alternative:$("living-alternative").value,createdAt:new Date().toISOString()});
  runs.push(record);updateJournal();
  $("living-capture-status").textContent="Captured this educational result with your prediction, observation and alternative.";
 }catch(e){$("living-capture-status").textContent="Provide an observation and a limitation (both required). "+String(e.message).slice(0,120);}
}
function exportNotebook(){
 if(!runs.length)return;
 const packet=makeNotebookExport(runs,new Date().toISOString());
 const blob=new Blob([JSON.stringify(packet,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),link=make("a");
 link.href=url;link.download="369hlj-educational-research-notebook.json";document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
 $("living-export-status").textContent="Notebook exported locally. Nothing was uploaded.";
}
async function init(){
 const response=await fetch("./data/research.json");if(!response.ok)throw Error("Could not load source registry");
 const registry=await response.json();registry.sources.forEach(s=>sourceMap.set(s.id,s));
 renderProtocolCards();selectProtocol("standing-waves");
 $("living-run").addEventListener("click",runModel);
 $("living-capture").addEventListener("click",captureRun);
 $("living-export").addEventListener("click",exportNotebook);
 $("living-clear").addEventListener("click",()=>{runs=[];updateJournal();$("living-export-status").textContent="Session journal cleared.";});
}
init().catch(e=>{$("living-run-status").textContent="Living Laboratory unavailable: "+String(e.message||e);$("living-run").disabled=true;});
