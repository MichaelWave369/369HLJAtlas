import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {inspectWorkbenchInput} from "../site/research-workbench.mjs";
import {createResearchProject,inspectResearchProject,PROJECT_SCHEMA,MAX_PROJECTS,MAX_PROJECT_FILE_BYTES} from "../site/research-project.mjs";
import {simulate,makeNotebookEntry,makeNotebookExport} from "../site/experiment-models.mjs";
import {makeReviewProposal,createReviewPacket} from "../site/verification-engine.mjs";
const load=name=>JSON.parse(readFileSync(new URL("../site/data/"+name+".json",import.meta.url),"utf8"));
const ctx={topics:load("topics"),verification:load("verification"),research:load("research"),
 audit:load("source-audit"),sourceCorrections:load("source-corrections"),
 claimCorrections:load("corrections"),connections:load("connections")};
const stamp="2026-11-09T23:00:00.000Z";
const copy=x=>JSON.parse(JSON.stringify(x));
const notebook=makeNotebookExport([makeNotebookEntry({
 run:simulate("platonic-solids",{solid:"cube"}),createdAt:stamp,
 prediction:"The Euler relationship for the cube is two.",
 observation:"Eight minus twelve plus six returned two.",
 alternative:"A mathematical equality does not demonstrate energy forces."
})],stamp);
const claim=ctx.verification.claims[0];
const review=createReviewPacket([makeReviewProposal({
 claim,sourceId:claim.sourceLinks[0].sourceId,assessment:"needs-more-evidence",inspectionAcknowledged:true,
 reviewNotes:"The study shows a physical pattern but requires methods verification.",
 limitations:"The paper is not proof of a biological effect or healing claim.",createdAt:stamp,
 correctionRequest:"Distinguish physical and health claims."
})],stamp);
const cosmosTopic=ctx.topics.topics.find(t=>t.id==="cymatics");
const dossier=ctx.research.dossiers.find(d=>d.topicId===cosmosTopic.id);
const cosmos={schema:"369-hlj-research-packet/v1",generatedAt:stamp,
 topic:{id:cosmosTopic.id,title:cosmosTopic.title,realm:cosmosTopic.realm,reviewStatus:cosmosTopic.reviewStatus},
 scope:"Personal research notebook, not reviewed scientific findings",
 notes:[{topicId:"cymatics",text:"A private original research note about standing wave patterns."}],
 relationships:ctx.connections.filter(c=>c.a===cosmosTopic.id||c.b===cosmosTopic.id),
 dossier:{classification:dossier.classification,question:dossier.question,supported:dossier.supported,boundary:dossier.boundary,sourceIds:dossier.sourceIds},
 sources:dossier.sourceIds.map(id=>ctx.research.sources.find(s=>s.id===id)),
 privacy:"Exported locally in your browser; not uploaded by this application."
};
const included=[notebook,review,cosmos].flatMap(x=>inspectWorkbenchInput(x,ctx));
const focus={
 title:"Standing-wave research questions",
 question:"How do boundary conditions change a predicted standing-wave pattern?",
 hypothesis:"Different fixed boundaries predict different nodal locations.",
 limitations:"Only ideal calculations and personal observations are included; no actual measurements."
};
const make=()=>createResearchProject({focus,entries:included,createdAt:stamp,updatedAt:stamp},ctx);
test("Portable project includes only chosen reviewed packet kinds and original personal notes",()=>{
 const p=make();assert.equal(p.schema,PROJECT_SCHEMA);assert.equal(p.entries.length,3);
 assert.deepEqual(p.entries.map(x=>x.kind),["educational-notebook","review-proposals","constellation-notes"]);
 const parsed=inspectResearchProject(copy(p),ctx);
 assert.equal(parsed.file.focus.title,focus.title);
 assert.equal(parsed.reviewed.length,3);
 assert.equal(parsed.recordCount,3);
 assert.ok(parsed.topicIds.includes("cymatics"));
 assert.ok(JSON.stringify(parsed.file).includes("private original research note"));
 assert.match(parsed.file.evidenceBoundary,/not scientific validation/);
 assert.match(parsed.file.privacy,/No automatic upload/);
});
test("Roundtrip files reject forged computational results, status upgrades and wrong source metadata",()=>{
 const changes=[
  p=>p.entries[0].packet.records[0].result.outputs.eulerCharacteristic=99,
  p=>p.entries[1].packet.proposals[0].status="PUBLISHED_VERIFIED",
  p=>p.entries[1].packet.proposals[0].sourceId="unknown-paper",
  p=>p.entries[2].packet.topic.reviewStatus="verified",
  p=>p.entries[2].packet.sources[0].title="Forged source",
  p=>p.entries[2].packet.relationships.push({a:"cymatics",b:"anything",relation:"proves"}),
  p=>p.entries[0].kind="CERTIFIED_DATA",
  p=>p.entries.push(p.entries[0]),
  p=>p.evidenceBoundary="Peer reviewed and certified",
  p=>p.mystery="hidden machine instruction"
 ];
 for(const change of changes){
  const altered=copy(make());change(altered);assert.throws(()=>inspectResearchProject(altered,ctx));
 }
});
test("Only author-supplied notes can change without pretending they are cryptographically authenticated",()=>{
 const changed=copy(make());
 changed.entries[2].packet.notes[0].text="A new personal note, not a scientific claim.";
 const inspected=inspectResearchProject(changed,ctx);
 assert.equal(inspected.file.entries[2].packet.notes[0].text,"A new personal note, not a scientific claim.");
 assert.match(inspected.file.evidenceBoundary,/not scientific validation/);
});
test("No empty projects, excessive packet sets, malformed metadata or dates",()=>{
 const cfg={focus,entries:included,createdAt:stamp,updatedAt:stamp};
 assert.throws(()=>createResearchProject({...cfg,entries:[]},ctx));
 assert.throws(()=>createResearchProject({...cfg,entries:Array(9).fill(included[0])},ctx));
 assert.throws(()=>createResearchProject({...cfg,focus:{...focus,question:"short"}},ctx));
 assert.throws(()=>createResearchProject({...cfg,focus:{...focus,title:"x"}},ctx));
 assert.throws(()=>createResearchProject({...cfg,createdAt:"nope"},ctx));
 assert.throws(()=>createResearchProject({...cfg,createdAt:"2026-11-11T00:00:00Z",updatedAt:stamp},ctx));
 const malformed=copy(make());delete malformed.focus.limitations;
 assert.throws(()=>inspectResearchProject(malformed,ctx));
});
test("Project export is a bounded 1 MiB local JSON and three-session-projects is UI-only",()=>{
 assert.equal(MAX_PROJECT_FILE_BYTES,1024*1024);
 assert.equal(MAX_PROJECTS,3);
 const huge=copy(make());huge.privacy="X".repeat(1024*1024);
 assert.throws(()=>inspectResearchProject(huge,ctx));
});
test("Existing package privacy invariants hold and no new site navigation links were introduced",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../site/research-workbench.js",import.meta.url),"utf8");
 for(const id of ["research-projects","project-create-form","project-title","project-question","project-hypothesis",
 "project-limitations","project-packet-choices","project-file","project-import-preview","project-import-confirm",
 "project-import-accept","project-list","project-clear"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(js,/inspectResearchProject/);assert.match(js,/createResearchProject/);
 assert.match(js,/TextDecoder/);assert.match(js,/project-import-confirm/);
 assert.match(js,/createObjectURL/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|sendBeacon|XMLHttpRequest|eval\(/);
 assert.equal(spawnSync(process.execPath,["--check",new URL("../site/research-workbench.js",import.meta.url).pathname],{encoding:"utf8"}).status,0);
 assert.ok(!html.split('<nav class="site-nav"')[1].split("</nav>")[0].includes('href="#research-projects"'));
});
