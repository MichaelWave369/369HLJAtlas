import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const research=read("../site/data/research.json"),audit=read("../site/data/source-audit.json"),changes=read("../site/data/source-corrections.json");
test("nineteen unique audited metadata references, no invented retraction checks",()=>{
 assert.equal(audit.records.length,19);assert.equal(research.sources.length,19);
 assert.deepEqual(new Set(audit.records.map(r=>r.sourceId)),new Set(research.sources.map(s=>s.id)));
 assert.equal(audit.records.filter(r=>r.reviewState!=="not-checked").length,16);
 for(const r of audit.records){assert.equal(r.retractionCheck,"not-checked");assert.equal(r.claimEvidenceCheck,"not-independently-verified");
  if(r.reviewState==="not-checked")assert.equal(r.pageEvidenceUrl,null);else{assert.match(r.pageEvidenceUrl,/^https:\/\//);assert.ok(r.observation.length>25);}}
});
test("five traceable bibliography corrections preserve old title and publisher reference",()=>{
 assert.equal(changes.entries.length,5);
 const lookup=new Map(research.sources.map(s=>[s.id,s]));
 for(const change of changes.entries){assert.equal(change.status,"bibliography-metadata-correction-only");
 assert.notEqual(change.previousValue,change.newValue);assert.equal(lookup.get(change.sourceId).title,change.newValue);assert.match(change.evidenceUrl,/^https:\/\//);}
});
test("audit browser panel does not label bibliographic review as scientific verification",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8"),js=readFileSync(new URL("../site/source-audit.js",import.meta.url),"utf8");
 for(const id of ["source-audit","source-audit-cards","source-audit-filter","source-audit-detail","source-audit-corrections"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/not-checked/);assert.match(js,/textContent/);assert.match(js,/noopener noreferrer/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|eval\(/);
});
