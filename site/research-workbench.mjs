/**
 * HLJ-011: local, allowlisted packet interchange for existing Atlas modules.
 * Inspect imported packets; never execute, authenticate, publish or trust claimed status.
 */
import {PROTOCOLS,simulate,makeNotebookEntry} from "./experiment-models.mjs";
import {makeReviewProposal,PROPOSAL_SCHEMA,PACKET_SCHEMA} from "./verification-engine.mjs";
import {buildEvidenceTrail} from "./evidence-trail.mjs";
export const WORKBENCH_SCHEMA="369.hlj.research-workbench.v1";
export const MAX_FILE_BYTES=256*1024;
export const MAX_ENTRIES=8;
const LAB_FORMATS=Object.freeze({
 "AquaCymatics369|AquaCymatics reconstruction receipt":"simulation or inference",
 "PHI369 Element Spiral Atlas|Element Spiral receipt v1":"visualization state",
 "PHI369 Element Spiral Atlas|Element Spiral research snapshot v1":"research notebook",
 "PHI369 Element Spiral Atlas|Element Spiral view export v2.0":"visualization state"
});
const obj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const fail=(what)=>{throw new TypeError("Rejected "+what);};
const text=(v,max=300,min=1)=>{
 if(typeof v!=="string"||v.trim().length<min||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))fail("invalid or excessive text");
 return v.trim();
};
const timestamp=v=>{
 if(typeof v!=="string"||v.length>45||Number.isNaN(Date.parse(v)))fail("invalid date");
 return v;
};
const fieldsRow=(name,value)=>({name:text(name,65),value:text(String(value),300)});
const arrays=(v,max)=>Array.isArray(v)&&v.length>=1&&v.length<=max;
const canonical=(v)=>JSON.stringify(v,(key,value)=>{
 if(obj(value))return Object.keys(value).sort().reduce((o,k)=>{o[k]=value[k];return o;},{});
 return value;
});
function assertSame(actual,expected,label){
 if(canonical(actual)!==canonical(expected))fail(label+" was changed, stale or inconsistent; re-export it from the current Atlas");
}
const entry=(kind,title,packet,rows,limits,topicIds=[],sourceIds=[])=>({
 kind,title,packet,
 recordCount:rows.length,
 topicIds:[...new Set(topicIds)],sourceIds:[...new Set(sourceIds)],
 rows,limits
});
function notebook(input,ctx){
 if(!arrays(input.records,12))fail("empty or oversized educational notebook");
 const known=new Map(PROTOCOLS.map(p=>[p.id,p]));
 const rows=[],records=[],topics=[],sources=[];
 for(const r of input.records){
  if(!obj(r)||r.schema!=="369.hlj.educational-run.v1"||!known.has(r.protocolId)||
   r.claimStatus!=="EDUCATIONAL MODEL ONLY - NOT MEASURED EVIDENCE"||!obj(r.result?.inputs))
   fail("unrecognized educational run");
  const p=known.get(r.protocolId);
  const expected=makeNotebookEntry({
   run:simulate(r.protocolId,r.result.inputs),
   prediction:r.prediction,observation:r.observation,
   alternative:r.alternative,createdAt:r.createdAt
  });
  assertSame(r,expected,"educational computation");
  rows.push({heading:p.title+" · "+r.createdAt,lines:[
   fieldsRow("Prediction",expected.prediction),fieldsRow("Observation",expected.observation),
   fieldsRow("Alternative or limit",expected.alternative),fieldsRow("Computed result",expected.result.summary)
  ]});
  records.push(expected);topics.push(...p.topicIds);sources.push(...p.sourceIds);
 }
 const clean={schema:"369.hlj.educational-notebook.v1",createdAt:timestamp(input.createdAt),
  scope:"Educational user-authored observations and deterministic computations, not experimental measurements.",
  privacy:"Contains user notes; exported only after user action.",records};
 return entry("educational-notebook","Living Lab · Educational notebook",clean,rows,
  "Deterministic models only. Predictions and observations are personal notes, not experimental evidence.",topics,sources);
}
function reviews(input,ctx){
 if(input.publicationState!=="UNPUBLISHED_LOCAL_SUGGESTIONS"||!arrays(input.proposals,20))fail("review packet publication boundary");
 const known=new Map(ctx.verification.claims.map(c=>[c.id,c]));
 const rows=[],proposals=[],topics=[],sources=[];
 for(const p of input.proposals){
  if(!obj(p)||p.schema!==PROPOSAL_SCHEMA||p.status!=="LOCAL_PROPOSAL_NOT_PUBLISHED")
   fail("review proposal status");
  const claim=known.get(p.claimId);
  if(!claim||claim.topicId!==p.topicId)fail("review claim/topic mismatch");
  const expected=makeReviewProposal({claim,sourceId:p.sourceId,assessment:p.assessment,
   inspectionAcknowledged:p.inspectionAcknowledged,reviewNotes:p.reviewNotes,
   limitations:p.limitations,correctionRequest:p.correctionRequest??"",
   createdAt:p.createdAt});
  assertSame(p,expected,"review proposal");
  rows.push({heading:claim.id+" · "+p.sourceId,lines:[
   fieldsRow("Provisional assessment",expected.assessment),
   fieldsRow("Source observations",expected.reviewNotes),fieldsRow("Limitations",expected.limitations),
   fieldsRow("Suggested correction",expected.correctionRequest||"None")
  ]});
  proposals.push(expected);topics.push(p.topicId);sources.push(p.sourceId);
 }
 const clean={schema:PACKET_SCHEMA,createdAt:timestamp(input.createdAt),
  publicationState:"UNPUBLISHED_LOCAL_SUGGESTIONS",
  privacy:"Contains personal review notes. Not automatically published or uploaded.",
  process:"Requires independent human source examination and a reviewed PR.",
  proposals};
 return entry("review-proposals","Verification Desk · Review proposals",clean,rows,
  "Self-attested proposals are NOT peer review or publication. Do not submit personal notes you do not wish to share.",topics,sources);
}
function evidence(input,ctx){
 if(input.evidenceStatus!=="UNVERIFIED_CATALOG_REFERENCES"||
    !obj(input.trail)||typeof input.trail.claimId!=="string")fail("evidence trail classification");
 const expected=buildEvidenceTrail(input.trail.claimId,ctx);
 assertSame(input.trail,expected,"documentary evidence trail");
 const clean={
  schema:"369.hlj.evidence-trail-export.v1",createdAt:timestamp(input.createdAt),
  purpose:"Citation index, not verified scientific results.",
  evidenceStatus:"UNVERIFIED_CATALOG_REFERENCES",
  privacy:"Public bibliographic references only; no automatic network sync.",
  trail:expected};
 const lines=[
  fieldsRow("Claim",expected.statement),
  fieldsRow("Evidence boundary",expected.scopeLimit),
  fieldsRow("Source references",String(expected.sourceCount)),
  fieldsRow("Independent evidence verification","Not performed"),
  fieldsRow("Retraction checks","Not performed"),
  ...expected.sourceRows.flatMap(s=>[
    fieldsRow("Reference title",s.title),
    fieldsRow("Reference URL",s.url),
    fieldsRow("Cited role",s.relationship),
    fieldsRow("Review observation",s.audit.observation),
    fieldsRow("Bibliography correction count",s.bibliographyCorrections.length)
  ])
 ];
 const topics=[expected.topicId],sources=expected.sourceRows.map(s=>s.sourceId);
 return entry("evidence-trail","Evidence Trail · "+expected.topicTitle,clean,
  [{heading:expected.claimId+" · Current Atlas documentary chain",lines}],
  "Matches current catalog metadata, not independently verified evidence. Changes to sources require a fresh export.",topics,sources);
}
function lab(input,ctx){
 if(!arrays(input.records,12)||typeof input.evidenceStatus!=="string"||
    !input.evidenceStatus.startsWith("Unverified, producer-declared"))fail("lab review packet boundary");
 const topicIds=new Set(ctx.topics.topics.map(t=>t.id)),rows=[],records=[],topics=[];
 for(const r of input.records){
  if(!obj(r)||!Object.hasOwn(LAB_FORMATS,String(r.lab)+"|"+String(r.format))||
   LAB_FORMATS[r.lab+"|"+r.format]!==r.classification)fail("unsupported producer/format pair");
  const version=text(r.version,60),label=text(r.lab,80),format=text(r.format,90);
  const description=text(r.description,350),sourceClaim=text(r.sourceClaim,350),boundary=text(r.boundary,650,20);
  const fileName=text(r.fileName,90),validation=text(r.validation,300);
  const reviewNote=text(r.reviewNote,450),reviewedAt=timestamp(r.reviewedAt);
  if(r.topicId!==null&&(!topicIds.has(r.topicId)||typeof r.topicId!=="string"))fail("unknown mapped lab topic");
  if(r.sha256!==null&&!(typeof r.sha256==="string"&&/^[0-9a-f]{64}$/.test(r.sha256)))fail("invalid laboratory fingerprint");
  if(!arrays(r.fields,10))fail("invalid bounded laboratory fields");
  const seen=new Set(),fields=r.fields.map(f=>{
    if(!obj(f))fail("invalid laboratory field");
    const name=text(f.label,75),value=text(f.value,300);
    if(seen.has(name))fail("duplicated laboratory field");
    seen.add(name);return{label:name,value};
  });
  const clean={lab:label,format,classification:r.classification,description,sourceClaim,boundary,fields,
    version,validation,fileName,sha256:r.sha256,topicId:r.topicId,reviewedAt,reviewNote};
  records.push(clean);if(r.topicId)topics.push(r.topicId);
  rows.push({heading:label+" · "+fileName,lines:[
    fieldsRow("Format",format),fieldsRow("Version",version),fieldsRow("Description",description),
    fieldsRow("Producer declared",sourceClaim),fieldsRow("Limitation",boundary),
    fieldsRow("Mapped Atlas topic",r.topicId||"Not associated"),
    fieldsRow("Inspection note",reviewNote),fieldsRow("Recorded review date",reviewedAt),
    fieldsRow("Byte fingerprint",r.sha256||"Unavailable; not an authenticity signature"),
    ...fields.map(f=>fieldsRow(f.label,f.value))
  ]});
 }
 return entry("lab-receipts","Lab Bridge · Reviewed source-declared receipts",
  {schema:"369.hlj.lab_bridge.reviewed_packet.v1",createdAt:timestamp(input.createdAt),
   evidenceStatus:"Unverified, producer-declared application snapshots only",
   privacy:"Allowlisted source descriptions and settings; exported only on user action.",records},
  rows,"Source files and producer identity are NOT authenticated. Original JSON and hidden lab data are not imported.",topics,[]);
}

