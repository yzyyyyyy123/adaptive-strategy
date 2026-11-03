declare const __WORKSPACE_API_ORIGIN__:string;
declare const __WORKSPACE_BASE_PATH__:string;
export class RequestError extends Error{constructor(message:string,public status:number){super(message)}}
const backend=typeof __WORKSPACE_API_ORIGIN__==='string'?__WORKSPACE_API_ORIGIN__.replace(/\/$/,''):'';
const base=typeof __WORKSPACE_BASE_PATH__==='string'?__WORKSPACE_BASE_PATH__:'/';
const storageKey='adaptive-strategy-session:'+backend+base;
let inMemoryToken='';
export const appPath=(search='')=>base+search;
export const assetUrl=(path:string)=>base+path.replace(/^\//,'');
export const apiUrl=(path:string)=>backend+'/api/'+path;
export const separateFrontend=()=>!!backend&&typeof window!=='undefined'&&backend!==window.location.origin;
export function authHeaders():Record<string,string>{
 if(!separateFrontend())return{};
 let saved=inMemoryToken;try{saved=window.localStorage.getItem(storageKey)||saved}catch{}
 return /^[a-f0-9]{64}$/.test(saved)?{Authorization:'Bearer '+saved}:{};
}
function rememberSession(data:any){if(separateFrontend()&&typeof data?.sessionToken==='string'&&/^[a-f0-9]{64}$/.test(data.sessionToken)){inMemoryToken=data.sessionToken;try{window.localStorage.setItem(storageKey,inMemoryToken)}catch{}}}
export async function apiResponse(path:string,init:RequestInit={}):Promise<Response>{
 const headers=new Headers(init.headers);for(const[k,v]of Object.entries(authHeaders()))headers.set(k,v);
 return fetch(apiUrl(path),{...init,headers,credentials:separateFrontend()?'omit':'same-origin',cache:'no-store'});
}
export async function api<T=any>(path:string,body?:unknown,method='POST'):Promise<T>{
 const r=await apiResponse(path,{method:body===undefined?'GET':method,headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 let data:any;try{data=await r.json()}catch{throw new RequestError('The server returned an unexpected response.',r.status)}if(!r.ok)throw new RequestError(data.error||'The request failed.',r.status);rememberSession(data);return data;
}
export async function downloadFile(path:string,fallback:string){
 const r=await apiResponse(path);if(!r.ok){let data:any;try{data=await r.json()}catch{}throw new RequestError(data?.error||'This file could not be downloaded.',r.status)}
 const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=/filename="([^"]+)"/.exec(r.headers.get('Content-Disposition')||'')?.[1]||fallback;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export const message=(e:unknown)=>e instanceof Error?e.message:String(e);
