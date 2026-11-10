
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {PROTOCOLS,SOLIDS,standingWaves,platonicSolid,chanceNullModel,simulate,
  binomialTwoSidedProbability,makeNotebookEntry,makeNotebookExport} from "../site/experiment-models.mjs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const catalog=read("../site/data/topics.json"),sources=read("../site/data/research.json").sources;
test("Three protocols have actual topic IDs and contextual sources",()=>{
 assert.equal(PROTOCOLS.length,3);
 const topicIds=new Set(catalog.topics.map(x=>x.id)),sourceIds=new Set(sources.map(x=>x.id));
 assert.equal(new Set(PROTOCOLS.map(p=>p.id)).size,3);
 for(const p of PROTOCOLS){assert.ok(p.topicIds.length>=2);assert.ok(p.topicIds.every(id=>topicIds.has(id)),p.id);
   assert.ok(p.sourceIds.every(id=>sourceIds.has(id)),p.id);
   for(const field of ["question","method","challenge","boundary","nextTest"])assert.ok(p[field].length>20);}
});
test("Standing wave frequency follows f_n=n*v/(2L) and fixed endpoints",()=>{
 const r=standingWaves({lengthMeters:1,mode:2});
 assert.equal(r.outputs.frequencyHz,120);
 assert.equal(r.outputs.wavelengthMeters,1);
 assert.deepEqual(r.outputs.nodePositionsMeters,[0,.5,1]);
 assert.deepEqual(r.outputs.antinodePositionsMeters,[.25,.75]);
 assert.equal(r.outputs.sampleWave.length,121);
 assert.ok(Math.abs(r.outputs.sampleWave[0].y)<1e-10);
 assert.ok(Math.abs(r.outputs.sampleWave[120].y)<1e-10);
 const doubled=standingWaves({lengthMeters:2,mode:2});
 assert.equal(doubled.outputs.frequencyHz,60);
 const third=standingWaves({lengthMeters:1,mode:3});
 assert.equal(third.outputs.frequencyHz,180);
 for(const args of [{lengthMeters:0,mode:2},{lengthMeters:1,mode:9},{lengthMeters:"1",mode:2}])
   assert.throws(()=>standingWaves(args));
});
test("All five Platonic solids satisfy V-E+F=2",()=>{
 assert.equal(Object.keys(SOLIDS).length,5);
 for(const key of Object.keys(SOLIDS)){
  const r=platonicSolid({solid:key});assert.equal(r.outputs.eulerCharacteristic,2,key);
  assert.equal(r.outputs.vertices-r.outputs.edges+r.outputs.faces,2);
 }
 assert.throws(()=>platonicSolid({solid:"torus"}));
});
test("Seeded null model is reproducible and exact probability is bounded",()=>{
 const a=chanceNullModel({seed:369}),b=chanceNullModel({seed:369});
 assert.deepEqual(a,b);assert.equal(a.outputs.heads+a.outputs.tails,40);
 assert.equal(a.outputs.flips.length,40);
 assert.equal(binomialTwoSidedProbability(20,40),1);
 assert.ok(Math.abs(binomialTwoSidedProbability(0,40)-Math.pow(2,-39))<1e-13);
 assert.equal(binomialTwoSidedProbability(30,40),binomialTwoSidedProbability(10,40));
 for(const k of [0,1,2,15,20,30,39,40])assert.ok(binomialTwoSidedProbability(k,40)>=0&&binomialTwoSidedProbability(k,40)<=1);
 assert.notDeepEqual(a.outputs.flips,chanceNullModel({seed:370}).outputs.flips);
 assert.throws(()=>chanceNullModel({seed:0}));assert.throws(()=>chanceNullModel({seed:1.5}));
 assert.throws(()=>simulate("unreviewed-experiment",{}));
});
test("Captured research records preserve predictions but strip SVG plot samples",()=>{
 const r=simulate("standing-waves",{lengthMeters:1,mode:2});
 const entry=makeNotebookEntry({run:r,prediction:"Doubling length will halve the frequency.",
  observation:"Predicted mode was 120 Hz at the baseline.",alternative:"Assumes ideal fixed ends and constant speed.",createdAt:"2026-11-09T20:00:00.000Z"});
 assert.equal(entry.result.outputs.sampleWave,undefined);
 assert.match(entry.claimStatus,/NOT MEASURED/);
 assert.throws(()=>makeNotebookEntry({run:r,prediction:"x",observation:"test",alternative:"",createdAt:new Date().toISOString()}));
 const packet=makeNotebookExport([entry],"2026-11-09T21:00:00.000Z");
 assert.equal(packet.records.length,1);
 assert.match(packet.privacy,/not uploaded/);
 assert.throws(()=>makeNotebookExport(Array(13).fill(entry),"2026-11-09T21:00:00.000Z"));
});
test("Browser interface has accessible controls and no automatic storage or network upload",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../site/living-lab.js",import.meta.url),"utf8");
 for(const id of ["living-lab","living-protocols","living-parameters","living-prediction","living-run","living-outcome-body",
  "living-observation","living-alternative","living-capture","living-records","living-export","living-clear"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(ui,/aria-pressed/);assert.match(ui,/textContent/);
 assert.match(ui,/noopener noreferrer/);
 assert.match(ui,/createObjectURL/);
 assert.doesNotMatch(ui,/innerHTML|localStorage|sessionStorage|eval\(|sendBeacon|XMLHttpRequest/);
 const syntax=spawnSync(process.execPath,["--check",new URL("../site/living-lab.js",import.meta.url).pathname],{encoding:"utf8"});
 assert.equal(syntax.status,0,syntax.stderr);
});
