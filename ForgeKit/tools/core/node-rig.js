import {createHash} from 'node:crypto';
export function nodeMeta(d){
 const nodes=[...(d.parts??[]),...(d.sockets??[])].map(n=>({id:n.id,parent:n.parent??'Asset',position:n.position??[0,0,0],rotation:n.rotation??[0,0,0],scale:n.scale??1})).sort((a,b)=>a.id.localeCompare(b.id));
 return {rigId:'nodes',rigVersion:'1',rigSignature:createHash('sha256').update(JSON.stringify({id:d.id,root:d.root??{},nodes})).digest('hex'),nodeNames:nodes.map(n=>n.id)};
}
