/**
 * HLJ-010: Construct a claim's documentary trail from existing public registries.
 * Bibliography checks are NOT scientific verification. No source is contacted at runtime.
 */
export const TRAIL_SCHEMA="369.hlj.evidence-trail.v1";
const rec=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const unique=arr=>new Set(arr).size===arr.length;
const https=url=>typeof url==="string"&&/^https:\/\//.test(url)&&
  (()=>{try{const parsed=new URL(url);return parsed.protocol==="https:"&&!parsed.username&&!parsed.password;}catch{return false;}})();
export function validateEvidenceDatasets({verification,research,audit,sourceCorrections,claimCorrections,topics}){
 if(!rec(verification)||!Array.isArray(verification.claims)||!rec(research)||
    !Array.isArray(research.sources)||!Array.isArray(research.dossiers)||
    !Array.isArray(audit?.records)||!Array.isArray(sourceCorrections?.entries)||
    !Array.isArray(claimCorrections?.entries)||!Array.isArray(topics?.topics))
  throw new TypeError("Missing documentary registries");
 const ids=new Set(topics.topics.map(t=>t.id));
 const sources=new Map(research.sources.map(s=>[s.id,s]));
 const audits=new Map(audit.records.map(a=>[a.sourceId,a]));
 const claims=new Set(verification.claims.map(c=>c.id));
 if(!unique(verification.claims.map(c=>c.id))||!unique(research.sources.map(s=>s.id))||
    !unique(audit.records.map(a=>a.sourceId)))throw new TypeError("Duplicate documentary IDs");
 if(sources.size!==audits.size||[...sources.keys()].some(id=>!audits.has(id)))throw new TypeError("Source/audit mismatch");
 for(const s of sources.values())if(!https(s.url))throw new TypeError("Invalid source URL");
 for(const a of audit.records){
   if(!["content-matched","title-corrected","not-checked"].includes(a.reviewState)||
     a.retractionCheck!=="not-checked"||a.claimEvidenceCheck!=="not-independently-verified")
     throw new TypeError("Misleading or unknown audit status");
 }
 for(const claim of verification.claims){
   if(!ids.has(claim.topicId)||!Array.isArray(claim.sourceLinks)||claim.sourceLinks.length<1||
      claim.reviewStatus!=="awaiting-primary-source-check"||claim.provenanceState!=="catalog-references-only")
      throw new TypeError("Unreviewed claim misclassified or missing topic");
   const links=claim.sourceLinks.map(l=>l.sourceId);
   if(!unique(links)||links.some(id=>!sources.has(id)))throw new TypeError("Invalid linked sources");
   if(claim.sourceLinks.some(l=>!Object.hasOwn(verification.sourceRoleDefinitions,l.role)))throw new TypeError("Unknown relationship role");
 }
 for(const change of sourceCorrections.entries){
   if(!sources.has(change.sourceId)||!https(change.evidenceUrl)||change.status!=="bibliography-metadata-correction-only"||
      sources.get(change.sourceId).title!==change.newValue)throw new TypeError("Unreconciled bibliography correction");
 }
 for(const change of claimCorrections.entries)if(!claims.has(change.claimId))throw new TypeError("Correction linked to missing claim");
 return true;
}
export function buildEvidenceTrail(claimId,sets){
 validateEvidenceDatasets(sets);
 const {verification,research,audit,sourceCorrections,claimCorrections,topics}=sets;
 const claim=verification.claims.find(c=>c.id===claimId);
 if(!claim)throw new RangeError("Unknown claim ID");
 const topic=topics.topics.find(t=>t.id===claim.topicId);
 const sources=new Map(research.sources.map(s=>[s.id,s]));
 const audits=new Map(audit.records.map(a=>[a.sourceId,a]));
 const rows=claim.sourceLinks.map(link=>{
   const s=sources.get(link.sourceId),a=audits.get(link.sourceId);
   const fixes=sourceCorrections.entries.filter(c=>c.sourceId===link.sourceId).map(c=>({
     id:c.id,date:c.date,field:c.field,previousValue:c.previousValue,newValue:c.newValue,
     reason:c.reason,evidenceUrl:c.evidenceUrl,status:c.status
   }));
   return {sourceId:s.id,title:s.title,publisher:s.publisher,kind:s.kind,year:s.year??null,url:s.url,
     relationship:link.role,relationshipDefinition:verification.sourceRoleDefinitions[link.role],
     relationshipNote:link.note,
     audit:{reviewState:a.reviewState,observedOn:a.observedOn,method:a.method,
       observation:a.observation,retractionCheck:a.retractionCheck,
       claimEvidenceCheck:a.claimEvidenceCheck},
     bibliographyCorrections:fixes};
 });
 const claimEdits=claimCorrections.entries.filter(c=>c.claimId===claimId);
 const pending=new Set();
 if(rows.some(x=>x.audit.reviewState==="not-checked"))pending.add("Some references have not received even a limited content/title inspection.");
 pending.add("No linked source has been cleared through a retraction/correction registry.");
 pending.add("No source-to-claim scientific support has been independently adjudicated.");
 pending.add("Editorial claim status still requires primary-source review.");
 return {
   schema:TRAIL_SCHEMA,claimId:claim.id,topicId:claim.topicId,topicTitle:topic.title,
   statement:claim.statement,scopeLimit:claim.scopeLimit,reviewQuestion:claim.reviewQuestion,
   publicReviewStatus:claim.reviewStatus,sourceRelationshipState:claim.provenanceState,
   sourceCount:rows.length,limitedMetadataChecks:rows.filter(x=>x.audit.reviewState!=="not-checked").length,
   sourceRows:rows,claimCorrections:claimEdits,
   openChecks:[...pending],
   conclusion:"Documentary index only. Not independent scientific validation, source authentication or a retraction clearance."
 };
}
export function makeTrailExport(trail,createdAt){
 if(!rec(trail)||trail.schema!==TRAIL_SCHEMA||typeof trail.claimId!=="string"||
    !Array.isArray(trail.sourceRows)||!Array.isArray(trail.openChecks))throw new TypeError("Invalid trail");
 if(typeof createdAt!=="string"||createdAt.length>40||Number.isNaN(Date.parse(createdAt)))throw new TypeError("Invalid timestamp");
 return {
   schema:"369.hlj.evidence-trail-export.v1",createdAt,
   purpose:"Portable citation and review-question index, not verified experimental data.",
   evidenceStatus:"UNVERIFIED_CATALOG_REFERENCES",privacy:"User-triggered local browser export; not uploaded or stored by HLJ Atlas; no account required.",
   trail
 };
}
