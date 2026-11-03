import type {Annotation, DimensionAxis, DimensionGroup, DimensionSection, Facet, Taxonomy} from './types';
import {DESIGN_COLORS,TARGET_COLORS} from './types';
export const AXES:DimensionAxis[]=['designs','targets'];
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
const order=(n:unknown,fallback:number)=>Number.isFinite(Number(n))?Math.max(0,Math.min(100000,Number(n))):fallback;
export function normalizeTaxonomy(input:Taxonomy):Taxonomy{
 const t=clone(input);t.revision=Number(t.revision)||0;t.groups=t.groups||{designs:[],targets:[]};
 for(const axis of AXES){
  const facets=t[axis]||[];let groups=t.groups[axis];
  if(!groups?.length&&facets.length){
   groups=[];
   for(const [index,f] of facets.entries()){
    let g=groups.find(g=>g.name===f.group);
    if(!g){g={id:axis+'-group-'+groups.length,name:f.group,color:(axis==='designs'?DESIGN_COLORS:TARGET_COLORS)[f.group]||'#667789',definition:'',sections:[]};groups.push(g);}
    f.groupId=g.id;f.order=order(f.order,index);
    if(f.secondary&&f.secondary!==f.label){let section=g.sections.find(s=>s.name===f.secondary);if(!section){section={id:g.id+'-section-'+g.sections.length,name:f.secondary,definition:'',order:index};g.sections.push(section)}f.sectionId=section.id;}
   }
  }
  t.groups[axis]=groups||[];
  for(const [i,f] of facets.entries()){
   const g=t.groups[axis].find(g=>g.id===f.groupId)||t.groups[axis].find(g=>g.name===f.group);
   if(g){f.groupId=g.id;f.group=g.name;f.color=g.color;const section=g.sections.find(s=>s.id===f.sectionId);f.secondary=section?.name;f.sectionId=section?.id;}
   f.order=order(f.order,i);
  }
  const rank=new Map(t.groups[axis].map((g,i)=>[g.id,i]));
  t[axis]=facets.sort((a,b)=>{
   const groupRank=(rank.get(a.groupId||'')||0)-(rank.get(b.groupId||'')||0);if(groupRank)return groupRank;
   const g=t.groups![axis].find(g=>g.id===a.groupId),sa=g?.sections.find(s=>s.id===a.sectionId),sb=g?.sections.find(s=>s.id===b.sectionId);
   return (sa?.order??a.order??0)-(sb?.order??b.order??0)||(a.order??0)-(b.order??0);
  });
 }
 return t;
}
export const activeFacets=(t:Taxonomy,axis:DimensionAxis)=>t[axis].filter(f=>!f.archived);
export const needsDimensionUpdate=(a:Pick<Annotation,'designCodes'|'targetCodes'>,t:Taxonomy)=>a.designCodes.some(id=>!t.designs.some(f=>f.id===id&&!f.archived))||a.targetCodes.some(id=>!t.targets.some(f=>f.id===id&&!f.archived));
export function groupItems(t:Taxonomy,axis:DimensionAxis,g:DimensionGroup){
 return [...g.sections.filter(s=>!s.archived).map(s=>({kind:'section' as const,id:s.id,name:s.name,order:s.order})),...t[axis].filter(f=>!f.archived&&f.groupId===g.id&&!f.sectionId).map(f=>({kind:'facet' as const,id:f.id,name:f.label,order:f.order||0}))].sort((a,b)=>a.order-b.order);
}
export function changeArchived(t:Taxonomy,axis:DimensionAxis,kind:'group'|'section'|'facet',id:string,archived:boolean):Taxonomy{
 const next=clone(t),groups=next.groups![axis],g=groups.find(g=>g.id===id||g.sections.some(s=>s.id===id))||groups.find(g=>g.id===next[axis].find(f=>f.id===id)?.groupId);
 const objects:(DimensionGroup|DimensionSection|Facet)[]=kind==='group'&&g?[g,...g.sections,...next[axis].filter(f=>f.groupId===id)]:kind==='section'&&g?[...g.sections.filter(s=>s.id===id),...next[axis].filter(f=>f.sectionId===id)]:next[axis].filter(f=>f.id===id);
 for(const n of objects){if(archived&&!n.archived){n.archived=true;n.archivedByNode=id}else if(!archived&&n.archivedByNode===id){n.archived=false;delete n.archivedByNode}}
 return normalizeTaxonomy(next);
}
// Called on the server before replacing the shared taxonomy. IDs stay stable;
// omitted entries become tombstones so old coding and revision history survive.
export function validateTaxonomy(input:Taxonomy,current:Taxonomy):Taxonomy{
 if(!input||typeof input!=='object'||!input.groups)throw new Error('Expected both dimension hierarchies.');
 const currentT=normalizeTaxonomy(current),next:Taxonomy={designs:[],targets:[],version:currentT.version,references:currentT.references,groups:{designs:[],targets:[]}};
 const ids=new Map<string,string>(),known=new Map<string,string>();
 for(const a of AXES){for(const g of currentT.groups![a]){known.set(g.id,a+':group');for(const s of g.sections)known.set(s.id,a+':section')}for(const f of currentT[a])known.set(f.id,a+':facet')}
 const identity=(id:unknown,kind:string)=>{if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('Each dimension needs a valid stable ID.');if(ids.has(id))throw new Error('Dimension IDs must be unique.');if(known.has(id)&&known.get(id)!==kind)throw new Error('A dimension ID cannot move between axes or hierarchy levels.');ids.set(id,kind);return id};
 const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw new Error('A dimension field is missing or too long.');return v.trim()};
 const required=(v:unknown)=>{const name=text(v,160);if(!name)throw new Error('Give every dimension a name.');return name};
 const unique=(names:string[],scope:string)=>{if(new Set(names.map(s=>s.toLocaleLowerCase())).size!==names.length)throw new Error('Duplicate names in '+scope+'.');};
 for(const a of AXES){
  if(!Array.isArray(input.groups[a])||input.groups[a].length>80||!Array.isArray(input[a])||input[a].length>1500)throw new Error('The dimension hierarchy is too large.');
  const proposedGroups=clone(input.groups[a]);
  for(const old of currentT.groups![a])if(!proposedGroups.some(g=>g.id===old.id))proposedGroups.push({...old,sections:old.sections.filter(s=>!input.groups![a].some(g=>g.sections?.some(v=>v.id===s.id))),archived:true,archivedByNode:old.id});
  for(const g of proposedGroups){
   if(!Array.isArray(g.sections)||g.sections.length>150)throw new Error('Invalid secondary dimensions.');
   const old=currentT.groups![a].find(v=>v.id===g.id),sections=clone(g.sections);
   for(const s of old?.sections||[])if(!proposedGroups.some(p=>p.sections?.some(v=>v.id===s.id)))sections.push({...s,archived:true,archivedByNode:s.id});
   const group:DimensionGroup={id:identity(g.id,a+':group'),name:required(g.name),color:text(g.color,7),definition:text(g.definition||'',5000),sections:[],archived:!!g.archived,archivedByNode:g.archived?String(g.archivedByNode||g.id):undefined};
   if(!/^#[\da-fA-F]{6}$/.test(group.color))throw new Error('Use a six-digit color.');
   for(const [i,s] of sections.entries())group.sections.push({id:identity(s.id,a+':section'),name:required(s.name),definition:text(s.definition||'',5000),order:order(s.order,i),archived:!!s.archived||!!group.archived,archivedByNode:s.archived?String(s.archivedByNode||s.id):group.archived?group.id:undefined});
   unique(group.sections.filter(s=>!s.archived).map(s=>s.name),'secondary dimensions');next.groups![a].push(group);
  }
  unique(next.groups![a].filter(g=>!g.archived).map(g=>g.name),'primary dimensions');
  const fs=clone(input[a]);for(const old of currentT[a])if(!fs.some(f=>f.id===old.id)){const parent=old.sectionId?next.groups![a].find(g=>g.sections.some(s=>s.id===old.sectionId)):undefined;fs.push({...old,groupId:parent?.id||old.groupId,archived:true,archivedByNode:old.id});}
  for(const [i,f] of fs.entries()){
   const g=next.groups![a].find(g=>g.id===f.groupId);if(!g)throw new Error('Choose a primary dimension for each label.');
   const sec=f.sectionId?g.sections.find(s=>s.id===f.sectionId):undefined;if(f.sectionId&&!sec)throw new Error('A secondary dimension belongs to a different primary dimension.');
   const hidden=!!f.archived||!!g.archived||!!sec?.archived;
   next[a].push({id:identity(f.id,a+':facet'),group:g.name,groupId:g.id,sectionId:sec?.id,secondary:sec?.name,label:required(f.label),definition:text(f.definition||'',5000),references:text(f.references||'',5000),color:g.color,order:order(f.order,i),archived:hidden,archivedByNode:f.archived?String(f.archivedByNode||f.id):g.archived?g.id:sec?.archived?sec.id:undefined});
  }
  for(const g of next.groups![a])for(const sectionId of [undefined,...g.sections.map(s=>s.id)])unique(next[a].filter(f=>!f.archived&&f.groupId===g.id&&f.sectionId===sectionId).map(f=>f.label),'labels within a dimension');
 }
 return normalizeTaxonomy(next);
}
