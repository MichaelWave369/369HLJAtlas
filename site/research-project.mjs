/**
 * HLJ-013 — Portable Research Project Workspace.
 * Projects are local, explicit collections of already reviewed packet formats.
 * They carry user-authored questions, NOT scientific publication authority.
 */
import {inspectWorkbenchInput,WORKBENCH_SCHEMA,MAX_ENTRIES} from "./research-workbench.mjs";

export const PROJECT_SCHEMA="369.hlj.research-project.v1";
export const MAX_PROJECTS=3;
export const MAX_PROJECT_FILE_BYTES=1024*1024;
const isRecord=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const fail=msg=>{throw new TypeError("Invalid research project: "+msg);};
const exactly=(v,keys)=>isRecord(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function writing(value,max,min,name){
 if(typeof value!=="string"||value.length>max||value.trim().length<min||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))
  fail(name+" must contain "+min+" to "+max+" characters");
 return value.trim();
}
function date(value){
 if(typeof value!=="string"||value.length>40||Number.isNaN(Date.parse(value)))fail("invalid timestamp");
 return value;
}
function validateFocus(focus){
 if(!exactly(focus,["title","question","hypothesis","limitations"]))fail("unknown focus metadata");
 return {
  title:writing(focus.title,90,3,"title"),
  question:writing(focus.question,500,20,"research question"),
  hypothesis:writing(focus.hypothesis,500,15,"working hypothesis"),
  limitations:writing(focus.limitations,750,20,"scope limits")
 };
}
const signature=v=>JSON.stringify(v);
function enforceBytes(value){
 if(new TextEncoder().encode(JSON.stringify(value)).length>MAX_PROJECT_FILE_BYTES)
  throw new RangeError("Research project exceeds 1 MiB; choose fewer approved packets");
}
function recomputeEntries(items,ctx){
 if(!Array.isArray(items)||items.length<1||items.length>MAX_ENTRIES)
  fail("project requires one to eight included research packets");
 const checked=inspectWorkbenchInput({schema:WORKBENCH_SCHEMA,entries:items},ctx);
 for(let i=0;i<items.length;i++){
  const item=items[i],check=checked[i];
  if(!exactly(item,["kind","packet"])||item.kind!==check.kind||signature(item.packet)!==signature(check.packet))
   fail("unreviewed, changed, outdated or extraneous packet fields");
 }
 return checked;
}
export function createResearchProject({focus,entries,createdAt,updatedAt},ctx){
 const fields=validateFocus(focus),created=date(createdAt),updated=date(updatedAt);
 if(Date.parse(updated)<Date.parse(created))fail("update date predates project creation");
 const items=entries.map(e=>({kind:e.kind,packet:e.packet}));
 const normalized=recomputeEntries(items,ctx);
 const result={
  schema:PROJECT_SCHEMA,createdAt:created,updatedAt:updated,focus:fields,
  evidenceBoundary:"Private organizational workspace; not scientific validation, peer review, source authentication or public claim publication.",
  privacy:"Contains explicitly selected imported user notes and source descriptions. No automatic upload or persistence.",
  entries:normalized.map(e=>({kind:e.kind,packet:e.packet}))
 };
 enforceBytes(result);
 return result;
}
export function inspectResearchProject(input,ctx){
 if(!exactly(input,["schema","createdAt","updatedAt","focus","evidenceBoundary","privacy","entries"])||
    input.schema!==PROJECT_SCHEMA)fail("unknown project schema or root fields");
 if(typeof input.evidenceBoundary!=="string"||
    !input.evidenceBoundary.startsWith("Private organizational workspace; not scientific validation")||
    typeof input.privacy!=="string"||!input.privacy.includes("No automatic upload"))
  fail("missing claim and privacy boundaries");
 enforceBytes(input);
 const rebuilt=createResearchProject({
  focus:input.focus,entries:input.entries,createdAt:input.createdAt,updatedAt:input.updatedAt
 },ctx);
 const included=recomputeEntries(rebuilt.entries,ctx);
 return {
  file:rebuilt,
  reviewed:included,
  topicIds:[...new Set(included.flatMap(x=>x.topicIds))],
  sourceIds:[...new Set(included.flatMap(x=>x.sourceIds))],
  recordCount:included.reduce((n,x)=>n+x.recordCount,0)
 };
}
