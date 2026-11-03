import {defineConfig}from'vite';
import react from'@vitejs/plugin-react';
import {fileURLToPath}from'node:url';
import path from'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const api=process.env.WORKSPACE_API_ORIGIN||'https://adaptive-strategy-workbench.yangzhiyao1010.chatgpt.site';
const base=process.env.WORKSPACE_BASE_PATH||'/adaptive-strategy/';
if(new URL(api).origin!==api||!/^\/[A-Za-z0-9_/-]*\/$/.test(base))throw new Error('Use an API origin and a frontend base path with a trailing slash.');
export default defineConfig({root:path.join(root,'frontend'),base,publicDir:path.join(root,'public'),plugins:[react()],resolve:{alias:{'@':root}},define:{__WORKSPACE_API_ORIGIN__:JSON.stringify(api),__WORKSPACE_BASE_PATH__:JSON.stringify(base)},build:{outDir:path.join(root,'out/github-pages'),emptyOutDir:true}});
