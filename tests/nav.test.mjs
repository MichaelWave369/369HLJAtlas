import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../site/style.css",import.meta.url),"utf8");
const js=readFileSync(new URL("../site/nav.js",import.meta.url),"utf8");
test("All eleven original section anchors appear exactly once in grouped navigation",()=>{
 const nav=html.split('<nav class="site-nav"')[1]?.split("</nav>")[0];
 assert.ok(nav);
 for(const id of ["explore","constellation","connections","institute","research","verification","source-audit",
 "living-lab","lab-bridge","labs","promise"]){
  assert.equal((nav.match(new RegExp('href="#'+id+'"','g'))||[]).length,1,id);
  assert.ok(html.includes('id="'+id+'"'),"Unresolved target "+id);
 }
 for(const group of ["discover","research","labs"])assert.ok(nav.includes('data-group="'+group+'"'));
 assert.equal((html.match(/<nav /g)||[]).length,1);
});
test("Mobile toggle, accessible details and Escape are wired",()=>{
 assert.match(html,/id="site-menu-toggle"[^>]*aria-controls="site-nav" aria-expanded="false"/);
 assert.match(html,/class="mobile-source-link" href="https:\/\/github.com\//);
 assert.match(css,/@media\(max-width:960px\)/);
 assert.match(js,/Escape/);assert.match(js,/aria-expanded/);assert.match(js,/closeMenu/);
 assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|eval\(/);
 assert.equal(spawnSync(process.execPath,["--check",new URL("../site/nav.js",import.meta.url).pathname],{encoding:"utf8"}).status,0);
});
