
/**
 * HLJ-004: explicit allowlist for external, untrusted laboratory export shapes.
 * These are descriptive snapshots, NEVER independent experimental measurements.
 */
export const MAX_BYTES = 512 * 1024;
const isRecord = x => x !== null && typeof x === "object" && !Array.isArray(x);
const short = (x,max=100) => typeof x === "string" && x.length>0 && x.length<=max ? x : null;
const safeText = (x,max=220) => typeof x === "string" ? x.slice(0,max).replace(/[\u0000-\u001f\u007f]/g," ") : null;
const finiteNumber = (x,min=-Infinity,max=Infinity) => typeof x==="number" && Number.isFinite(x) && x>=min && x<=max ? x : null;
const asValue = (x,max=70) => typeof x==="string" ? safeText(x,max) : typeof x==="number" && Number.isFinite(x) ? String(x) : typeof x==="boolean" ? String(x) : null;
const field = (label,value) => value==null ? null : {label,value:asValue(value)};
const eligible = (...xs) => xs.filter(Boolean);
const make = (lab,format,classification,description,sourceClaim,boundary,fields,topicHints,version) => ({
  lab,format,classification,description,sourceClaim,boundary,fields:fields.filter(x=>x&&x.value!==null),topicHints,version,
  validation:"Shape checked against source contract; source identity and reported values not authenticated."
});
function aqua(r){
  if(r.app!=="AquaCymatics369"||r.version!=="0.2-image-reconstruction-lane"||!isRecord(r.renderControls))throw new Error("Unsupported AquaCymatics receipt contract.");
  if(!["Simulated","Inferred","Measured","Artistic"].includes(r.claimClass))throw new Error("Invalid AquaCymatics claim class.");
  if(!short(r.allowedClaim,900)||!short(r.blockedClaim,900))throw new Error("Missing or excessive claim boundaries.");
  const controls=r.renderControls,m=r.extractedMetrics;
  if(m!==null&&m!==undefined&&!isRecord(m))throw new Error("Malformed reconstruction metrics.");
  if(r.source!=="procedural oscillator only"&&!isRecord(r.source))throw new Error("Unsupported source descriptor.");
  const freq=controls.frequency===undefined?null:finiteNumber(controls.frequency,0,22000);
  if(controls.frequency!==undefined&&freq===null)throw new Error("Invalid oscillator frequency.");
  const sym=controls.symmetry===undefined?null:finiteNumber(controls.symmetry,0,1000);
  if(controls.symmetry!==undefined&&sym===null)throw new Error("Invalid symmetry control.");
  const confidence=m?.confidence===undefined?null:finiteNumber(m.confidence,0,1);
  if(m&&m.confidence!==undefined&&confidence===null)throw new Error("Invalid confidence metric.");
  const observed=eligible(field("Claim class (source-declared)",r.claimClass),field("Frequency (Hz)",freq),
    field("Symmetry control",sym),field("Image-derived confidence",confidence),
    field("Source mode",r.source==="procedural oscillator only"?"Procedural oscillator":"Image-derived hint"));
  return make("AquaCymatics369","AquaCymatics reconstruction receipt","simulation or inference","Procedural field or image-derived reconstruction hint.",safeText(r.allowedClaim,300),
    "The receipt describes visualization and reconstruction settings. It does not authenticate a physical experiment or verify therapeutic effects. Producer-provided blocked claim: "+safeText(r.blockedClaim,200),
    observed,["cymatics","resonance"],r.version);
}
function elementReceipt(r){
  if(r.schema!=="phi369.element_spiral_atlas.receipt.v1"||r.createdBy!=="PHI369 Element Spiral Atlas"||!isRecord(r.payload)||r.payload.version!=="2.0")throw new Error("Unsupported Element Spiral receipt contract.");
  if(!short(r.id,120)||!r.id.startsWith("esa_v1_6_"))throw new Error("Invalid receipt identifier.");
  const z=r.payload.selectedZ;
  if(z!==null&&(!Number.isInteger(z)||z<1||z>120))throw new Error("Invalid atomic number.");
  return make("PHI369 Element Spiral Atlas","Element Spiral receipt v1","visualization state",
    "Exported interface state for comparative periodic and spiral projections.",
    "Interface receipt only; not an experimental chemistry or nuclear-physics claim.",
    "This receipt is a representation of app controls, not measured atomic behavior. The original source and its identifier are not authenticated.",
    eligible(field("Receipt label",r.id),field("Atomic number",z),field("Symbol",short(r.payload.symbol,12)),field("View mode",asValue(r.payload.viewMode)),field("Overlay",asValue(r.payload.overlay)),field("Resonance mode",asValue(r.payload.resonanceMode))),
    ["3-6-9-numerology","sacred-geometry"],r.payload.version);
}
function elementSnapshot(r){
  if(r.schema!=="phi369.element_spiral_atlas.research_snapshot.v1"||!isRecord(r.payload))throw new Error("Unsupported Element Spiral snapshot contract.");
  const z=r.payload.selectedZ;
  if(z!==null&&(!Number.isInteger(z)||z<1||z>120))throw new Error("Invalid snapshot element.");
  if(!short(r.id,120)||!r.id.startsWith("note_"))throw new Error("Invalid snapshot identifier.");
  return make("PHI369 Element Spiral Atlas","Element Spiral research snapshot v1","research notebook",
    "An app-authored personal research snapshot (note text is intentionally not imported).",
    "Source-declared research notebook entry.",
    "This is a user/algorithm-curated note about a visualization, not independently verified chemistry. Personal note content is deliberately discarded.",
    eligible(field("Atomic number",z),field("Symbol",short(r.payload.symbol,12)),field("Overlay",asValue(r.payload.overlay)),field("View mode",asValue(r.payload.viewMode))),
    ["3-6-9-numerology","sacred-geometry"],"1");
}
function elementView(r){
  if(r.app!=="PHI369 Element Spiral Atlas"||r.version!=="2.0"||!isRecord(r.selectedElement))throw new Error("Unsupported Element Spiral view export.");
  const e=r.selectedElement,z=e.z;
  if(!Number.isInteger(z)||z<1||z>120||r.selectedZ!==z)throw new Error("Mismatched atomic number.");
  if(!short(e.symbol,12)||!short(e.name,90))throw new Error("Invalid selected element identity.");
  return make("PHI369 Element Spiral Atlas","Element Spiral view export v2.0","visualization state",
    "Current app view of a selected element, with noncanonical spiral representation.",
    "Source-declared alternative visualization using selected element identity.",
    "An element's proximity in an experimental spiral does not demonstrate similarity in measured chemistry or nuclear physics; exported notebook notes and other raw fields are discarded.",
    eligible(field("Element",e.name),field("Symbol",e.symbol),field("Atomic number",z),field("View",asValue(r.viewMode)),field("Overlay",asValue(r.overlay))),
    ["3-6-9-numerology","sacred-geometry"],r.version);
}
export function normalizeLabReceipt(value){
  if(!isRecord(value))throw new Error("Expected one JSON object, not an array or primitive.");
  if(value.app==="AquaCymatics369")return aqua(value);
  if(value.schema==="phi369.element_spiral_atlas.receipt.v1")return elementReceipt(value);
  if(value.schema==="phi369.element_spiral_atlas.research_snapshot.v1")return elementSnapshot(value);
  if(value.app==="PHI369 Element Spiral Atlas")return elementView(value);
  throw new Error("Unrecognized laboratory format. Only documented AquaCymatics and Element Spiral exports are supported.");
}
