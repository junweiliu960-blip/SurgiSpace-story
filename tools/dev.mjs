import {createServer} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {handleProgress} from '../worker/index.js';
const root=path.resolve('.local/players');await fs.mkdir(root,{recursive:true});
// Local preview uses the same anonymous cookie isolation as the published public site.
const port=Number(process.env.SURGISPACE_PREVIEW_PORT||5186);
let lock=Promise.resolve();const bucket={
 async get(key){try{const raw=await fs.readFile(path.join(root,encodeURIComponent(key)),'utf8'),data=JSON.parse(raw);return {etag:String(data.revision),json:async()=>data};}catch(e){if(e.code==='ENOENT')return null;throw e;}},
 async put(key,value,options){const task=lock.then(async()=>{const old=await this.get(key);if(options.onlyIf.etagMatches&&old?.etag!==options.onlyIf.etagMatches||options.onlyIf.etagDoesNotMatch==='*'&&old)return null;await fs.writeFile(path.join(root,encodeURIComponent(key)),value);return {etag:String(JSON.parse(value).revision)};});lock=task.catch(()=>{});return task;}
};
const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true},plugins:[{name:'local-save-preview',configureServer(vite){vite.middlewares.use('/api/campaign',async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const origin='http://127.0.0.1:'+port;const headers=new Headers(req.headers);headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');const request=new Request(origin+'/api/campaign',{method:req.method,headers,...(req.method==='PUT'?{body:Buffer.concat(chunks)}:{})});const response=await handleProgress(request,{BUCKET:bucket});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());}catch{res.writeHead(500);res.end();}});}}]});
await server.listen();server.printUrls();
