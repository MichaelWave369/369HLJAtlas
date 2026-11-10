import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {inspectWorkbenchInput,createWorkbenchExport,MAX_FILE_BYTES,MAX_ENTRIES,WORKBENCH_SCHEMA} from "../site/research-workbench.mjs";
import {simulate,makeNotebookEntry,makeNotebookExport} from "../site/experiment-models.mjs";
import {makeReviewProposal,createReviewPacket} from "../site/verification-engine.mjs";
import {buildEvidenceTrail,makeTrailExport} from "../site/evidence-trail.mjs";
const load=name=>JSON.parse(readFileSync(new URL("../site/data/"+name+".json",import.meta.url),"utf8"));
const ctx={topics:load("topics"),verification:load("verification"),research:load("research"),audit:load("source-audit"),
 sourceCorrections:load("source-corrections"),claimCorrections:load("corrections"),connections:load("connections")};
const stamp="2026-11-09T23:00:00.000Z",copy=v=>JSON.parse(JSON.stringify(v));
const computed=makeNotebookEntry({run:simulate("platonic-solids",{solid:"cube"}),
 prediction:"Euler characteristic should equal exactly two.",
 observation:"The cube returned eight minus twelve plus six equals two.",
 alternative:"This is combinatorics, not evidence about unmeasured physical forces.",createdAt:stamp});
const journal=makeNotebookExport([computed],stamp);
const claim=ctx.verification.claims[1];
const proposal=makeReviewProposal({claim,sourceId:claim.sourceLinks[0].sourceId,assessment:"needs-more-evidence",
 inspectionAcknowledged:true,reviewNotes:"The frequency reference identifies a technical oscillator mechanism.",
 limitations:"This cannot establish any healing effect, and source context needs checking.",
 correctionRequest:"Consider a more narrowly scoped summary.",createdAt:stamp});
const review=createReviewPacket([proposal],stamp);
const evidence=makeTrailExport(buildEvidenceTrail("claim-02",ctx),stamp);
const lab={schema:"369.hlj.lab_bridge.reviewed_packet.v1",createdAt:stamp,
 evidenceStatus:"Unverified, producer-declared application snapshots only",
 records:[{lab:"AquaCymatics369",format:"AquaCymatics reconstruction receipt",classification:"simulation or inference",
 description:"Image-derived reconstruction hint.",sourceClaim:"A visualization based on an image file.",
 boundary:"No image-derived pattern proves a hidden physical structure or a health intervention.",
 fields:[{label:"Frequency (Hz)",value:"432"},{label:"Source mode",value:"Image-derived hint"}],
 version:"0.2-image-reconstruction-lane",validation:"Producer-declared metadata and source format checked, not authenticated.",
 fileName:"aqua-reconstruction.json",sha256:null,topicId:"cymatics",reviewedAt:stamp,
 reviewNote:"User explicitly reviewed the producer-declared interface receipt. No independent verification or source authentication."}]};
