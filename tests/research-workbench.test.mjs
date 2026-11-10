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
 sourceCorrections:load("source-corrections"),claimCorrections:load("corrections")};
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
 const forged=copy(bundle);forged.entries[0].packet.records[0].observation="A fake observation altered after approval.";
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
