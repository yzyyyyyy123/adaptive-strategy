import type {Evidence,Paper,Strategy} from './types';

export type EvidenceFocus={strategyId:string;evidenceId:string;request:number};

export function matchingEvidence(evidence:Evidence[],paper:Pick<Paper,'pdfHash'|'pageCount'>){
 return evidence.filter(e=>Number.isInteger(e.page)&&e.page>0&&(!paper.pageCount||e.page<=paper.pageCount)&&(!e.pdfHash||e.pdfHash===paper.pdfHash)&&e.rects.length>0);
}

export function evidenceToFocus(evidence:Evidence[],strategyId:string,focus?:EvidenceFocus){
 return (focus?.strategyId===strategyId?evidence.find(e=>e.id===focus.evidenceId):undefined)||evidence[0];
}

export function evidenceForMode(strategy:Strategy,personal:Evidence[],mode:'source'|'personal'){
 return mode==='source'?strategy.evidence:personal;
}

export function evidenceLocation(e:Evidence,index:number){return `Passage ${index+1} · PDF p. ${e.page}`;}
