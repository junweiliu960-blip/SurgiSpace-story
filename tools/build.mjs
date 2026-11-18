import {spawnSync} from 'node:child_process';
import {mkdirSync,cpSync,readFileSync,writeFileSync} from 'node:fs';
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir','dist/client'],{stdio:'inherit',env:{...process.env,VITE_CLOUD_REQUIRED:'false'}});
if(result.status!==0)process.exit(result.status??1);
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
// A self-contained Worker ESM, with the same save validator as the game.
const built=await import('vite');
await built.build({configFile:false,build:{outDir:'dist/server',emptyOutDir:false,lib:{entry:'worker/index.js',formats:['es'],fileName:()=> 'index.js'},minify:true},logLevel:'warn'});
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
console.log('Worker + client + account cloud saves built.');
