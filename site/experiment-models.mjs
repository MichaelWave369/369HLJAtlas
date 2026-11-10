
/**
 * HLJ-006 — Guided, deterministic educational experiment engine.
 * Outputs are a mathematical calculation or a toy model, NOT measured lab data.
 * Zero external dependencies, no network or storage APIs.
 */
export const PROTOCOLS=Object.freeze([
  {
    id:"standing-waves",
    title:"Standing-Wave Studio",
    lens:"Physical model",
    topicIds:["cymatics","harmonics","acoustic-resonance"],
    sourceIds:["ucsc-chladni","smithsonian-chladni"],
    question:"How do string length and harmonic number affect an ideal standing-wave frequency?",
    method:"Ideal 1D string with fixed endpoints and fixed wave speed 120 m/s; no damping or material dispersion.",
    challenge:"Predict how the frequency changes if the string length doubles while the mode stays the same.",
    controls:"Choose length from 0.5 to 3.0 meters and mode number 1 to 6.",
    boundary:"A 1D string model does not reproduce a Chladni plate, document an actual acoustic measurement, or establish healing effects.",
    nextTest:"For real equipment, calibrate length, wave speed, frequency, tension and boundary conditions; compare predicted nodes with recorded ones.",
    defaults:{lengthMeters:1,mode:2}
  },
  {
    id:"platonic-solids",
    title:"Five Solids, One Invariant",
    lens:"Mathematical proof",
    topicIds:["platonic-solids","sacred-geometry"],
    sourceIds:["mathworld-solids"],
    question:"Do all five convex regular polyhedra satisfy Euler's V − E + F = 2?",
    method:"Compare exact vertex, edge and face counts for the five convex Platonic solids.",
    challenge:"Predict the result of V − E + F before revealing a new solid.",
    controls:"Choose one of the five convex regular polyhedra.",
    boundary:"This is a mathematical identity for convex polyhedra, not evidence that geometric motifs produce physical forces.",
    nextTest:"Reconstruct each solid and count vertices, edges and faces; compare to the general Euler characteristic of convex polyhedra.",
    defaults:{solid:"cube"}
  },
  {
    id:"chance-null-model",
    title:"Chance & the Null Model",
    lens:"Statistical simulation",
    topicIds:["telepathy","psi-phenomena","extrasensory-perception"],
    sourceIds:["psi-meta","psi-replication"],
    question:"How surprising can an apparent pattern be in 40 independent fair coin tosses?",
    method:"A deterministic seeded pseudorandom toy sequence models 40 independent fair tosses. Two-sided exact binomial tails quantify outcomes at least as extreme as the observed head count.",
    challenge:"Predict whether the run will show 20 heads or a noticeably unequal split before clicking Run.",
    controls:"Choose an integer seed between 1 and 9999; every seed reproduces the same toy sequence.",
    boundary:"This is not a psychic experiment, hardware randomness, evidence of telepathy, or a finding about human participants. The linked psi studies are context for research design, not proof of coin-toss claims.",
    nextTest:"Study pre-registration, secure randomization, blinding, independence and replication before interpreting any real dataset.",
    defaults:{seed:369}
  }
]);
const solids=Object.freeze({
 tetrahedron:{name:"Tetrahedron",vertices:4,edges:6,faces:4,faceKind:"equilateral triangles"},
 cube:{name:"Cube",vertices:8,edges:12,faces:6,faceKind:"squares"},
 octahedron:{name:"Octahedron",vertices:6,edges:12,faces:8,faceKind:"equilateral triangles"},
 dodecahedron:{name:"Dodecahedron",vertices:20,edges:30,faces:12,faceKind:"regular pentagons"},
 icosahedron:{name:"Icosahedron",vertices:12,edges:30,faces:20,faceKind:"equilateral triangles"}
});
export const SOLIDS=solids;
const assertNumber=(value,min,max,name)=>{
  if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new RangeError("Invalid "+name);
  return value;
};
const assertInteger=(value,min,max,name)=>{
  assertNumber(value,min,max,name);if(!Number.isInteger(value))throw new RangeError("Expected integer "+name);return value;
};
export function standingWaves(config){
  if(!config||typeof config!=="object")throw new TypeError("Missing standing-wave configuration");
  const L=assertNumber(config.lengthMeters,.5,3,"length (m)");
  const n=assertInteger(config.mode,1,6,"harmonic number");
  const v=120;
  const frequencyHz=n*v/(2*L);
  const nodePositions=Array.from({length:n+1},(_,i)=>Number((i*L/n).toFixed(4)));
  const antinodePositions=Array.from({length:n},(_,i)=>Number(((i+.5)*L/n).toFixed(4)));
  const plot=Array.from({length:121},(_,i)=>({x:i/120,y:Math.sin(n*Math.PI*i/120)}));
  return {
    protocolId:"standing-waves",method:"ideal-1D-fixed-string",kind:"computed-model",
    inputs:{lengthMeters:L,mode:n,waveSpeedMetersPerSecond:v},
    outputs:{frequencyHz:Number(frequencyHz.toFixed(5)),wavelengthMeters:Number((2*L/n).toFixed(5)),
      nodePositionsMeters:nodePositions,antinodePositionsMeters:antinodePositions,
      sampleWave:plot},
    summary:"Mode "+n+" on a "+L.toFixed(1)+" m ideal string gives "+Number(frequencyHz.toFixed(3))+" Hz with fixed 120 m/s wave speed.",
    limitation:"Calculated stationary 1D mode, not a measured plate, audio signal, or therapeutic effect."
  };
}
export function platonicSolid(config){
  const key=config?.solid;
  if(typeof key!=="string"||!Object.hasOwn(solids,key))throw new RangeError("Unknown convex Platonic solid");
  const s=solids[key],euler=s.vertices-s.edges+s.faces;
  return {
    protocolId:"platonic-solids",method:"exact-polyhedron-count",kind:"mathematical-computation",
    inputs:{solid:key},outputs:{name:s.name,vertices:s.vertices,edges:s.edges,faces:s.faces,faceKind:s.faceKind,eulerCharacteristic:euler},
    summary:s.name+": "+s.vertices+" vertices − "+s.edges+" edges + "+s.faces+" faces = "+euler+".",
    limitation:"Combinatorial property of convex solids, not proof of a physical or therapeutic mechanism."
  };
}
function seededRandom(seed){
  let x=(seed|0)>>>0;
  return ()=>{
    x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;
  };
}
export function binomialTwoSidedProbability(heads,n){
  assertInteger(n,1,60,"number of trials");assertInteger(heads,0,n,"head count");
  const threshold=Math.abs(heads-n/2);
  let probability=0,term=Math.pow(.5,n);
  for(let k=0;k<=n;k++){
    if(Math.abs(k-n/2)+1e-10>=threshold)probability+=term;
    if(k<n)term*=((n-k)/(k+1));
  }
  return Math.min(1,Math.max(0,probability));
}
export function chanceNullModel(config){
  const seed=assertInteger(config?.seed,1,9999,"seed");
  const random=seededRandom(seed),flips=Array.from({length:40},()=>random()<.5?"H":"T");
  const heads=flips.filter(x=>x==="H").length,tails=40-heads;
  const pTwoSided=binomialTwoSidedProbability(heads,40);
  return {
    protocolId:"chance-null-model",method:"seeded-pseudorandom-fair-coin-toy",kind:"toy-null-simulation",
    inputs:{seed,trials:40,headsProbability:.5},
    outputs:{heads,tails,pTwoSided:Number(pTwoSided.toFixed(10)),flips},
    summary:"Seed "+seed+" produced "+heads+" heads / "+tails+" tails in 40 pseudorandom toy tosses. Two-sided null-tail probability: "+pTwoSided.toFixed(4)+".",
    limitation:"Pseudorandom toy output. The p-value is not the probability that a hypothesis is true or false, nor proof of psychic effects."
  };
}
export function simulate(id,config){
  if(id==="standing-waves")return standingWaves(config);
  if(id==="platonic-solids")return platonicSolid(config);
  if(id==="chance-null-model")return chanceNullModel(config);
  throw new RangeError("Unknown protocol");
}
const boundedText=(x,limit,label)=>{
  if(typeof x!=="string"||!x.trim()||x.trim().length>limit)throw new TypeError("Invalid "+label);
  return x.trim();
};
export function makeNotebookEntry({run,prediction,observation,alternative,createdAt}){
  if(!run||!PROTOCOLS.some(p=>p.id===run.protocolId))throw new TypeError("Unrecognized run");
  const stamp=boundedText(createdAt,50,"timestamp");
  if(!Number.isFinite(Date.parse(stamp)))throw new TypeError("Invalid timestamp");
  const safe={...run,outputs:{...run.outputs}};
  if(safe.outputs.sampleWave)delete safe.outputs.sampleWave;
  return {schema:"369.hlj.educational-run.v1",protocolId:run.protocolId,createdAt:stamp,
    prediction:boundedText(prediction,500,"prediction"),
    observation:boundedText(observation,1500,"observation"),
    alternative:boundedText(alternative,1500,"alternative explanation"),
    result:safe,
    claimStatus:"EDUCATIONAL MODEL ONLY - NOT MEASURED EVIDENCE"};
}
export function makeNotebookExport(entries,time){
  if(!Array.isArray(entries)||entries.length>12)throw new RangeError("Maximum twelve educational runs");
  const timestamp=boundedText(time,50,"timestamp");
  if(!Number.isFinite(Date.parse(timestamp)))throw new TypeError("Invalid timestamp");
  for(const e of entries)if(e?.schema!=="369.hlj.educational-run.v1")throw new TypeError("Unrecognized notebook entry");
  return {schema:"369.hlj.educational-notebook.v1",createdAt:timestamp,
    scope:"Explicitly saved user-authored observations and deterministic educational computations; no real-world measurements.",
    privacy:"Generated locally on request; not uploaded or saved by HLJ Atlas.",
    records:entries};
}
