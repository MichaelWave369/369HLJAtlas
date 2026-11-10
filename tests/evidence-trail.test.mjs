import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {validateEvidenceDatasets,buildEvidenceTrail,makeTrailExport} from "../site/evidence-trail.mjs";
const load=name=>JSON.parse(readFileSync(new URL("../site/data/"+name+".json",import.meta.url),"utf8"));
const sets={verification:load("verification"),research:load("research"),audit:load("source-audit"),
 sourceCorrections:load("source-corrections"),claimCorrections:load("corrections"),topics:load("topics")};
test("All claim chains resolve source and topic IDs without upgrading evidence",()=>{
 assert.equal(validateEvidenceDatasets(sets),true);
 assert.equal(sets.verification.claims.length,10);
 const seen=new Set();
 for(const claim of sets.verification.claims){
   const trail=buildEvidenceTrail(claim.id,sets);seen.add(trail.topicId);
   assert.equal(trail.publicReviewStatus,"awaiting-primary-source-check");
   assert.equal(trail.sourceRelationshipState,"catalog-references-only");
   assert.equal(trail.sourceRows.length,claim.sourceLinks.length);
   assert.equal(trail.sourceCount,trail.sourceRows.length);
   assert.ok(trail.openChecks.some(x=>x.includes("retraction")));
   assert.ok(trail.sourceRows.every(r=>r.audit.retractionCheck==="not-checked"&&r.audit.claimEvidenceCheck==="not-independently-verified"));
 }
 assert.equal(seen.size,10);
});
test("Corrected source titles and old/new corrections stay attached to correct claims",()=>{
 const quartz=buildEvidenceTrail("claim-02",sets);
 assert.equal(quartz.sourceRows.length,2);
 const nist=quartz.sourceRows.find(x=>x.sourceId==="nist-quartz");
 assert.ok(nist.title.includes("Q to Ra"));
 assert.equal(nist.bibliographyCorrections.length,1);
 assert.notEqual(nist.bibliographyCorrections[0].previousValue,nist.bibliographyCorrections[0].newValue);
 const psi=buildEvidenceTrail("claim-09",sets);
 assert.equal(psi.sourceRows.find(x=>x.sourceId==="psi-replication").relationship,"distinct-protocol");
 const water=buildEvidenceTrail("claim-08",sets);
 assert.equal(water.sourceRows.length,3);
 assert.ok(water.sourceRows.some(x=>x.audit.reviewState==="not-checked"));
});
test("Malformed or forged evidence status and orphan sources fail closed",()=>{
 const clone=()=>JSON.parse(JSON.stringify(sets));
 const cases=[
   s=>s.audit.records[0].retractionCheck="cleared",
   s=>s.verification.claims[0].reviewStatus="verified-science",
   s=>s.verification.claims[0].sourceLinks[0].sourceId="fake",
   s=>s.research.sources[0].url="javascript:alert(1)",
   s=>s.sourceCorrections.entries[0].newValue="fabricated title",
   s=>s.audit.records.splice(0,1)
 ];
 for(const mut of cases){const s=clone();mut(s);assert.throws(()=>validateEvidenceDatasets(s));}
 assert.throws(()=>buildEvidenceTrail("missing",sets));
});
test("Trail export is explicit metadata only with caution intact",()=>{
 const trail=buildEvidenceTrail("claim-01",sets);
 const p=makeTrailExport(trail,"2026-11-09T23:00:00Z");
 assert.equal(p.evidenceStatus,"UNVERIFIED_CATALOG_REFERENCES");
 assert.equal(p.trail.claimId,"claim-01");
 assert.match(p.privacy,/not uploaded/);
 assert.throws(()=>makeTrailExport(trail,"not-a-date"));
});
test("UI has share, source audit and dossier links without extra top-bar items",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 const script=readFileSync(new URL("../site/evidence-trail.js",import.meta.url),"utf8");
 for(const id of ["evidence-trail","trail-source-list","trail-gaps","trail-bib-count","trail-dossier-link","trail-review-link","trail-permalink","trail-export"])
   assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(script,/noopener noreferrer/);assert.match(script,/textContent/);
 assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage|eval\(/);
 assert.equal(spawnSync(process.execPath,["--check",new URL("../site/evidence-trail.js",import.meta.url).pathname],{encoding:"utf8"}).status,0);
 assert.equal((html.split('<nav class="site-nav"')[1].split("</nav>")[0].match(/href="#evidence-trail"/g)||[]).length,0);
});
