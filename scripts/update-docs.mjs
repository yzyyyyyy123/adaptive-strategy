import {cp,writeFile,rm}from'node:fs/promises';
await rm('docs',{recursive:true,force:true});await cp('out/github-pages','docs',{recursive:true});await writeFile('docs/.nojekyll','');
