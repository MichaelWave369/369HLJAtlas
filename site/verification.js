
import {validateReviewRegistry,makeReviewProposal,createReviewPacket} from "./verification-engine.mjs";
const $=id=>document.getElementById(id);
const make=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e;};
let ledger=null,research=null,catalog=null,selectedId=null,proposals=[],categories=new Set();
let sourceMap=new Map(),topicMap=new Map(),claimMap=new Map();
const status=x=>{$("verify-capture-status").textContent=x;};
async function readJson(file){const r=await fetch(file);if(!r.ok)throw Error("Could not fetch "+file);return r.json();}
function chosen(){return claimMap.get(selectedId);}
function saveFormReset(){
 for(const id of ["verify-notes","verify-limitations","verify-correction"])$(id).value="";
 $("verify-attestation").checked=false;
 $("verify-assessment").value="needs-more-evidence";
 status("");
}
function showClaim(id){
 const c=claimMap.get(id);if(!c)return;
 selectedId=id;
 $("verify-title").textContent=topicMap.get(c.topicId).title;
 $("verify-statement").textContent=c.statement;
 $("verify-boundary").textContent="Scope boundary: "+c.scopeLimit;
 $("verify-question").textContent="Review question: "+c.reviewQuestion;
 const root=$("verify-source-list");root.replaceChildren();
 const options=$("verify-source-choice");options.replaceChildren();
 for(const link of c.sourceLinks){
  const source=sourceMap.get(link.sourceId),item=make("div",undefined,"verify-source");
  const a=make("a",source.title+" ↗");a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";
  item.append(a,make("small",link.role.replaceAll("-"," ")+" · "+source.publisher+(source.year?" · "+source.year:"")));
  item.append(make("p",link.note),make("p",ledger.sourceRoleDefinitions[link.role]));
  root.append(item);
  const option=make("option",source.publisher+" · "+source.title);option.value=source.id;options.append(option);
 }
 saveFormReset();renderQueue();
}
function renderQueue(){
 const root=$("verification-cards");root.replaceChildren();
 const needle=$("verify-search").value.trim().toLowerCase(),group=$("verify-filter").value;
 const visible=ledger.claims.filter(c=>(group==="all"||c.category===group)&&
   (!needle||(c.statement+" "+c.category+" "+topicMap.get(c.topicId).title).toLowerCase().includes(needle)));
 for(const c of visible){
  const b=make("button",undefined,"verification-card");
  b.type="button";b.dataset.claim=c.id;b.setAttribute("aria-pressed",String(c.id===selectedId));
  b.append(make("small",c.category+" · review pending"),make("strong",c.statement),make("span",c.sourceLinks.length+" catalogued source relationships"));
  b.addEventListener("click",()=>showClaim(c.id));root.append(b);
 }
 $("verify-visible").textContent=visible.length+" / "+ledger.claims.length;
 $("verify-empty").hidden=visible.length!==0;
}
function updateProposals(){
 $("verify-local").textContent=String(proposals.length);
 const root=$("verify-proposals");root.replaceChildren();
 if(!proposals.length)root.append(make("p","No proposals captured. No public claims are changed."));
 proposals.forEach((p,i)=>{
  const row=make("div",undefined,"verify-proposal"),info=make("div");
  info.append(make("strong",topicMap.get(p.topicId).title),make("small",p.assessment+" · source "+p.sourceId));
  const b=make("button","Remove");b.type="button";
  b.addEventListener("click",()=>{proposals.splice(i,1);updateProposals();});
  row.append(info,b);root.append(row);
 });
 $("verify-export").disabled=proposals.length===0;$("verify-clear").disabled=proposals.length===0;
}
function capture(){
 const c=chosen();if(!c){status("Select a claim first.");return;}
 if(proposals.length>=20){status("This session allows at most 20 proposals. Export or remove entries.");return;}
 try{
  const proposal=makeReviewProposal({claim:c,sourceId:$("verify-source-choice").value,
   assessment:$("verify-assessment").value,inspectionAcknowledged:$("verify-attestation").checked,
   reviewNotes:$("verify-notes").value,limitations:$("verify-limitations").value,
   correctionRequest:$("verify-correction").value,createdAt:new Date().toISOString()});
  proposals.push(proposal);updateProposals();
  saveFormReset();status("Captured as an unpublished local review proposal. The Atlas has not accepted a scientific verdict.");
 }catch(err){status("Not captured: "+String(err.message||err).slice(0,140)+". Check the source acknowledgement and both required notes.");}
}
function exportPacket(){
 if(!proposals.length)return;
 try{
  const packet=createReviewPacket(proposals,new Date().toISOString());
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:"application/json"}));
  const a=make("a");a.href=url;a.download="369hlj-unpublished-review-proposals.json";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  $("verify-export-status").textContent="Unpublished proposals exported locally. No public records changed.";
 }catch(err){$("verify-export-status").textContent="Could not export: "+String(err.message||err);}
}
function renderCorrections(corrections){
 const root=$("verify-correction-history");
 if(!corrections.entries.length){root.textContent=corrections.notice;return;}
 root.replaceChildren();
 for(const e of corrections.entries){
  const row=make("p",(e.date||"undated")+" · "+e.claimId+" · "+e.change+" · "+e.reason);
  root.append(row);
 }
}
async function init(){
 const [claims,refs,topics,corrections]=await Promise.all([
  readJson("./data/verification.json"),readJson("./data/research.json"),
  readJson("./data/topics.json"),readJson("./data/corrections.json")
 ]);
 validateReviewRegistry(claims,topics,refs,corrections);
 ledger=claims;research=refs;catalog=topics;
 refs.sources.forEach(s=>sourceMap.set(s.id,s));topics.topics.forEach(t=>topicMap.set(t.id,t));
 claims.claims.forEach(c=>{claimMap.set(c.id,c);categories.add(c.category);});
 $("verify-total").textContent=String(claims.claims.length);
 $("verify-sources").textContent=String(refs.sources.length);
 const filter=$("verify-filter");
 [...categories].sort().forEach(c=>{const o=make("option",c);o.value=c;filter.append(o);});
 $("verify-search").addEventListener("input",renderQueue);
 $("verify-filter").addEventListener("change",renderQueue);
 $("verify-capture").addEventListener("click",capture);
 $("verify-export").addEventListener("click",exportPacket);
 $("verify-clear").addEventListener("click",()=>{proposals=[];updateProposals();$("verify-export-status").textContent="Local review proposals cleared.";});
 renderCorrections(corrections);updateProposals();
 const incoming=new URLSearchParams(location.search).get("claim");
 showClaim(claimMap.has(incoming)?incoming:claims.claims[0].id);
 $("verification-root").dataset.ready="true";
}
init().catch(err=>{console.error("Verification desk failed",err);$("verify-visible").textContent="Unavailable";status("Could not load the verification index: "+String(err.message||err));});
