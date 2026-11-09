
import {createLearningScene,serializeLearningScene} from "./institute-scene.mjs";
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let stops=[],catalog=null,research=null,current=0;
function showStation(index){
  if(!stops.length)return;
  current=index;const s=stops[index];
  $("institute-stop-title").textContent=s.number+" · "+s.name;
  $("institute-stop-description").textContent=s.description;
  $("institute-stop-question").textContent=s.question;
  $("institute-stop-kind").textContent=s.kind+" · Suggested "+s.duration+" · Conceptual visitor stop";
  $("institute-progress").textContent="Stop "+(current+1)+" of "+stops.length;
  const list=$("institute-stop-topics");list.replaceChildren();
  const byId=new Map(catalog.topics.map(x=>[x.id,x]));
  s.topicIds.forEach(id=>list.append(el("span",byId.get(id)?.title||id)));
  const action=$("institute-stop-action");action.href=s.anchor;action.textContent=s.action+" ↗";
  $("institute-previous").disabled=current===0;$("institute-next").disabled=current===stops.length-1;
  document.querySelectorAll(".institute-map-node").forEach(node=>node.setAttribute("aria-pressed",String(Number(node.dataset.index)===current)));
}
function renderStops(){
  const root=$("institute-map-stops");root.replaceChildren();
  stops.forEach((s,i)=>{
    const b=el("button",undefined,"institute-map-node");b.type="button";
    b.style.left=s.position.x+"%";b.style.top=s.position.y+"%";b.dataset.index=String(i);
    b.setAttribute("aria-pressed",String(i===0));
    b.setAttribute("aria-label","Stop "+(i+1)+": "+s.name);
    b.append(el("b",s.number),el("small",s.name));
    b.addEventListener("click",()=>showStation(i));root.append(b);
  });showStation(0);
}
function renderPlatforms(routes){
  const root=$("institute-platform-grid");root.replaceChildren();
  for(const route of routes){
    const card=el("article",undefined,"institute-platform-card");
    card.append(el("strong",route.name),el("small",route.kind),el("p",route.summary),el("p",route.status));
    for(const [label,url] of [["Open project",route.url],["Source contract",route.source]]){
      const a=el("a",label+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);
    }root.append(card);
  }
}
function exportScene(){
  const status=$("institute-export-status");
  try{
    const scene=createLearningScene(catalog,research);
    const payload=serializeLearningScene(scene);
    const blob=new Blob([payload],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=el("a");
    a.href=url;a.download="hlj-shasta-learning-scene-v1.json";
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    status.textContent="Passive scene generated locally: "+scene.nodes.length+" unverified illustration nodes. Import manually in PhiOS XR.";
  }catch(err){status.textContent="Could not export scene: "+String(err.message||err).slice(0,150);}
}
async function fetchJSON(path){const res=await fetch(path);if(!res.ok)throw Error("Could not load "+path);return res.json();}
async function init(){
 const [tour,cat,lib,gates]=await Promise.all([fetchJSON("./data/institute-stops.json"),fetchJSON("./data/topics.json"),fetchJSON("./data/research.json"),fetchJSON("./data/platform-gateways.json")]);
 if(tour.length!==6||cat.realms.length!==9||lib.dossiers.length!==10)throw Error("Unexpected institute data");
 const ids=new Set(cat.topics.map(x=>x.id));if(tour.some(s=>s.topicIds.some(t=>!ids.has(t))))throw Error("Missing linked topic");
 stops=tour;catalog=cat;research=lib;
 renderStops();renderPlatforms(gates);
 $("institute-previous").addEventListener("click",()=>showStation(Math.max(0,current-1)));
 $("institute-next").addEventListener("click",()=>showStation(Math.min(stops.length-1,current+1)));
 $("institute-export-scene").addEventListener("click",exportScene);
}
init().catch(err=>{$("institute-export-status").textContent="Institute visitor preview could not initialize: "+String(err.message||err);$("institute-export-scene").disabled=true;});
