import {buildEvidenceTrail,makeTrailExport} from "./evidence-trail.mjs";
const $=id=>document.getElementById(id);
const el=(tag,value,cls)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=value;if(cls)x.className=cls;return x;};
const read=async path=>{const r=await fetch(path);if(!r.ok)throw Error("Cannot load "+path);return r.json();};
let sets=null,current=null,knownClaims=new Set();
function anchor(label,url,kind=""){
  const a=el("a",label,kind);a.href=url;return a;
}
function addSource(row){
 const card=el("article",undefined,"trail-source");
 const head=el("div",undefined,"trail-source-head");
 head.append(el("strong",row.title),el("small",row.relationship.replaceAll("-"," ")+" · "+row.publisher));
 card.append(head,el("p",row.relationshipDefinition),el("p",row.relationshipNote));
 const status=el("dl",undefined,"trail-source-details");
 for(const [k,v] of [
   ["Page-level inspection",row.audit.reviewState.replaceAll("-"," ")],
   ["Inspection date",row.audit.observedOn||"Not inspected"],
   ["Retraction/correction check","Not performed"],
   ["Scientific claim support","Not independently verified"]
 ]){status.append(el("dt",k),el("dd",v));}
 card.append(status,el("p",row.audit.observation,"trail-observation"));
 const links=el("div",undefined,"trail-source-links");
 const ext=anchor("Open original source ↗",row.url);ext.target="_blank";ext.rel="noopener noreferrer";
 const auditLink=anchor("View source audit →","?source="+encodeURIComponent(row.sourceId)+"#source-audit","trail-audit-link");
 auditLink.dataset.auditSource=row.sourceId;
 auditLink.addEventListener("click",event=>{
   event.preventDefault();
   document.dispatchEvent(new CustomEvent("hlj:source-selected",{detail:{sourceId:row.sourceId}}));
   const locationURL=new URL(window.location.href);locationURL.searchParams.set("source",row.sourceId);locationURL.hash="source-audit";
   history.replaceState(null,"",locationURL);
   $("source-audit")?.scrollIntoView({behavior:"smooth",block:"start"});
 });
 links.append(ext,auditLink);card.append(links);
 if(row.bibliographyCorrections.length){
   const list=el("div",undefined,"trail-corrections-inline");
   list.append(el("h5","Bibliography correction history"));
   for(const fix of row.bibliographyCorrections){
      list.append(el("p","Previous: "+fix.previousValue),el("p","Current: "+fix.newValue),
        el("p",fix.date+" · "+fix.reason));
   }
   card.append(list);
 }
 return card;
}
function renderTrail(id){
 if(!sets||!knownClaims.has(id))return;
 current=buildEvidenceTrail(id,sets);
 $("trail-claim-id").textContent=id;
 $("trail-topic").textContent=current.topicTitle;
 $("trail-statement").textContent=current.statement;
 $("trail-scope").textContent="Boundary: "+current.scopeLimit;
 $("trail-question").textContent="Open review question: "+current.reviewQuestion;
 $("trail-source-count").textContent=String(current.sourceCount);
 $("trail-audit-count").textContent=String(current.limitedMetadataChecks);
 $("trail-bib-count").textContent=String(current.sourceRows.reduce((n,r)=>n+r.bibliographyCorrections.length,0));
 const rows=$("trail-source-list");rows.replaceChildren(...current.sourceRows.map(addSource));
 const gaps=$("trail-gaps");gaps.replaceChildren();
 for(const message of current.openChecks)gaps.append(el("li",message));
 const claimHistory=$("trail-claim-history");claimHistory.replaceChildren();
 if(!current.claimCorrections.length)claimHistory.append(el("p","No published claim-level corrections recorded for this claim. This is not a validation of the claim."));
 else for(const fix of current.claimCorrections)claimHistory.append(el("p",fix.date+" · "+fix.change+" · "+fix.reason));
 const dossier=anchor("Read original dossier →","?dossier="+encodeURIComponent(current.topicId)+"#research");
 const link=$("trail-dossier-link");link.href=dossier.href;
 const reviewLink=$("trail-review-link");reviewLink.href="?claim="+encodeURIComponent(id)+"#verification";
 const shared=new URL(window.location.href);
 shared.searchParams.set("claim",id);shared.searchParams.delete("source");shared.hash="evidence-trail";
 const permalink=$("trail-permalink");permalink.href=shared.pathname+shared.search+shared.hash;
 $("evidence-trail").dataset.claim=id;
}
function exportTrail(){
 if(!current){$("trail-export-status").textContent="Select a claim first.";return;}
 try{
   const payload=makeTrailExport(current,new Date().toISOString());
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
   const url=URL.createObjectURL(blob),a=el("a");a.href=url;
   a.download="hlj-evidence-trail-"+current.claimId+".json";
   document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),2500);
   $("trail-export-status").textContent="Citation trail exported locally. No scientific verdict was assigned.";
 }catch(err){$("trail-export-status").textContent="Export failed: "+String(err.message||err).slice(0,120);}
}
async function init(){
 const [verification,research,audit,sourceCorrections,claimCorrections,topics]=await Promise.all([
  read("./data/verification.json"),read("./data/research.json"),
  read("./data/source-audit.json"),read("./data/source-corrections.json"),
  read("./data/corrections.json"),read("./data/topics.json")
 ]);
 sets={verification,research,audit,sourceCorrections,claimCorrections,topics};
 knownClaims=new Set(verification.claims.map(c=>c.id));
 const incoming=new URLSearchParams(location.search).get("claim");
 const initial=knownClaims.has(incoming)?incoming:verification.claims[0].id;
 renderTrail(initial);
 document.addEventListener("hlj:claim-selected",event=>{
   if(knownClaims.has(event.detail?.claimId))renderTrail(event.detail.claimId);
 });
 $("trail-export").addEventListener("click",exportTrail);
 $("evidence-trail").dataset.ready="true";
}
init().catch(err=>{
 console.error("Evidence Trail could not initialize",err);
 $("trail-export-status").textContent="Evidence Trail unavailable: "+String(err.message||err);
 $("trail-export").disabled=true;
});