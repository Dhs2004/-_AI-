import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const paths=['dist/js','qa','scripts'];
for(const dir of paths)for(const entry of readdirSync(dir,{withFileTypes:true})){
 if(!entry.isFile()||! /\.(m?js)$/.test(entry.name))continue;
 const result=spawnSync(process.execPath,['--check',`${dir}/${entry.name}`],{stdio:'inherit'});if(result.status)process.exit(result.status);
}
console.log('All game, QA and helper JavaScript parses successfully.');
