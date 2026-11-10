import {inspectWorkbenchInput,createWorkbenchExport,MAX_FILE_BYTES,MAX_ENTRIES} from "./research-workbench.mjs";
import {createResearchProject,inspectResearchProject,MAX_PROJECTS,MAX_PROJECT_FILE_BYTES} from "./research-project.mjs";
const $=id=>document.getElementById(id);
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
const get=async name=>{const r=await fetch("./data/"+name+".json");if(!r.ok)throw Error("Missing public registry "+name);return r.json();};
let ctx=null,preview=null,collection=[],counter=0;
let projects=[],pendingProject=null,projectReadCounter=0;
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
 renderProjectChoices();
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

function renderProjectChoices(){
 const root=$("project-packet-choices");
 if(!root)return;
 const selected=new Set([...root.querySelectorAll('input[type="checkbox"]:checked')]
  .map(input=>input.dataset.signature));
 root.replaceChildren();
 if(!collection.length){root.append(el("p","Import and approve a research packet above first."));return;}
 collection.forEach((item,i)=>{
  const label=el("label"),checkbox=el("input");
  checkbox.type="checkbox";checkbox.name="project-packet";
  checkbox.value=String(i);checkbox.dataset.signature=packetFingerprint(item.packet);
  checkbox.checked=selected.has(checkbox.dataset.signature);
  label.append(checkbox,el("span",item.title+" · "+item.recordCount+" record(s)"));
  root.append(label);
 });
}
function renderProjectRecord(record){
 const box=el("details",undefined,"project-review-detail");
 box.append(el("summary",record.heading));
 const dl=el("dl");
 for(const pair of record.lines){
  dl.append(el("dt",pair.name),el("dd",pair.value));
 }
 box.append(dl);return box;
}
function renderProjectContents(entries,root){
 root.replaceChildren();
 for(const item of entries){
  const card=el("div",undefined,"workbench-packet-preview");
  card.append(el("strong",item.title),
   el("small",item.kind.replaceAll("-"," ")+" · "+item.recordCount+" record(s)"),
   el("p",item.limits));
  for(const row of item.rows)card.append(renderProjectRecord(row));
  card.append(renderTopicLinks(item));
  root.append(card);
 }
}
function setProjectImportPreview(inspection){
 const project=inspection.file;
 $("project-preview-title").textContent=project.focus.title;
 $("project-preview-question").textContent="Question: "+project.focus.question;
 $("project-preview-hypothesis").textContent="Working hypothesis: "+project.focus.hypothesis;
 $("project-preview-limitations").textContent="Known limitations: "+project.focus.limitations;
 renderProjectContents(inspection.reviewed,$("project-preview-records"));
 $("project-import-preview").hidden=false;
 $("project-import-confirm").checked=false;
 $("project-import-accept").disabled=true;
}
function resetProjectImport(){
 pendingProject=null;
 $("project-import-preview").hidden=true;
 $("project-import-confirm").checked=false;
 $("project-import-accept").disabled=true;
 $("project-preview-records").replaceChildren();
}
function sameProject(a,b){
 return JSON.stringify(a.file)===JSON.stringify(b.file);
}
function addProject(inspection){
 if(projects.length>=MAX_PROJECTS)throw Error("Maximum of "+MAX_PROJECTS+" projects per tab. Export or remove one first.");
 if(projects.some(x=>sameProject(x,inspection)))throw Error("An identical project already exists in this session.");
 projects.push(inspection);renderProjectLibrary();
}
function downloadProject(project){
 const bytes=JSON.stringify(project.file,null,2);
 const blob=new Blob([bytes],{type:"application/json"});
 const url=URL.createObjectURL(blob),link=el("a");
 const name=project.file.focus.title.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").slice(0,45)||"research";
 link.href=url;link.download="hlj-project-"+name+".json";
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
 $("project-library-status").textContent="Exported project locally. It includes the personal notes inside attached packets.";
}
function renderProjectLibrary(){
 const root=$("project-list");root.replaceChildren();
 if(!projects.length)root.append(el("p","No projects created or imported in this tab."));
 projects.forEach((project,index)=>{
  const card=el("article",undefined,"project-card"),focus=project.file.focus;
  card.append(el("h5",focus.title),
    el("p","Question: "+focus.question),
    el("p","Working hypothesis: "+focus.hypothesis),
    el("p","Known limitations: "+focus.limitations),
    el("small",project.reviewed.length+" approved packet(s) · "+project.recordCount+" reviewed record(s)"));
  const content=el("details",undefined,"project-review-detail");
  content.append(el("summary","Inspect all included notes and packet details"));
  const inner=el("div");renderProjectContents(project.reviewed,inner);
  content.append(inner);card.append(content);
  const actions=el("div",undefined,"project-card-actions");
  const exportButton=el("button","Export project JSON");exportButton.type="button";
  exportButton.addEventListener("click",()=>downloadProject(project));
  const removeButton=el("button","Remove project","project-remove");removeButton.type="button";
  removeButton.addEventListener("click",()=>{projects.splice(index,1);renderProjectLibrary();});
  actions.append(exportButton,removeButton);card.append(actions);
  root.append(card);
 });
 $("project-count").textContent=projects.length+" / "+MAX_PROJECTS;
 $("project-clear").disabled=projects.length===0;
}
function createProject(event){
 event.preventDefault();
 const checkboxes=[...$("project-packet-choices").querySelectorAll("input:checked")];
 if(!checkboxes.length){
  $("project-create-status").textContent="Select at least one approved packet before creating a project.";return;
 }
 try{
  const entries=checkboxes.map(b=>collection[Number(b.value)]);
  if(entries.some(x=>!x))throw Error("Selected packet was removed; choose again.");
  const now=new Date().toISOString();
  const result=createResearchProject({
   focus:{
    title:$("project-title").value,question:$("project-question").value,
    hypothesis:$("project-hypothesis").value,limitations:$("project-limitations").value
   },entries,createdAt:now,updatedAt:now
  },ctx);
  const checked=inspectResearchProject(result,ctx);
  addProject(checked);
  $("project-create-form").reset();
  $("project-create-status").textContent="Created a private project from "+checked.reviewed.length+" approved packet(s). Export it before closing the tab.";
 }catch(err){$("project-create-status").textContent=String(err.message||err).slice(0,220);}
}
async function inspectProjectFile(){
 const mine=++projectReadCounter;resetProjectImport();
 const file=$("project-file").files?.[0];
 if(!file){$("project-import-status").textContent="No file selected.";return;}
 if(!file.name.toLowerCase().endsWith(".json")){
  $("project-import-status").textContent="Rejected: choose a JSON project file.";return;
 }
 if(file.size<2||file.size>MAX_PROJECT_FILE_BYTES){
  $("project-import-status").textContent="Rejected: project file must be no larger than 1 MiB.";return;
 }
 $("project-import-status").textContent="Checking project and attached packets locally...";
 try{
  const bytes=await file.arrayBuffer();
  if(mine!==projectReadCounter)return;
  const data=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  const checked=inspectResearchProject(data,ctx);
  if(mine!==projectReadCounter)return;
  pendingProject=checked;setProjectImportPreview(checked);
  $("project-import-status").textContent="Project recognized. Expand the included records, then approve explicitly.";
 }catch(err){$("project-import-status").textContent="Rejected: "+String(err.message||err).slice(0,220);}
}
function acceptProjectImport(){
 if(!pendingProject||!$("project-import-confirm").checked)return;
 try{
  addProject(pendingProject);
  resetProjectImport();$("project-file").value="";
  $("project-import-status").textContent="Reviewed project added to tab memory. No server or account was involved.";
 }catch(err){$("project-import-status").textContent=String(err.message||err).slice(0,220);}
}
function initProjects(){
 $("project-create-form").addEventListener("submit",createProject);
 $("project-file").addEventListener("change",inspectProjectFile);
 $("project-import-confirm").addEventListener("change",()=>{
  $("project-import-accept").disabled=!pendingProject||!$("project-import-confirm").checked;
 });
 $("project-import-accept").addEventListener("click",acceptProjectImport);
 $("project-clear").addEventListener("click",()=>{
  projects=[];renderProjectLibrary();
  $("project-library-status").textContent="All local project copies cleared. Exported files on your device are unaffected.";
 });
 renderProjectChoices();renderProjectLibrary();$("research-projects").dataset.ready="true";
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
 refreshCollection();initProjects();$("packet-workbench").dataset.ready="true";
}
init().catch(err=>{say("Workbench unavailable: "+String(err.message||err));$("workbench-file").disabled=true;});
