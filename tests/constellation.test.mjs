import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const topics=read("../site/data/topics.json"),connections=read("../site/data/connections.json"),research=read("../site/data/research.json");
test("All 179 entries and 9 realms have stable IDs for the constellation",()=>{
  assert.equal(topics.topics.length,179);assert.equal(topics.realms.length,9);
  const ids=new Set(topics.topics.map(t=>t.id));
  assert.equal(ids.size,179);
  assert.equal(new Set(topics.realms.map(r=>r.id)).size,9);
  for(const topic of topics.topics)assert.ok(topics.realms.some(r=>r.id===topic.realm));
});
test("Only previously authored 14 provisional relations are shown as topic edges",()=>{
  const ids=new Set(topics.topics.map(t=>t.id));
  assert.equal(connections.length,14);
  for(const edge of connections){assert.ok(ids.has(edge.a));assert.ok(ids.has(edge.b));assert.equal(edge.reviewStatus,"provisional");}
});
test("All 10 research pins resolve to real dossiers and sources",()=>{
  assert.equal(research.dossiers.length,10);
  const topicsById=new Set(topics.topics.map(t=>t.id)),sources=new Set(research.sources.map(s=>s.id));
  for(const dossier of research.dossiers){assert.ok(topicsById.has(dossier.topicId));for(const sid of dossier.sourceIds)assert.ok(sources.has(sid));}
});
test("Network UI is linked, keyboard accessible and never injects user-provided HTML",()=>{
  const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
  const js=readFileSync(new URL("../site/constellation.js",import.meta.url),"utf8");
  for(const id of ["constellation","cosmos-svg","cosmos-list","cosmos-inspector","cosmos-note","cosmos-export","cosmos-realm","cosmos-search","cosmos-links","cosmos-sourced","cosmos-zoom-in","cosmos-zoom-out","cosmos-reset-view"]){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/Accessible topic index/);
  assert.match(js,/aria-pressed/);
  assert.match(js,/textContent/);
  assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|eval\(/);
  const syntax=spawnSync(process.execPath,["--check",new URL("../site/constellation.js",import.meta.url).pathname],{encoding:"utf8"});
  assert.equal(syntax.status,0,syntax.stderr);
});
test("Research packet is local-only and source URLs open safely",()=>{
  const js=readFileSync(new URL("../site/constellation.js",import.meta.url),"utf8");
  assert.match(js,/createObjectURL/);assert.match(js,/application\/json/);
  assert.match(js,/noopener noreferrer/);assert.match(js,/not uploaded/);
  assert.doesNotMatch(js,/fetch\(.*POST|XMLHttpRequest|sendBeacon/);
});
