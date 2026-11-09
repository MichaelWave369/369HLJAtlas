
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeLabReceipt,MAX_BYTES} from "../site/lab-contracts.mjs";
const fixtures={
  aqua:{app:"AquaCymatics369",version:"0.2-image-reconstruction-lane",claimClass:"Inferred",
    generatedAt:"2026-11-09T00:00:00Z",source:{fileName:"image.png",width:500,height:500,fileSize:10000},
    extractedMetrics:{dominantSymmetry:6,confidence:.71,ringCount:4},
    renderControls:{frequency:432,symmetry:12,amplitude:0.7},
    allowedClaim:"This is an image-derived reconstruction hint, not measured 3D proof.",
    blockedClaim:"A single flat image proves a hidden physical torus or universal code.",secret:{embedded:"private"}},
  elementReceipt:{id:"esa_v1_6_abcd1234",schema:"phi369.element_spiral_atlas.receipt.v1",
    createdBy:"PHI369 Element Spiral Atlas",payload:{version:"2.0",selectedZ:79,symbol:"Au",
      viewMode:"spiral",overlay:"atomicMass",harmonicFilter:"all",resonanceMode:"family"}},
  elementSnapshot:{id:"note_a123",schema:"phi369.element_spiral_atlas.research_snapshot.v1",
    createdAt:"2026-11-09T00:00:00Z",payload:{selectedZ:79,symbol:"Au",overlay:"atomicMass",
      viewMode:"spiral",note:"Do not retain personal note"}},
  elementView:{app:"PHI369 Element Spiral Atlas",version:"2.0",selectedZ:79,
    selectedElement:{z:79,symbol:"Au",name:"Gold",props:{private:"Don't copy"}},
    viewMode:"spiral",overlay:"periodic",nodes:[{z:79,secret:"large export"}],
    researchNotebook:[{private:"notebook data"}]}
};
test("four inspected contract variants normalize to bounded summaries",()=>{
  for(const [type,fixture] of Object.entries(fixtures)){
    const parsed=normalizeLabReceipt(fixture);
    assert.ok(parsed.lab.length>3,type);assert.ok(parsed.boundary.length>30,type);
    assert.ok(parsed.fields.length>0,type);assert.ok(parsed.topicHints.length>0,type);
    assert.match(parsed.validation,/not authenticated/);
    const serialized=JSON.stringify(parsed);
    for(const secret of ["private","Don't copy","Do not retain personal note","large export","notebook data"])assert.ok(!serialized.includes(secret),type+" leaked "+secret);
  }
});
test("unknown or misrepresented formats are rejected",()=>{
  for(const value of [null,[],42,{},{"app":"AquaCymatics369",version:"9"},{
    ...fixtures.aqua,renderControls:{frequency:Infinity}},{...fixtures.elementView,selectedZ:80},
    {...fixtures.elementReceipt,id:"invalid"},{...fixtures.elementSnapshot,payload:{selectedZ:900}}]){
    assert.throws(()=>normalizeLabReceipt(value));
  }
});
test("source limits preserved and no unrelated data is promoted",()=>{
  assert.equal(MAX_BYTES,512*1024);
  assert.equal(normalizeLabReceipt(fixtures.aqua).fields.find(f=>f.label==="Claim class (source-declared)").value,"Inferred");
  assert.equal(normalizeLabReceipt(fixtures.elementView).classification,"visualization state");
});
test("UI requires consent and no automatic persistent storage",()=>{
  const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
  const js=readFileSync(new URL("../site/lab-bridge.js",import.meta.url),"utf8");
  for(const id of ["lab-bridge","bridge-file","bridge-preview","bridge-confirm","bridge-approve","bridge-topic","bridge-export","bridge-clear"])assert.ok(html.includes('id="'+id+'"'));
  assert.match(html,/type="module"/);assert.match(js,/confirm.checked/);
  assert.match(js,/file.arrayBuffer/);assert.match(js,/URL.createObjectURL/);assert.match(js,/TextDecoder/);
  assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|eval\(|sendBeacon|XMLHttpRequest/);
  assert.match(js,/noopener noreferrer/);
});
