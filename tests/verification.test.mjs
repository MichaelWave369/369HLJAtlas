
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {validateReviewRegistry,makeReviewProposal,createReviewPacket} from "../site/verification-engine.mjs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const claims=read("../site/data/verification.json"),corrections=read("../site/data/corrections.json"),
 topics=read("../site/data/topics.json"),research=read("../site/data/research.json");
test("Ten unique narrowly scoped claims link valid topics and source records, no verdict claims",()=>{
 assert.equal(validateReviewRegistry(claims,topics,research,corrections),true);
 assert.equal(claims.claims.length,10);
 assert.equal(new Set(claims.claims.map(c=>c.topicId)).size,10);
 assert.ok(claims.claims.every(c=>c.reviewStatus==="awaiting-primary-source-check"));
 const ids=new Set(claims.claims.map(c=>c.id));assert.equal(ids.size,10);
});
test("All nineteen catalogued sources remain reference metadata, not certified observations",()=>{
 assert.equal(research.sources.length,19);
 assert.equal(claims.state,"OPEN_REVIEW_QUEUE_NOT_AUTHORITY");
 assert.ok(claims.summary.includes("not that its URL has been freshly checked"));
 assert.equal(corrections.entries.length,0);
 assert.match(corrections.notice,/not imply/);
});
test("Distinct-paradigm ESP source cannot be misreported as a direct replication",()=>{
 const claim=claims.claims.find(c=>c.topicId==="telepathy");
 assert.equal(claim.sourceLinks.find(s=>s.sourceId==="psi-replication").role,"distinct-protocol");
 assert.match(claim.scopeLimit,/different ESP paradigm/);
});
test("Reviewer explicitly acknowledges source inspection and supplies a limitation",()=>{
 const claim=claims.claims[0],args={claim,sourceId:claim.sourceLinks[0].sourceId,
  assessment:"needs-more-evidence",inspectionAcknowledged:true,
  reviewNotes:"I checked the methods summary; the assumptions need corroboration.",
  limitations:"The apparatus and source controls remain unclear.",
  correctionRequest:"Qualify the source attribution.",
  createdAt:"2026-11-09T23:00:00Z"};
 const p=makeReviewProposal(args);
 assert.equal(p.status,"LOCAL_PROPOSAL_NOT_PUBLISHED");
 assert.equal(p.claimId,claim.id);assert.equal(p.inspectionAcknowledged,true);
 assert.throws(()=>makeReviewProposal({...args,inspectionAcknowledged:false}));
 assert.throws(()=>makeReviewProposal({...args,sourceId:"source-not-in-ledger"}));
 assert.throws(()=>makeReviewProposal({...args,assessment:"verified-science"}));
 assert.throws(()=>makeReviewProposal({...args,reviewNotes:"short"}));
 assert.throws(()=>makeReviewProposal({...args,limitations:"too short"}));
 const packet=createReviewPacket([p],"2026-11-09T23:01:00Z");
 assert.equal(packet.publicationState,"UNPUBLISHED_LOCAL_SUGGESTIONS");
 assert.match(packet.privacy,/not uploaded/);
 assert.throws(()=>createReviewPacket(Array(21).fill(p),"2026-11-09T23:00:00Z"));
});
test("Registry integrity test detects forged statuses and undocumented links",()=>{
 const copy=()=>JSON.parse(JSON.stringify(claims));
 let v=copy();v.claims[0].reviewStatus="verified";assert.throws(()=>validateReviewRegistry(v,topics,research,corrections));
 v=copy();v.claims[0].sourceLinks[0].sourceId="imaginary-study";
 assert.throws(()=>validateReviewRegistry(v,topics,research,corrections));
 v=copy();v.claims[1].id=v.claims[0].id;assert.throws(()=>validateReviewRegistry(v,topics,research,corrections));
});
test("Browser review workflow offers accessible controls, safe source links and no silent persistence",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8"),
 js=readFileSync(new URL("../site/verification.js",import.meta.url),"utf8");
 for(const id of ["verification","verification-root","verification-cards","verify-source-choice","verify-notes",
  "verify-attestation","verify-capture","verify-export","verify-clear","verify-correction-history","verify-assessment"])
 assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(js,/aria-pressed/);assert.match(js,/noopener noreferrer/);assert.match(js,/textContent/);
 assert.match(js,/createObjectURL/);assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|sendBeacon|XMLHttpRequest|eval\(/);
 assert.equal(spawnSync(process.execPath,["--check",new URL("../site/verification.js",import.meta.url).pathname],{encoding:"utf8"}).status,0);
});
