
import {MAX_BYTES,normalizeLabReceipt} from "./lab-contracts.mjs";
const $=id=>document.getElementById(id);
const text=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e;};
let preview=null,records=[],token=0;
const fileInput=$("bridge-file"),message=$("bridge-message"),previewEl=$("bridge-preview"),confirm=$("bridge-confirm"),approve=$("bridge-approve"),topicSelect=$("bridge-topic");
function showMessage(value){message.textContent=value;}
function resetPreview(){preview=null;previewEl.hidden=true;confirm.checked=false;approve.disabled=true;$("bridge-fields").replaceChildren();topicSelect.value="";}
function fillRow(root,label,value){const dt=text("dt",label),dd=text("dd",value);root.append(dt,dd);}
async function digest(buffer){
  if(!globalThis.crypto?.subtle)return null;
  const array=await globalThis.crypto.subtle.digest("SHA-256",buffer);
  return Array.from(new Uint8Array(array),byte=>byte.toString(16).padStart(2,"0")).join("");
}
function formatFilename(value){return typeof value==="string"?value.slice(0,90).replace(/[\u0000-\u001f\u007f]/g," "):"unknown.json";}
async function inspectFile(){
  const mine=++token;resetPreview();
  const file=fileInput.files?.[0];if(!file){showMessage("No file selected.");return;}
  if(file.size>MAX_BYTES){showMessage("Rejected: file exceeds 512 KiB limit.");return;}
  if(file.size<2){showMessage("Rejected: empty or too-small file.");return;}
  showMessage("Inspecting local file...");
  try{
    const buffer=await file.arrayBuffer();
    if(mine!==token)return;
    const decoded=new TextDecoder("utf-8",{fatal:true}).decode(buffer);
    const data=JSON.parse(decoded);
    const normalized=normalizeLabReceipt(data);
    const sha256=await digest(buffer);
    if(mine!==token)return;
    preview={...normalized,fileName:formatFilename(file.name),sha256};
    const root=$("bridge-fields");
    fillRow(root,"Source application",normalized.lab);
    fillRow(root,"Recognized format",normalized.format);
    fillRow(root,"Version",normalized.version);
    fillRow(root,"Classification",normalized.classification+" (source-declared)");
    fillRow(root,"Description",normalized.description);
    fillRow(root,"Claim in original export",normalized.sourceClaim);
    for(const field of normalized.fields)fillRow(root,field.label,field.value);
    fillRow(root,"Byte fingerprint",sha256?"SHA-256 "+sha256:"Not available in this browser");
    $("bridge-boundary").textContent=normalized.boundary;
    previewEl.hidden=false;
    showMessage("Recognized file. Review the displayed limits before explicitly adding its summary.");
  }catch(err){showMessage("Rejected: "+String(err?.message||"Invalid file").slice(0,180));}
}
function updateActions(){$("bridge-export").disabled=records.length===0;$("bridge-clear").disabled=records.length===0;}
function renderRecords(){
  const root=$("bridge-records");root.replaceChildren();
  if(!records.length){root.append(text("p","No reviewed records in this session."));updateActions();return;}
  records.forEach((item,index)=>{
    const row=text("article",undefined,"bridge-record"),info=text("div");
    info.append(text("strong",item.lab+" · "+item.format),text("small",(item.topicId||"no topic association")+" · "+item.fileName));
    const remove=text("button","Remove");remove.type="button";remove.addEventListener("click",()=>{records.splice(index,1);renderRecords();});
    row.append(info,remove);root.append(row);
  });updateActions();
}
function addRecord(){
  if(!preview||!confirm.checked)return;
  const key=preview.sha256||preview.lab+":"+preview.fileName;
  if(records.some(r=>r._key===key)){showMessage("That local receipt was already reviewed in this session.");return;}
  const topicId=topicSelect.value;
  if(topicId && !Array.from(topicSelect.options).some(o=>o.value===topicId)){showMessage("Invalid topic association.");return;}
  if(records.length>=12){showMessage("Session limit reached (12 records). Export or remove an earlier record.");return;}
  const {lab,format,classification,description,sourceClaim,boundary,fields,version,validation,fileName,sha256}=preview;
  const item={_key:key,lab,format,classification,description,sourceClaim,boundary,fields,version,validation,fileName,sha256,
    topicId:topicId||null,reviewedAt:new Date().toISOString(),
    reviewNote:"User explicitly reviewed the producer-declared interface receipt. No independent verification or source authentication."};
  records.push(item);renderRecords();resetPreview();fileInput.value="";
  showMessage("Reviewed summary added to tab session; source file is not retained. Export it when ready.");
}
function exportRecords(){
  if(!records.length)return;
  const items=records.map(({_key,...item})=>item);
  const packet={schema:"369.hlj.lab_bridge.reviewed_packet.v1",createdAt:new Date().toISOString(),
    evidenceStatus:"Unverified, producer-declared application snapshots only",
    privacy:"Generated locally; no file upload or automatic storage by this application.",
    records:items};
  const url=URL.createObjectURL(new Blob([JSON.stringify(packet,null,2)],{type:"application/json"}));
  const a=text("a");a.href=url;a.download="369hlj-reviewed-lab-packet.json";document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  $("bridge-export-message").textContent="Local JSON packet generated.";
}
async function init(){
  const res=await fetch("./data/topics.json");
  if(!res.ok)throw Error("Topic registry unavailable");
  const catalogue=await res.json();
  for(const topic of catalogue.topics){
    const option=text("option",topic.title);option.value=topic.id;topicSelect.append(option);
  }
  fileInput.addEventListener("change",inspectFile);
  confirm.addEventListener("change",()=>{approve.disabled=!preview||!confirm.checked;});
  approve.addEventListener("click",addRecord);
  $("bridge-export").addEventListener("click",exportRecords);
  $("bridge-clear").addEventListener("click",()=>{records=[];renderRecords();$("bridge-export-message").textContent="Session records cleared.";});
}
init().catch(err=>{showMessage("Lab Bridge could not initialize: "+String(err.message||err));fileInput.disabled=true;});
