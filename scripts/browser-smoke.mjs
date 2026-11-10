
/**
 * Dependency-free browser boot smoke. Requires Google Chrome in GitHub-hosted Ubuntu runner.
 * Checks DOM after real browser JS executes, not a no-JS screenshot or a full UI test.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {spawn,spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {join,resolve,sep} from "node:path";
const site=resolve(fileURLToPath(new URL("../site/",import.meta.url)));
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".css":"text/css; charset=utf-8"};
function ext(p){const index=p.lastIndexOf(".");return index<0?"":p.slice(index);}
const server=createServer(async(req,res)=>{
 try{
  const incoming=new URL(req.url,"http://localhost"),name=decodeURIComponent(incoming.pathname)==="/"?"/index.html":decodeURIComponent(incoming.pathname);
  const full=resolve(site,"."+name);
  if(full!==site&&!full.startsWith(site+sep)){res.writeHead(403);res.end();return;}
  const bytes=await readFile(full);
  res.writeHead(200,{"content-type":mime[ext(name)]||"application/octet-stream","cache-control":"no-store"});res.end(bytes);
 }catch{res.writeHead(404);res.end("Not found");}
});
const found=command=>spawnSync("which",[command],{encoding:"utf8"}).status===0?command:null;
const chrome=process.env.HLJ_CHROME||found("google-chrome")||found("google-chrome-stable")||found("chromium");
if(!chrome)throw new Error("Chrome/Chromium missing from runner: browser boot acceptance cannot be skipped");
await new Promise((accept,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",accept);});
const port=server.address().port;
try{
 const output=await new Promise((accept,reject)=>{
  const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-extensions",
   "--disable-background-networking","--no-first-run","--virtual-time-budget=12000","--window-size=1280,900","--dump-dom",
   "http://127.0.0.1:"+port+"/"],{stdio:["ignore","pipe","pipe"]});
  let stdout="",stderr="";
  child.stdout.on("data",d=>stdout+=d.toString());
  child.stderr.on("data",d=>stderr+=d.toString().slice(0,30000));
  const guard=setTimeout(()=>{child.kill("SIGKILL");reject(new Error("Chrome timed out: "+stderr.slice(-1600)));},40000);
  child.on("error",e=>{clearTimeout(guard);reject(e);});
  child.on("close",code=>{clearTimeout(guard);if(code!==0)reject(new Error("Chrome exited "+code+": "+stderr.slice(-2000)));else accept(stdout);});
 });
 assert.match(output,/id="verification-root"[^>]*data-ready="true"/,"Review desk failed to initialize in Chrome");
 assert.match(output,/class="verification-card"/,"Claim cards not rendered");
 assert.match(output,/data-claim="claim-01"/,"Expected first claim not rendered");
 assert.match(output,/id="cosmos-list"/,"Constellation missing");
 assert.match(output,/class="institute-map-node"/,"Shasta tour not initialized");
 assert.match(output,/id="living-protocols"/,"Living Lab not present");
 assert.match(output,/id="bridge-file"/,"Laboratory Bridge missing");
 console.log("PASS: real Chrome rendered verification queue, constellation, Institute, Living Lab and Lab Bridge.");
}finally{await new Promise(resolve=>server.close(resolve));}
