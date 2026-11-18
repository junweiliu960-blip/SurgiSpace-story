import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('dependency lock includes platform optional packages needed by clean Linux installs',()=>{
 const manifest=JSON.parse(fs.readFileSync('package.json','utf8')),lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
 assert.deepEqual(lock.packages[''].dependencies,manifest.dependencies);assert.deepEqual(lock.packages[''].devDependencies,manifest.devDependencies);
 for(const [parent,entry] of Object.entries(lock.packages))for(const [name,version] of Object.entries(entry.optionalDependencies||{})){
  const record=lock.packages['node_modules/'+name];assert.ok(record,`${parent} requires missing optional package ${name}`);
  if(/^\d+\.\d+\.\d+$/.test(version))assert.equal(record.version,version);
 }
 for(const name of ['@esbuild/linux-x64','@rollup/rollup-linux-x64-gnu','@rollup/rollup-linux-x64-musl'])assert.ok(lock.packages['node_modules/'+name]);
});
