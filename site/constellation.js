
"use strict";
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const $ = id => document.getElementById(id);
  const txt = (tag,text,cls) => { const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n; };
  const svgEl = (tag,attrs={}) => { const n=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));return n; };
  const colors=["#aeeecf","#9dc9f6","#dfb58f","#d8b2ff","#f3a9c2","#96dccb","#f2cd8a","#b8b7ed","#b3e49d"];
  const size={w:1080,h:900,cx:540,cy:450};
  const defaultView=()=>({x:0,y:0,w:size.w,h:size.h});
  let view=defaultView(),model=null,selected=null,storedNotes=new Map(),positions=new Map(),startDrag=null;
  const byId=new Map(),byRealm=new Map(),byDossier=new Map(),bySource=new Map();
  const safeUrl = url => typeof url==="string" && /^https:\/\//.test(url);
  function showError(message){$("cosmos-visible").textContent="Unable to display map";$("cosmos-empty").hidden=false;$("cosmos-empty").textContent=message;}
  async function load(path){const response=await fetch(path);if(!response.ok)throw Error("Unable to load "+path);return response.json();}
  function positionNodes(){
    positions=new Map();const chunkAngle=(Math.PI*2)/model.realms.length;
    model.realms.forEach((realm,index)=>{
      const centerAngle=-Math.PI/2+index*chunkAngle;
      const hub={x:size.cx+245*Math.cos(centerAngle),y:size.cy+245*Math.sin(centerAngle),angle:centerAngle,color:colors[index]};
      positions.set("realm:"+realm.id,hub);
      const group=model.topics.filter(t=>t.realm===realm.id);
      group.forEach((topic,j)=>{
        const ring=Math.floor(j/16),place=j%16,total=Math.min(16,group.length-ring*16);
        const span=chunkAngle*.76,offset=(place-(total-1)/2)*span/Math.max(1,total-1);
        const angle=centerAngle+offset;
        const radius=343+ring*42;
        positions.set(topic.id,{x:size.cx+radius*Math.cos(angle),y:size.cy+radius*Math.sin(angle),color:colors[index]});
      });
    });
  }
  function currentFilter(){
    const query=$("cosmos-search").value.trim().toLocaleLowerCase(),realm=$("cosmos-realm").value,sourced=$("cosmos-sourced").checked;
    return t=>(realm==="all"||t.realm===realm)&&(!sourced||byDossier.has(t.id))&&
      (!query||t.title.toLocaleLowerCase().includes(query)||byRealm.get(t.realm).name.toLocaleLowerCase().includes(query));
  }
  function draw(){
    const predicate=currentFilter(),matching=model.topics.filter(predicate),found=new Set(matching.map(t=>t.id));
    $("cosmos-visible").textContent=matching.length+" of "+model.topics.length+" topics";
    const svg=$("cosmos-svg");svg.replaceChildren();
    const g=svgEl("g");
    for(const realm of model.realms){
      const hub=positions.get("realm:"+realm.id);const visible=model.topics.some(t=>t.realm===realm.id&&found.has(t.id));
      const path=svgEl("line",{x1:size.cx,y1:size.cy,x2:hub.x,y2:hub.y,stroke:hub.color,"stroke-width":1.8,opacity:visible?.45:.12});g.append(path);
      for(const topic of model.topics.filter(t=>t.realm===realm.id)){
        const p=positions.get(topic.id);g.append(svgEl("line",{x1:hub.x,y1:hub.y,x2:p.x,y2:p.y,stroke:hub.color,"stroke-width":.7,opacity:found.has(topic.id)?.13:.015}));
      }
    }
    if($("cosmos-links").checked)for(const relation of model.connections){
      const a=positions.get(relation.a),b=positions.get(relation.b);
      const highlighted=found.has(relation.a)&&found.has(relation.b);
      const selectedLink=selected===relation.a||selected===relation.b;
      const line=svgEl("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:"#edc88d","stroke-width":selectedLink?2.6:1.65,"stroke-dasharray":"5 5",opacity:highlighted?(selectedLink?.98:.62):.055});
      const title=svgEl("title");title.textContent=relation.relation+": "+relation.note;line.append(title);g.append(line);
    }
    const core=svgEl("circle",{cx:size.cx,cy:size.cy,r:62,fill:"#133337",stroke:"#7ebcb0","stroke-width":2,opacity:.95});g.append(core);
    for(const realm of model.realms){
      const p=positions.get("realm:"+realm.id),active=model.topics.some(t=>t.realm===realm.id&&found.has(t.id));
      g.append(svgEl("circle",{cx:p.x,cy:p.y,r:18,fill:"#122c33",stroke:p.color,"stroke-width":2,opacity:active?1:.2}));
      const label=svgEl("text",{x:p.x,y:p.y-27,class:"cosmos-label",opacity:active?1:.2});label.textContent=realm.name;g.append(label);
      const number=svgEl("text",{x:p.x,y:p.y+4,class:"cosmos-label",opacity:active?1:.2});number.textContent=realm.number;g.append(number);
    }
    for(const topic of model.topics){
      const p=positions.get(topic.id),visible=found.has(topic.id);
      if(byDossier.has(topic.id)){g.append(svgEl("circle",{cx:p.x,cy:p.y,r:selected===topic.id?12:8,fill:"none",stroke:"#edc88d","stroke-width":selected===topic.id?2.3:1.5,opacity:visible?.96:.1}));}
      const circle=svgEl("circle",{class:"cosmos-node",cx:p.x,cy:p.y,r:selected===topic.id?8:5.1,fill:p.color,opacity:visible?1:.1,"data-topic":topic.id});
      const title=svgEl("title");title.textContent=topic.title+" ("+byRealm.get(topic.realm).name+")";circle.append(title);
      circle.addEventListener("click",()=>selectTopic(topic.id));g.append(circle);
    }
    const coreText=svgEl("text",{x:size.cx,y:size.cy-2,class:"cosmos-central"});coreText.textContent="Φ 369";g.append(coreText);
    const sub=svgEl("text",{x:size.cx,y:size.cy+18,class:"cosmos-central-small"});sub.textContent="HOPE · LOVE · JOY";g.append(sub);
    if(selected&&found.has(selected)){
      const p=positions.get(selected),label=svgEl("text",{x:p.x,y:p.y-15,class:"cosmos-node-title"});label.textContent=byId.get(selected).title;g.append(label);
    }
    svg.append(g);applyView();renderIndex(matching);
  }
  function applyView(){const svg=$("cosmos-svg");svg.setAttribute("viewBox",[view.x,view.y,view.w,view.h].map(n=>n.toFixed(2)).join(" "));}
  function zoom(factor){
    const nextWidth=Math.max(330,Math.min(1750,view.w*factor)),ratio=nextWidth/view.w;
    const nextHeight=view.h*ratio;
    view.x+=(view.w-nextWidth)/2;view.y+=(view.h-nextHeight)/2;view.w=nextWidth;view.h=nextHeight;applyView();
  }
  function renderIndex(filtered){
    const root=$("cosmos-list");root.replaceChildren();
    for(const topic of filtered){
      const row=txt("div");row.setAttribute("role","listitem");
      const button=txt("button");button.type="button";
      button.setAttribute("aria-pressed",String(topic.id===selected));
      button.append(txt("span",topic.title),txt("small",byDossier.has(topic.id)?"RESEARCH":"INDEX"));
      button.addEventListener("click",()=>selectTopic(topic.id,true));
      row.append(button);root.append(row);
    }
    $("cosmos-empty").hidden=filtered.length>0;
  }
  function selectTopic(id,focus=false){
    const topic=byId.get(id);if(!topic)return;
    if(selected)storedNotes.set(selected,$("cosmos-note").value);
    selected=id;$("cosmos-note").value=storedNotes.get(id)||"";
    const detail=$("cosmos-inspector");detail.replaceChildren();
    detail.append(txt("p","TOPIC INSPECTOR","eyebrow"),txt("h3",topic.title),txt("p",byRealm.get(topic.realm).name+" · Founding topic, not universally reviewed."));
    detail.querySelector("h3").id="cosmos-inspector-title";
    const match=model.connections.filter(c=>c.a===id||c.b===id);
    detail.append(txt("h4","Relationship notes","cosmos-subheading"));
    if(!match.length)detail.append(txt("p","No source-assessed topic-to-topic relationship has been registered for this topic. Shared realm membership is just a category."));
    for(const c of match){const related=byId.get(c.a===id?c.b:c.a);
      const item=txt("p",related.title+" · "+c.relation+": "+c.note);
      detail.append(item);
    }
    const dossier=byDossier.get(id);
    detail.append(txt("h4","Research status","cosmos-subheading"));
    if(dossier){
      detail.append(txt("p","Source-linked editorial starter: "+model.research.classificationLabels[dossier.classification]+". Not a systematic review."));
      const sourceLine=txt("ul");
      for(const sid of dossier.sourceIds){
        const s=bySource.get(sid),li=txt("li"),a=txt("a",s.title+" ↗");
        a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";li.append(a);sourceLine.append(li);
      }
      detail.append(sourceLine);
      const link=txt("a","Read research dossier ↗");link.href="?dossier="+encodeURIComponent(id)+"#research";detail.append(link);
    }else detail.append(txt("p","No source-linked dossier yet. This is an unreviewed research starting point."));
    detail.append(txt("p","Positions and lines indicate editorial grouping, not scientific causation.","cosmos-boundary"));
    const share=txt("a","Share this topic ↗");share.href="?topic="+encodeURIComponent(id)+"#constellation";share.className="cosmos-share";detail.append(share);
    draw();
    if(focus)detail.focus({preventScroll:true});
  }
  function exportPacket(){
    if(!selected){$("cosmos-note-status").textContent="Select a topic first.";return;}
    storedNotes.set(selected,$("cosmos-note").value);
    const topic=byId.get(selected),dossier=byDossier.get(selected);
    const citedSources=dossier?dossier.sourceIds.map(sid=>bySource.get(sid)):[];
    const packet={schema:"369-hlj-research-packet/v1",generatedAt:new Date().toISOString(),
      topic:{id:topic.id,title:topic.title,realm:topic.realm,reviewStatus:topic.reviewStatus},
      scope:"Personal research notebook, not reviewed scientific findings",
      notes:Array.from(storedNotes.entries()).filter(([id,value])=>byId.has(id)&&value.trim()).map(([id,text])=>({topicId:id,text})),
      relationships:model.connections.filter(c=>c.a===selected||c.b===selected),
      dossier:dossier?{classification:dossier.classification,question:dossier.question,supported:dossier.supported,boundary:dossier.boundary,sourceIds:dossier.sourceIds}:null,
      sources:citedSources,privacy:"Exported locally in your browser; not uploaded by this application."};
    const blob=new Blob([JSON.stringify(packet,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=txt("a");a.href=url;a.download="hlj-research-"+selected+".json";document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    $("cosmos-note-status").textContent="Research packet generated locally.";
  }
  function setupDrag(){
    const svg=$("cosmos-svg");
    svg.addEventListener("pointerdown",event=>{
      if(event.button!==0||event.target.closest("[data-topic]"))return;
      startDrag={id:event.pointerId,x:event.clientX,y:event.clientY,view:{...view}};
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener("pointermove",event=>{
      if(!startDrag||event.pointerId!==startDrag.id)return;
      const rect=svg.getBoundingClientRect();
      view.x=startDrag.view.x+(startDrag.x-event.clientX)*(view.w/rect.width);
      view.y=startDrag.view.y+(startDrag.y-event.clientY)*(view.h/rect.height);
      applyView();
    });
    const finish=event=>{if(startDrag&&event.pointerId===startDrag.id){startDrag=null;if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);}};
    svg.addEventListener("pointerup",finish);svg.addEventListener("pointercancel",finish);
  }
  async function init(){
    try{
      const [catalog,relations,research]=await Promise.all([load("./data/topics.json"),load("./data/connections.json"),load("./data/research.json")]);
      model={realms:catalog.realms,topics:catalog.topics,connections:relations,research};
      model.realms.forEach(r=>byRealm.set(r.id,r));model.topics.forEach(t=>byId.set(t.id,t));
      research.dossiers.forEach(d=>byDossier.set(d.topicId,d));research.sources.forEach(s=>bySource.set(s.id,s));
      if(model.topics.length!==179||model.realms.length!==9||relations.length!==14||research.dossiers.length!==10)throw Error("Unexpected registry shape");
      if(relations.some(c=>!byId.has(c.a)||!byId.has(c.b)))throw Error("Broken relationship endpoint");
      const filter=$("cosmos-realm");
      for(const realm of model.realms){const opt=txt("option",realm.name);opt.value=realm.id;filter.append(opt);}
      ["cosmos-realm","cosmos-search","cosmos-links","cosmos-sourced"].forEach(id=>$(id).addEventListener(id==="cosmos-search"?"input":"change",draw));
      $("cosmos-clear").addEventListener("click",()=>{filter.value="all";$("cosmos-search").value="";$("cosmos-sourced").checked=false;$("cosmos-links").checked=true;draw();});
      $("cosmos-zoom-in").addEventListener("click",()=>zoom(.8));
      $("cosmos-zoom-out").addEventListener("click",()=>zoom(1.25));
      $("cosmos-reset-view").addEventListener("click",()=>{view=defaultView();applyView();});
      $("cosmos-note").addEventListener("input",event=>{if(selected)storedNotes.set(selected,event.target.value);$("cosmos-note-status").textContent="Notes remain in this tab until exported.";});
      $("cosmos-export").addEventListener("click",exportPacket);
      document.addEventListener("hlj:topic-selected",event=>{
        if(byId.has(event.detail?.topicId))selectTopic(event.detail.topicId);
      });
      positionNodes();setupDrag();
      const candidate=new URLSearchParams(location.search).get("topic");
      selectTopic(byId.has(candidate)?candidate:"cymatics");
    }catch(err){console.error("Constellation could not initialize",err);showError("The constellation could not load. Refresh to retry.");}
  }
  document.addEventListener("DOMContentLoaded",init);
})();
