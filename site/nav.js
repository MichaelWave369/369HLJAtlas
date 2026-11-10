"use strict";
(() => {
 const nav=document.getElementById("site-nav");
 const toggle=document.getElementById("site-menu-toggle");
 if(!nav||!toggle)return;
 const groups=[...nav.querySelectorAll("details.nav-group")];
 const mq=window.matchMedia("(max-width: 960px)");
 const closeGroups=()=>groups.forEach(g=>{g.open=false;});
 function closeMenu(focus=false){
   nav.dataset.open="false";toggle.setAttribute("aria-expanded","false");closeGroups();
   if(focus&&mq.matches)toggle.focus();
 }
 toggle.addEventListener("click",()=>{
   if(nav.dataset.open==="true")closeMenu();
   else{nav.dataset.open="true";toggle.setAttribute("aria-expanded","true");}
 });
 groups.forEach(g=>g.addEventListener("toggle",()=>{if(g.open)groups.forEach(other=>{if(other!==g)other.open=false;});}));
 nav.querySelectorAll("a[href]").forEach(a=>a.addEventListener("click",()=>closeMenu()));
 document.addEventListener("keydown",event=>{
   if(event.key!=="Escape")return;
   const group=groups.find(g=>g.open);
   if(!group&&nav.dataset.open!=="true")return;
   event.preventDefault();
   if(mq.matches&&nav.dataset.open==="true")closeMenu(true);
   else{closeGroups();group?.querySelector("summary")?.focus();}
 });
 document.addEventListener("pointerdown",event=>{
   if(!event.target.closest(".top")){closeGroups();if(mq.matches&&nav.dataset.open==="true")closeMenu();}
 });
 if(mq.addEventListener)mq.addEventListener("change",()=>closeMenu());
})();
