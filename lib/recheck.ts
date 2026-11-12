import type {Strategy,Annotation} from './types';
export function needsSourceRecheck(s:Strategy,a:Annotation|undefined,userId:string){
 const u=s.unitAudit;
 if(s.archived||!u?.reviewRequiredFor.includes(userId))return false;
 return !a||a.status!=='reviewed'||!a.updatedAt||a.updatedAt<=u.reviewAfter;
}