function constellation(input,ctx){
 if(input.scope!=="Personal research notebook, not reviewed scientific findings"||
    !obj(input.topic)||!Array.isArray(input.notes)||input.notes.length>179||
    !Array.isArray(input.relationships)||!Array.isArray(input.sources))
    fail("Constellation notebook scope or record structure");
 if(!Array.isArray(ctx.connections))fail("missing current relationship registry");
 const topicMap=new Map(ctx.topics.topics.map(t=>[t.id,t]));
 const selected=topicMap.get(input.topic.id);
 if(!selected)fail("Constellation selected topic is not registered");
 const identity={id:selected.id,title:selected.title,realm:selected.realm,reviewStatus:selected.reviewStatus};
 assertSame(input.topic,identity,"Constellation topic identity");
 const expectedRelationships=ctx.connections.filter(c=>c.a===selected.id||c.b===selected.id);
 assertSame(input.relationships,expectedRelationships,"Constellation provisional relationships");
 const d=ctx.research.dossiers.find(x=>x.topicId===selected.id);
 const expectedDossier=d?{classification:d.classification,question:d.question,
  supported:d.supported,boundary:d.boundary,sourceIds:d.sourceIds}:null;
 assertSame(input.dossier,expectedDossier,"Constellation research dossier");
 const bySource=new Map(ctx.research.sources.map(x=>[x.id,x]));
 const linkedSources=d?d.sourceIds.map(id=>{
  const source=bySource.get(id);if(!source)fail("missing Constellation dossier source");
  return source;
 }):[];
 assertSame(input.sources,linkedSources,"Constellation source metadata");
 const seen=new Set(),notes=[];
 for(const note of input.notes){
  if(!obj(note)||!topicMap.has(note.topicId)||seen.has(note.topicId))
   fail("unknown or repeated Constellation note topic");
  const content=text(note.text,8000,1);
  seen.add(note.topicId);notes.push({topicId:note.topicId,text:content});
 }
 const createdAt=timestamp(input.generatedAt);
 const clean={schema:"369-hlj-research-packet/v1",generatedAt:createdAt,topic:identity,
  scope:"Personal research notebook, not reviewed scientific findings",
  notes,relationships:expectedRelationships,dossier:expectedDossier,sources:linkedSources,
  privacy:"Contains personal research notes; exported locally on explicit user action, not uploaded."};
 const rows=[{heading:"Selected topic · "+selected.title,lines:[
   fieldsRow("Atlas realm",selected.realm),fieldsRow("Topic review status",selected.reviewStatus),
   fieldsRow("Personal notes included",String(notes.length)),
   fieldsRow("Provisional topic connections",String(expectedRelationships.length)),
   fieldsRow("Source-linked dossier",d?"Editorial starter, not independently validated scientific evidence":"Not available"),
   fieldsRow("Scientific certification","Not performed")
 ]}];
 for(const note of notes){
  const topic=topicMap.get(note.topicId);
  rows.push({heading:"Personal note · "+topic.title,lines:[
    fieldsRow("Topic",topic.title),{name:"Author-supplied text",value:note.text},
    fieldsRow("Evidence status","Personal hypothesis or observation, not verified evidence")
  ]});
 }
 return entry("constellation-notes","Constellation · "+selected.title,clean,rows,
  "Personal notes are editable and unauthenticated. Source and relationship matches mean catalog consistency, NOT scientific validation.",
  [selected.id,...notes.map(n=>n.topicId)],d?d.sourceIds:[]);
}

