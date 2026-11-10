
"use strict";
const $=id=>document.getElementById(id);
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
const get=async path=>{const r=await fetch(path);if(!r.ok)throw Error("Unable to load "+path);return r.json();};
let audit=null,registry=null,changes=null,selected=null,sourceMap=new Map();
function filterSource(){
 const state=$("source-audit-filter").value;
 const matching=audit.records.filter(r=>state==="all"||r.reviewState===state);
 $("source-audit-visible").textContent=matching.length+" / "+audit.records.length;
 const root=$("source-audit-cards");root.replaceChildren();
 for(const entry of matching){
  const source=sourceMap.get(entry.sourceId);const wrap=el("div");wrap.setAttribute("role","listitem");
  const b=el("button");b.type="button";b.dataset.source=entry.sourceId;
  b.setAttribute("aria-pressed",String(selected===entry.sourceId));
  b.append(el("small",entry.reviewState.replaceAll("-"," ")+" · "+source.publisher),el("strong",source.title));
  b.addEventListener("click",()=>showSource(entry.sourceId));
  wrap.append(b);root.append(wrap);
 }
}
function detail(root,label,value){root.append(el("dt",label),el("dd",value));}
function showSource(id){
 const r=audit.records.find(x=>x.sourceId===id),s=sourceMap.get(id);if(!r||!s)return;
 selected=id;$("source-audit-title").textContent=s.title;
 $("source-audit-observation").textContent=r.observation;
 const facts=$("source-audit-facts");facts.replaceChildren();
 detail(facts,"Review status",r.reviewState.replaceAll("-"," "));
 detail(facts,"Last page-content observation",r.observedOn||"Not checked in this milestone");
 detail(facts,"Inspection scope",r.method);
 detail(facts,"Retraction/correction registry check","NOT PERFORMED");
 detail(facts,"Scientific evidence validation","NOT INDEPENDENTLY VERIFIED");
 const link=$("source-audit-open");link.href=s.url;link.textContent="Open publisher/catalogued source ↗";
 filterSource();
}
function renderCorrections(){
 const root=$("source-audit-corrections");root.replaceChildren();
 for(const fix of changes.entries){
  const row=el("article",undefined,"source-correction-row");
  row.append(el("strong",sourceMap.get(fix.sourceId)?.publisher+" · "+fix.field),
    el("p","Before: "+fix.previousValue),el("p","After: "+fix.newValue),
    el("p",fix.reason));
  const link=el("a","Inspect citation metadata ↗");link.href=fix.evidenceUrl;
  link.target="_blank";link.rel="noopener noreferrer";row.append(link);root.append(row);
 }
}
async function init(){
 [audit,registry,changes]=await Promise.all([get("./data/source-audit.json"),get("./data/research.json"),get("./data/source-corrections.json")]);
 registry.sources.forEach(s=>sourceMap.set(s.id,s));
 if(audit.records.length!==registry.sources.length||changes.entries.length!==5)throw Error("Audit dataset out of sync");
 if(audit.records.some(r=>!sourceMap.has(r.sourceId)||r.retractionCheck!=="not-checked"||r.claimEvidenceCheck!=="not-independently-verified"))throw Error("Invalid review state");
 $("source-audit-reviewed").textContent=String(audit.records.filter(r=>r.reviewState!=="not-checked").length);
 $("source-audit-pending").textContent=String(audit.records.filter(r=>r.reviewState==="not-checked").length);
 $("source-audit-fixes").textContent=String(changes.entries.length);
 $("source-audit-filter").addEventListener("change",filterSource);
 renderCorrections();showSource(audit.records[0].sourceId);$("source-audit-root").dataset.ready="true";
}
init().catch(e=>{$("source-audit-visible").textContent="Unavailable";$("source-audit-observation").textContent="Bibliography audit could not initialize: "+String(e.message||e);});
