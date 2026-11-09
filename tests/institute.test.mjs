
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createLearningScene,serializeLearningScene,validatePassiveScene,SCHEMA,TRUTH,COORDINATES,MAX_SCENE_BYTES} from "../site/institute-scene.mjs";
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const catalog=read("../site/data/topics.json"),research=read("../site/data/research.json"),
  tour=read("../site/data/institute-stops.json"),routes=read("../site/data/platform-gateways.json");
test("Six accessible visitor stations link to actual founding Atlas topics",()=>{
 assert.equal(tour.length,6);assert.equal(new Set(tour.map(s=>s.id)).size,6);
 const ids=new Set(catalog.topics.map(t=>t.id));
 for(const s of tour){assert.ok(s.topicIds.length>=2);assert.ok(s.topicIds.every(id=>ids.has(id)));assert.match(s.anchor,/^#[a-z-]+$/);
  assert.ok(s.question.length>=25);assert.ok(s.description.length>=50);assert.ok(s.position.x>=0&&s.position.x<=100&&s.position.y>=0&&s.position.y<=100);}
});
test("PhiOS gateway routes remain explicit source-only links, never installers",()=>{
 assert.equal(routes.length,4);for(const r of routes){assert.match(r.url,/^https:\/\//);assert.match(r.source,/^https:\/\/github.com\/MichaelWave369\//);
 assert.match(r.status,/(not|alpha|experimental)/i);}
});
test("Atlas generates a passive schema accepted by published PhiOS XR bounds",()=>{
 const scene=createLearningScene(catalog,research);
 assert.equal(scene.schema,SCHEMA);assert.equal(scene.truth,TRUTH);assert.deepEqual(scene.coordinateFrame,COORDINATES);
 assert.equal(scene.nodes.length,19);
 assert.equal(scene.nodes.filter(n=>n.kind==="sphere").length,9);
 const markers=scene.nodes.filter(n=>n.kind==="evidence-marker");
 assert.equal(markers.length,10);assert.ok(markers.every(n=>n.metadata.kind==="synthetic"&&n.metadata.sourceUrl===null));
 assert.equal(new Set(scene.nodes.map(n=>n.id)).size,19);
 const exported=serializeLearningScene(scene);assert.ok(new TextEncoder().encode(exported).length<MAX_SCENE_BYTES);
 assert.deepEqual(validatePassiveScene(JSON.parse(exported)),scene);
});
test("Scene validator rejects fake evidence, forbidden permissions, duplicate IDs and invalid bounds",()=>{
 const scene=createLearningScene(catalog,research),copy=()=>JSON.parse(JSON.stringify(scene));
 for(const mutate of [s=>s.truth="CERTIFIED",s=>s.automation="run",s=>s.coordinateFrame.upAxis="Z",
  s=>s.nodes[0].radius=Infinity,s=>s.nodes[0].position.x=60,s=>s.nodes[1].id=s.nodes[0].id,
  s=>s.nodes[9].metadata.kind="reported-measurement",
  s=>s.nodes[9].metadata.script="steal",
  s=>s.nodes[9].metadata.sourceUrl="javascript:alert(1)"]){
   const obj=copy();mutate(obj);assert.throws(()=>validatePassiveScene(obj));
 }
});
test("New section is opt-in, explicitly fictional as a physical site, and does not claim active XR launch",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8"),
  js=readFileSync(new URL("../site/institute.js",import.meta.url),"utf8");
 for(const id of ["institute","institute-map","institute-map-stops","institute-progress","institute-export-scene","institute-platform-grid","institute-previous","institute-next"])
 assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/not an existing building/);
 assert.match(html,/not an automatic VR launch/);
 assert.match(js,/noopener noreferrer/);assert.match(js,/createObjectURL/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|sendBeacon|XMLHttpRequest|eval\(/);
});