test("four real Atlas export families normalize to bounded, unverified workbench entries",()=>{
 for(const [packet,kind] of [[journal,"educational-notebook"],[review,"review-proposals"],
  [evidence,"evidence-trail"],[lab,"lab-receipts"]]){
  const normalized=inspectWorkbenchInput(packet,ctx);
  assert.equal(normalized.length,1);
  const e=normalized[0];assert.equal(e.kind,kind);assert.ok(e.recordCount>=1);
  assert.ok(e.limits.length>35);assert.ok(e.rows.length>0);
  assert.ok(Array.isArray(e.topicIds));
  assert.ok(JSON.stringify(e.packet).length>100);
 }
});
test("edited model outcomes and fake review credibility are rejected",()=>{
 const changed=copy(journal);changed.records[0].result.outputs.eulerCharacteristic=999;
 assert.throws(()=>inspectWorkbenchInput(changed,ctx));
 const changed2=copy(journal);changed2.records[0].claimStatus="MEASURED EVIDENCE";
 assert.throws(()=>inspectWorkbenchInput(changed2,ctx));
 const fake=copy(review);fake.proposals[0].status="PUBLISHED";
 assert.throws(()=>inspectWorkbenchInput(fake,ctx));
 const fake2=copy(review);fake2.proposals[0].sourceId="unknown-paper";
 assert.throws(()=>inspectWorkbenchInput(fake2,ctx));
 const fake3=copy(review);fake3.proposals[0].inspectionAcknowledged=false;
 assert.throws(()=>inspectWorkbenchInput(fake3,ctx));
});
test("stale or forged source/correction trails fail closed",()=>{
 const changed=copy(evidence);changed.trail.sourceRows[0].audit.retractionCheck="cleared";
 assert.throws(()=>inspectWorkbenchInput(changed,ctx));
 const changed2=copy(evidence);changed2.trail.statement="Peer review definitively confirms magic frequency powers.";
 assert.throws(()=>inspectWorkbenchInput(changed2,ctx));
 const changed3=copy(evidence);changed3.trail.sourceRows[0].url="javascript:alert(1)";
 assert.throws(()=>inspectWorkbenchInput(changed3,ctx));
 const stale=copy(ctx);stale.research=copy(ctx.research);
 stale.research.sources.find(x=>x.id==="nist-quartz").title="Renamed source record";
 assert.throws(()=>inspectWorkbenchInput(evidence,stale));
});
test("lab review refuses spoofed producer pairs, unknown topics and unsupported fields",()=>{
 const wrong=copy(lab);wrong.records[0].format="Unknown cinematic ray-tracing receipt";
 assert.throws(()=>inspectWorkbenchInput(wrong,ctx));
 const noTopic=copy(lab);noTopic.records[0].topicId="unregistered-topic";
 assert.throws(()=>inspectWorkbenchInput(noTopic,ctx));
 const badHash=copy(lab);badHash.records[0].sha256="CERTIFIED";
 assert.throws(()=>inspectWorkbenchInput(badHash,ctx));
 const excessive=copy(lab);excessive.records[0].fields[0].value="x".repeat(2000);
 assert.throws(()=>inspectWorkbenchInput(excessive,ctx));
 const extra=copy(lab);extra.records[0].secret="Hidden raw source bytes";
 const normalized=inspectWorkbenchInput(extra,ctx)[0];
 assert.ok(!JSON.stringify(normalized.packet).includes("Hidden raw source bytes"));
});
test("portable workbench archive roundtrips with four accepted packets and refuses duplicates",()=>{
 const originals=[journal,review,evidence,lab];
 const normalized=originals.flatMap(p=>inspectWorkbenchInput(p,ctx));
 const bundle=createWorkbenchExport(normalized,stamp);
 assert.equal(bundle.schema,WORKBENCH_SCHEMA);
 assert.equal(bundle.entries.length,4);
 const again=inspectWorkbenchInput(copy(bundle),ctx);
 assert.equal(again.length,4);
 assert.deepEqual(again.map(x=>x.kind),normalized.map(x=>x.kind));
 const duplicate=createWorkbenchExport([normalized[0],normalized[0]],stamp);
 assert.throws(()=>inspectWorkbenchInput(duplicate,ctx));
 const forged=copy(bundle);forged.entries[0].packet.records[0].result.outputs.eulerCharacteristic=999;
 assert.throws(()=>inspectWorkbenchInput(forged,ctx));
 assert.throws(()=>createWorkbenchExport([],stamp));
 assert.throws(()=>createWorkbenchExport(Array(MAX_ENTRIES+1).fill(normalized[0]),stamp));
});
test("unknown schemas, malformed input and missing registries are rejected",()=>{
 for(const v of [null,[],{},{"schema":"made-up-science"},undefined])
  assert.throws(()=>inspectWorkbenchInput(v,ctx));
 assert.throws(()=>inspectWorkbenchInput(journal,{}));
 assert.equal(MAX_FILE_BYTES,256*1024);
 assert.equal(MAX_ENTRIES,8);
});
test("Workbench UI requires local file review, explicit consent and supports local export",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../site/research-workbench.js",import.meta.url),"utf8");
 for(const id of ["packet-workbench","workbench-file","workbench-confirm","workbench-preview","workbench-approve",
  "workbench-archive","workbench-export","workbench-clear","workbench-count"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/I reviewed the displayed contents/);
 assert.match(js,/TextDecoder/);assert.match(js,/file.arrayBuffer/);assert.match(js,/confirm/);
 assert.match(js,/createObjectURL/);assert.match(js,/packetFingerprint/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|sendBeacon|XMLHttpRequest|eval\(/);
 assert.equal(spawnSync(process.execPath,["--check",new URL("../site/research-workbench.js",import.meta.url).pathname],{encoding:"utf8"}).status,0);
 const nav=html.split('<nav class="site-nav"')[1].split("</nav>")[0];
 assert.ok(!nav.includes('href="#packet-workbench"'),"Keep compact header unchanged");
});

const selectedCosmos=ctx.topics.topics.find(t=>t.id==="cymatics");
const cosmosDossier=ctx.research.dossiers.find(d=>d.topicId===selectedCosmos.id);
const cosmosPacket={
 schema:"369-hlj-research-packet/v1",generatedAt:stamp,
 topic:{id:selectedCosmos.id,title:selectedCosmos.title,realm:selectedCosmos.realm,reviewStatus:selectedCosmos.reviewStatus},
 scope:"Personal research notebook, not reviewed scientific findings",
 notes:[{topicId:"cymatics",text:"My own observation: boundary conditions may change the pattern and need testing."},
        {topicId:"sacred-geometry",text:"A symbolic resemblance is not proof of a physical connection."}],
 relationships:ctx.connections.filter(c=>c.a===selectedCosmos.id||c.b===selectedCosmos.id),
 dossier:{classification:cosmosDossier.classification,question:cosmosDossier.question,
  supported:cosmosDossier.supported,boundary:cosmosDossier.boundary,sourceIds:cosmosDossier.sourceIds},
 sources:cosmosDossier.sourceIds.map(id=>ctx.research.sources.find(s=>s.id===id)),
 privacy:"Exported locally in your browser; not uploaded by this application."
};
test("Constellation notebook imports all user text and grounded topic identities",()=>{
 const [out]=inspectWorkbenchInput(cosmosPacket,ctx);
 assert.equal(out.kind,"constellation-notes");assert.equal(out.recordCount,3);
 assert.deepEqual(out.topicIds,["cymatics","sacred-geometry"]);
 assert.deepEqual(out.sourceIds,cosmosDossier.sourceIds);
 assert.equal(out.packet.notes.length,2);
 assert.ok(out.rows.some(row=>row.lines.some(line=>line.value.includes("symbolic resemblance"))));
 assert.match(out.limits,/NOT scientific validation/i);
});
test("Constellation with zero notes remains a valid selected-topic packet",()=>{
 const empty=copy(cosmosPacket);empty.notes=[];
 const [r]=inspectWorkbenchInput(empty,ctx);
 assert.equal(r.recordCount,1);assert.equal(r.packet.notes.length,0);
});
test("long personal notes display fully rather than silently truncating",()=>{
 const long=copy(cosmosPacket);long.notes=[{topicId:"cymatics",text:"A".repeat(7000)}];
 const [out]=inspectWorkbenchInput(long,ctx);
 assert.equal(out.packet.notes[0].text.length,7000);
 assert.ok(out.rows.some(row=>row.lines.some(line=>line.value.length===7000)));
});
test("Constellation rejects forged catalog links, changed source metadata and bad notes",()=>{
 const bad=[
 p=>p.topic.title="Certified",
 p=>p.topic.reviewStatus="peer-reviewed",
 p=>p.relationships.push({a:"cymatics",b:"magic",relation:"causes"}),
 p=>p.dossier.supported="Scientifically proven healing",
 p=>p.sources[0].title="Fake scientific paper",
 p=>p.notes[0].topicId="unknown-topic",
 p=>p.notes[1].topicId=p.notes[0].topicId,
 p=>p.notes[0].text="Z".repeat(8001),
 p=>p.notes[0].text="",
 p=>p.scope="Proof of magic",
 p=>p.generatedAt="unknown time"
 ];
 for(const change of bad){const packet=copy(cosmosPacket);change(packet);assert.throws(()=>inspectWorkbenchInput(packet,ctx));}
 const missing=copy(ctx);delete missing.connections;
 assert.throws(()=>inspectWorkbenchInput(cosmosPacket,missing));
});
test("all five producer formats roundtrip with private notes and no authority upgrade",()=>{
 const entries=[journal,review,evidence,lab,cosmosPacket].flatMap(p=>inspectWorkbenchInput(p,ctx));
 const bundle=createWorkbenchExport(entries,stamp);
 assert.equal(bundle.entries.length,5);
 const restored=inspectWorkbenchInput(copy(bundle),ctx);
 assert.deepEqual(restored.map(x=>x.kind),entries.map(x=>x.kind));
 assert.equal(restored[4].packet.notes[0].text,cosmosPacket.notes[0].text);
 const dupe={...bundle,entries:[...bundle.entries,bundle.entries[4]]};
 assert.throws(()=>inspectWorkbenchInput(dupe,ctx));
});
test("in-page topic links keep clean header and Constellation state",()=>{
 const js=readFileSync(new URL("../site/research-workbench.js",import.meta.url),"utf8");
 const con=readFileSync(new URL("../site/constellation.js",import.meta.url),"utf8");
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 assert.match(js,/hlj:topic-selected/);assert.match(js,/preventDefault/);
 assert.match(js,/history.replaceState/);assert.match(con,/hlj:topic-selected/);
 assert.ok(html.includes('href="#packet-workbench"'));
 assert.ok(!html.split('<nav class="site-nav"')[1].split("</nav>")[0].includes('href="#packet-workbench"'));
});
