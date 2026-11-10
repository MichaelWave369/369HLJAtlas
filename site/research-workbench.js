import {inspectWorkbenchInput,createWorkbenchExport,MAX_FILE_BYTES,MAX_ENTRIES} from "./research-workbench.mjs";
const $=id=>document.getElementById(id);
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
const get=async name=>{const r=await fetch("./data/"+name+".json");if(!r.ok)throw Error("Missing public registry "+name);return r.json();};
let ctx=null,preview=null,collection=[],counter=0;
const say=x=>{$("workbench-message").textContent=x;};
function resetPreview(){
 preview=null;$("workbench-preview").hidden=true;
 $("workbench-confirm").checked=false;$("workbench-approve").disabled=true;
 $("workbench-preview-entries").replaceChildren();
}
function packetFingerprint(packet){return JSON.stringify(packet);}
async function sha256(buffer){
 if(!globalThis.crypto?.subtle)return null;
 const bytes=await globalThis.crypto.subtle.digest("SHA-256",buffer);
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}
function renderRecord(record){
 const d=el("details",undefined,"workbench-details");
 const summary=el("summary",record.heading);
 d.append(summary);
 const list=el("dl");
 for(const line of record.lines){list.append(el("dt",line.name),el("dd",line.value));}
 d.append(list);return d;
}

function renderTopicLinks(packet){
 const wrap=el("div",undefined,"workbench-topic-links");
 wrap.append(el("span","Atlas topics: ","workbench-topic-label"));
 const seen=new Set(),byId=new Map(ctx.topics.topics.map(t=>[t.id,t]));
 for(const topicId of packet.topicIds){
  if(seen.has(topicId)||!byId.has(topicId))continue;
  seen.add(topicId);
  const topic=byId.get(topicId),link=el("a",topic.title+" ↗");
  link.href="?topic="+encodeURIComponent(topicId)+"#constellation";
  link.dataset.topic=topicId;
  link.addEventListener("click",event=>{
    event.preventDefault();
    document.dispatchEvent(new CustomEvent("hlj:topic-selected",{detail:{topicId}}));
    const url=new URL(window.location.href);
    url.searchParams.set("topic",topicId);
    url.hash="constellation";
    history.replaceState(null,"",url);
    $("constellation")?.scrollIntoView({behavior:"smooth",block:"start"});
  });
  wrap.append(link);
 }
 return wrap;
}

function renderPacket(entry){
 const div=el("div",undefined,"workbench-packet-preview");
 div.append(el("strong",entry.title),
   el("small",entry.kind.replaceAll("-"," ")+" · "+entry.recordCount+" records"),
   el("p",entry.limits));
 for(const row of entry.rows)div.append(renderRecord(row));
 div.append(renderTopicLinks(entry));
 return div;
}
async function inspect(){
 const mine=++counter;resetPreview();
 const file=$("workbench-file").files?.[0];
 if(!file){say("No file selected.");return;}
 if(!file.name.toLowerCase().endsWith(".json")){say("Rejected: select a .json export.");return;}
 if(file.size<2||file.size>MAX_FILE_BYTES){say("Rejected: file must be between 2 bytes and 256 KiB.");return;}
 say("Reading the selected file locally...");
 try{
  const bytes=await file.arrayBuffer();
  if(mine!==counter)return;
  const parsed=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  const normalized=inspectWorkbenchInput(parsed,ctx);
  const digest=await sha256(bytes);
  if(mine!==counter)return;
  preview=normalized.map(n=>({...n,fileName:file.name.slice(0,90),digest,approvedAt:null}));
  const count=normalized.reduce((s,e)=>s+e.recordCount,0);
  $("workbench-preview-title").textContent=normalized.length+" recognized packet"+(normalized.length!==1?"s":"");
  $("workbench-preview-summary").textContent=count+" item(s) in this preview. Expand each record for user-authored notes and source-declared limits.";
  const root=$("workbench-preview-entries");
  root.replaceChildren(...preview.map(renderPacket));
  $("workbench-preview").hidden=false;
  say("Format recognized and normalized locally. Review the contents and explicitly approve before adding.");
 }catch(err){say("Rejected: "+String(err?.message||"Unsupported JSON").slice(0,220));}
}
function refreshCollection(){
 const root=$("workbench-archive");root.replaceChildren();
 if(!collection.length)root.append(el("p","No reviewed packets in this session."));
 else collection.forEach((packet,index)=>{
  const row=el("article",undefined,"workbench-archived-item"),copy=el("div");
  copy.append(el("strong",packet.title),
    el("small",packet.recordCount+" record(s) · "+packet.fileName));
  const remove=el("button","Remove");remove.type="button";
  remove.addEventListener("click",()=>{collection.splice(index,1);refreshCollection();});
  row.append(copy,remove);row.append(renderTopicLinks(packet));root.append(row);
 });
 $("workbench-count").textContent=collection.length+" / "+MAX_ENTRIES;
 $("workbench-record-count").textContent=String(collection.reduce((sum,e)=>sum+e.recordCount,0));
 $("workbench-export").disabled=collection.length===0;
 $("workbench-clear").disabled=collection.length===0;
}
function approve(){
 if(!preview||!$("workbench-confirm").checked)return;
 if(collection.length+preview.length>MAX_ENTRIES){
   say("The collection holds at most "+MAX_ENTRIES+" packets. Remove some first.");return;
 }
 const seen=new Set(collection.map(e=>packetFingerprint(e.packet)));
 for(const packet of preview){
  const key=packetFingerprint(packet.packet);
  if(seen.has(key)){say("Duplicate packet detected. Nothing was added.");return;}
  seen.add(key);
 }
 const now=new Date().toISOString();
 collection.push(...preview.map(e=>({...e,approvedAt:now})));
 resetPreview();$("workbench-file").value="";
 say("Approved summaries added to this tab session. No original file was retained or uploaded.");
 refreshCollection();
}
function exportCollection(){
 if(!collection.length)return;
 try{
  const packet=createWorkbenchExport(collection,new Date().toISOString());
  const blob=new Blob([JSON.stringify(packet,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=el("a");
  a.href=url;a.download="369hlj-research-workbench.json";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  $("workbench-export-status").textContent="Local collection exported. It includes the notes shown in each imported packet.";
 }catch(err){$("workbench-export-status").textContent="Export failed: "+String(err.message||err);}
}
async function init(){
 const [topics,verification,research,audit,sourceCorrections,claimCorrections,connections]=await Promise.all([
  get("topics"),get("verification"),get("research"),get("source-audit"),get("source-corrections"),get("corrections"),get("connections")
 ]);
 ctx={topics,verification,research,audit,sourceCorrections,claimCorrections,connections};
 $("workbench-file").addEventListener("change",inspect);
 $("workbench-confirm").addEventListener("change",()=>{$("workbench-approve").disabled=!preview||!$("workbench-confirm").checked;});
 $("workbench-approve").addEventListener("click",approve);
 $("workbench-export").addEventListener("click",exportCollection);
 $("workbench-clear").addEventListener("click",()=>{collection=[];refreshCollection();$("workbench-export-status").textContent="Local collection cleared.";});
 refreshCollection();$("packet-workbench").dataset.ready="true";
}
init().catch(err=>{say("Workbench unavailable: "+String(err.message||err));$("workbench-file").disabled=true;});
