/**
 * 369 HLJ Atlas, HLJ-005: passive learning scene for the existing PhiOS XR consumer.
 * Schema constraints checked against PhiOS-XR/src/spatial-scene.ts and
 * PhiXRCommons/src/spacedynamics/scene-interchange.js on 2026-11-09.
 * Rendering categories and topic markers are synthetic illustration, not measured fields.
 */
export const SCHEMA="phi.spatial.scene.v1";
export const TRUTH="UNVERIFIED_VISUALIZATION_ONLY";
export const COORDINATES=Object.freeze({handedness:"right",upAxis:"Y",unit:"meter",origin:"illustrative-local"});
export const MAX_SCENE_BYTES=96000;
const clean=(value,max)=>typeof value==="string"&&value.trim().length>0&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value);
const exact=(obj,keys)=>obj&&typeof obj==="object"&&!Array.isArray(obj)&&Object.keys(obj).length===keys.length&&Object.keys(obj).every(k=>keys.includes(k));
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const topicKey=t=>t.id.replace(/[^a-z0-9_-]/g,"").slice(0,44);
const rounded=n=>Number(n.toFixed(3));
export function createLearningScene(catalog,research){
  if(!catalog||!Array.isArray(catalog.realms)||!Array.isArray(catalog.topics)||!research||!Array.isArray(research.dossiers))throw new TypeError("Missing catalog or research dossiers");
  if(catalog.realms.length!==9||research.dossiers.length!==10)throw new TypeError("Expected nine curated realms and ten dossiers");
  const ids=new Set(catalog.topics.map(t=>t.id));
  const nodes=[];
  catalog.realms.forEach((realm,i)=>{
    const theta=-Math.PI/2+i*2*Math.PI/9;
    nodes.push({id:"realm-"+topicKey(realm),kind:"sphere",label:("Realm "+String(i+1).padStart(2,"0")+" · "+realm.name).slice(0,90),
      position:{x:rounded(Math.cos(theta)*3.4),y:2.8,z:rounded(Math.sin(theta)*3.4)},radius:.38,metadata:null});
  });
  research.dossiers.forEach((d,i)=>{
    if(!ids.has(d.topicId))throw new TypeError("Unknown research topic "+d.topicId);
    const topic=catalog.topics.find(t=>t.id===d.topicId);
    const theta=-Math.PI/2+(i+.5)*2*Math.PI/10;
    nodes.push({id:"research-"+topicKey(topic),kind:"evidence-marker",label:("Research: "+topic.title).slice(0,90),
      position:{x:rounded(Math.cos(theta)*4.7),y:1.4,z:rounded(Math.sin(theta)*4.7)},radius:.18,
      metadata:{kind:"synthetic",unit:"index",value:i+1,uncertainty:null,source:"369 HLJ Atlas editorial catalog",
        sourceUrl:null,method:"Synthetic numbered display marker, not a scientific measurement or claim"}});
  });
  const scene={schema:SCHEMA,truth:TRUTH,creator:"hlj-atlas",title:"369 HLJ Atlas Learning Constellation",
    coordinateFrame:{...COORDINATES},nodes};
  return validatePassiveScene(scene);
}
export function validatePassiveScene(scene){
  if(!exact(scene,["schema","truth","creator","title","coordinateFrame","nodes"])||
   scene.schema!==SCHEMA||scene.truth!==TRUTH||!clean(scene.creator,48)||!/^[a-z][a-z0-9-]{1,47}$/.test(scene.creator)||
   !clean(scene.title,80)||!exact(scene.coordinateFrame,["handedness","upAxis","unit","origin"])||
   Object.keys(COORDINATES).some(k=>scene.coordinateFrame[k]!==COORDINATES[k])||
   !Array.isArray(scene.nodes)||scene.nodes.length>120)throw new TypeError("Invalid passive scene root");
  const ids=new Set();
  for(const n of scene.nodes){
    if(!exact(n,["id","kind","label","position","radius","metadata"])||!clean(n.id,48)||
      !/^[a-z][a-z0-9_-]{0,47}$/.test(n.id)||ids.has(n.id)||!["sphere","evidence-marker"].includes(n.kind)||
      !clean(n.label,90)||!finite(n.radius)||n.radius<.05||n.radius>1||
      !exact(n.position,["x","y","z"])||!["x","y","z"].every(k=>finite(n.position[k]))||
      Math.abs(n.position.x)>6.1||Math.abs(n.position.z)>6.1||n.position.y<-.1||n.position.y>8.1)throw new TypeError("Invalid passive node");
    ids.add(n.id);
    if(n.kind==="sphere"&&n.metadata!==null)throw new TypeError("Sphere cannot contain provenance");
    if(n.kind==="evidence-marker"){
      const m=n.metadata;
      if(!exact(m,["kind","unit","value","uncertainty","source","sourceUrl","method"])||
         !["synthetic","reported-measurement","model-output","hypothesis"].includes(m.kind)||
         !clean(m.unit,24)||!/^[a-zA-Z0-9 °%/^._-]+$/.test(m.unit)||
         !finite(m.value)||Math.abs(m.value)>1e9||
         (m.uncertainty!==null&&(!finite(m.uncertainty)||m.uncertainty<0||m.uncertainty>1e9))||
         !clean(m.source,180)||!clean(m.method,240))throw new TypeError("Invalid evidence marker metadata");
      if(m.sourceUrl!==null){
        if(!clean(m.sourceUrl,500))throw new TypeError("Invalid source URL");
        const url=new URL(m.sourceUrl);
        if(url.href!==m.sourceUrl||url.protocol!=="https:"||url.username||url.password||url.hash)throw new TypeError("Unsafe source URL");
      }else if(m.kind==="reported-measurement")throw new TypeError("Reported measurement needs source URL");
    }
  }
  const encoded=new TextEncoder().encode(JSON.stringify(scene,null,2));
  if(encoded.length>MAX_SCENE_BYTES)throw new RangeError("Passive scene exceeds 96 KB");
  return scene;
}
export function serializeLearningScene(scene){validatePassiveScene(scene);return JSON.stringify(scene,null,2);}
