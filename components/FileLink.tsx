'use client';
import {useState}from'react';
import {apiResponse,apiUrl,downloadFile,message,separateFrontend}from'@/lib/client';
export default function FileLink({path,filename,children,className,title,preview=false}:{path:string;filename:string;children:React.ReactNode;className?:string;title?:string;preview?:boolean}){
 const[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function open(e:React.MouseEvent<HTMLAnchorElement>){if(!separateFrontend())return;e.preventDefault();if(busy)return;setBusy(true);setError('');const popup=preview?window.open('about:blank','_blank'):null;
  try{if(preview){const r=await apiResponse(path);if(!r.ok)throw new Error('The PDF could not be opened.');const url=URL.createObjectURL(await r.blob());if(popup){popup.opener=null;popup.location.replace(url)}else{await downloadFile(path,filename)}setTimeout(()=>URL.revokeObjectURL(url),300000)}else await downloadFile(path,filename)}catch(e){popup?.close();setError(message(e))}finally{setBusy(false)}
 }
 return <><a href={apiUrl(path)}className={className}title={title}target={preview?'_blank':undefined}rel={preview?'noreferrer':undefined}onClick={open}aria-busy={busy}>{children}</a>{error&&<span role="alert"className="error-banner">{error}</span>}</>;
}
