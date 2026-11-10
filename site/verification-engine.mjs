
/** HLJ-007: review proposal validation. No model automatically awards truth or changes repository data. */
export const PROPOSAL_SCHEMA="369.hlj.review-proposal.v1";
export const PACKET_SCHEMA="369.hlj.review-packet.v1";
const categoryRoles=new Set(["reports","background","qualifies","distinct-protocol"]);
const judgementTypes=new Set(["source-aligned","needs-more-evidence","concerns-raised","not-applicable"]);
const text=(value,max,min=1)=>{
 if(typeof value!=="string"||value.trim().length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))
 throw new TypeError("Invalid review text");
 return value.trim();
};
const timestamp=value=>{if(typeof value!=="string"||value.length>40||Number.isNaN(Date.parse(value)))throw new TypeError("Invalid review date");return value;};
export function validateReviewRegistry(data,catalog,research,corrections){
 if(!data||data.schemaVersion!==1||data.state!=="OPEN_REVIEW_QUEUE_NOT_AUTHORITY"||!Array.isArray(data.claims)||data.claims.length!==10)
  throw new TypeError("Unrecognized claim review dataset");
 const topicIds=new Set(catalog?.topics?.map(t=>t.id)),sources=new Set(research?.sources?.map(s=>s.id)),
 dossierIds=new Set(research?.dossiers?.map(d=>d.topicId)),seen=new Set();
 for(const c of data.claims){
   if(typeof c.id!=="string"||seen.has(c.id)||!topicIds.has(c.topicId)||!dossierIds.has(c.topicId))
    throw new TypeError("Duplicated or unknown claim");
   seen.add(c.id);
   if(c.reviewStatus!=="awaiting-primary-source-check"||c.provenanceState!=="catalog-references-only")
    throw new TypeError("Unsupported public review status");
   for(const key of ["statement","category","scopeLimit","reviewQuestion","editorialNotes"]){if(!text(c[key],1600,10))throw new TypeError("Claim missing "+key);}
   if(!Array.isArray(c.sourceLinks)||!c.sourceLinks.length)throw new TypeError("Claim needs linked source reference");
   const perClaim=new Set();
   for(const l of c.sourceLinks){
     if(!sources.has(l.sourceId)||perClaim.has(l.sourceId)||!categoryRoles.has(l.role))throw new TypeError("Unknown source relationship");
     text(l.note,400,10);perClaim.add(l.sourceId);
   }
 }
 if(!corrections||corrections.schemaVersion!==1||!Array.isArray(corrections.entries))throw new TypeError("Malformed correction ledger");
 for(const entry of corrections.entries){
  if(!seen.has(entry.claimId))throw new TypeError("Correction references unknown claim");
  text(entry.date,40);text(entry.change,1000,15);
  text(entry.reason,2000,15);
 }
 return true;
}
export function makeReviewProposal({claim,sourceId,assessment,inspectionAcknowledged,reviewNotes,limitations,correctionRequest,createdAt}){
 if(!claim||typeof claim.id!=="string"||!Array.isArray(claim.sourceLinks)||!claim.sourceLinks.some(s=>s.sourceId===sourceId))
  throw new TypeError("Unknown claim/source relationship");
 if(!judgementTypes.has(assessment))throw new TypeError("Invalid review assessment");
 if(inspectionAcknowledged!==true)throw new TypeError("Review requires explicit source inspection acknowledgement");
 const proposal={
   schema:PROPOSAL_SCHEMA,
   claimId:claim.id,topicId:claim.topicId,sourceId,assessment,
   createdAt:timestamp(createdAt),
   reviewNotes:text(reviewNotes,1800,20),limitations:text(limitations,1800,15),
   correctionRequest:typeof correctionRequest==="string"&&correctionRequest.trim()?text(correctionRequest,800):null,
   inspectionAcknowledged:true,
   status:"LOCAL_PROPOSAL_NOT_PUBLISHED",
   truthBoundary:"Self-reported source inspection, not authentication, peer review, scientific verification or an update to the public Atlas."
 };
 return proposal;
}
export function createReviewPacket(proposals,createdAt){
 if(!Array.isArray(proposals)||proposals.length>20)throw new RangeError("At most twenty local proposals");
 const stamp=timestamp(createdAt);
 for(const p of proposals){
  if(p?.schema!==PROPOSAL_SCHEMA||p.status!=="LOCAL_PROPOSAL_NOT_PUBLISHED"||!judgementTypes.has(p.assessment)
     ||p.inspectionAcknowledged!==true||typeof p.reviewNotes!=="string"||typeof p.limitations!=="string")throw new TypeError("Invalid review proposal");
 }
 return {schema:PACKET_SCHEMA,createdAt:stamp,publicationState:"UNPUBLISHED_LOCAL_SUGGESTIONS",
  privacy:"Exported only after a user click; not uploaded, stored, merged or adopted by HLJ Atlas.",
  process:"A qualified human editor must inspect original sources, assess contrary evidence, and review a GitHub PR before any public verdict changes.",
  proposals};
}