function parseOne(value,ctx){
 if(!obj(value))fail("packet root");
 switch(value.schema){
  case "369.hlj.educational-notebook.v1":return notebook(value,ctx);
  case PACKET_SCHEMA:return reviews(value,ctx);
  case "369.hlj.evidence-trail-export.v1":return evidence(value,ctx);
  case "369.hlj.lab_bridge.reviewed_packet.v1":return lab(value,ctx);
  case "369-hlj-research-packet/v1":return constellation(value,ctx);
  default:fail("unknown packet schema");
 }
}
export function inspectWorkbenchInput(value,ctx){
 if(!obj(ctx)||!obj(ctx.topics)||!obj(ctx.verification)||!obj(ctx.research))fail("missing registry context");
 if(!obj(value))fail("packet JSON");
 if(value.schema!==WORKBENCH_SCHEMA)return [parseOne(value,ctx)];
 if(!arrays(value.entries,MAX_ENTRIES))fail("empty or oversized workbench bundle");
 const parsed=value.entries.map(item=>{
   if(!obj(item)||!obj(item.packet))fail("workbench bundle entry");
   return parseOne(item.packet,ctx);
 });
 if(!new Set(parsed.map(x=>canonical(x.packet))).size||new Set(parsed.map(x=>canonical(x.packet))).size!==parsed.length)
  fail("duplicated workbench records");
 return parsed;
}
export function createWorkbenchExport(entries,createdAt){
 if(!arrays(entries,MAX_ENTRIES))throw new RangeError("Workbench requires 1 to 8 reviewed packet entries");
 const timestampText=timestamp(createdAt);
 const items=entries.map(x=>{
  if(!obj(x)||!obj(x.packet)||typeof x.kind!=="string")fail("unreviewed workbench entry");
  return{kind:x.kind,packet:x.packet};
 });
 const textPacket=JSON.stringify({schema:WORKBENCH_SCHEMA,createdAt:timestampText,
  evidenceBoundary:"Portable personal archive, not scientific verification, claim publication or producer authentication.",
  privacy:"Contains any user-authored research notes shown during inspection. No automatic storage or upload.",
  entries:items});
 if(new TextEncoder().encode(textPacket).length>1024*1024)throw new RangeError("Workbench export exceeds 1 MiB");
 return JSON.parse(textPacket);
}
