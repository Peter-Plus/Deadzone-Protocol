// Environment metadata is separate from model.v1; the existing model validator remains authoritative.
const num={type:'number'}, positive={type:'number',exclusiveMinimum:0};
const tuple=(n,item=num)=>({type:'array',items:item,minItems:n,maxItems:n});
const string={type:'string',minLength:1};
const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const array=items=>({type:'array',items});
export const profileSchema=object({radius:positive,height:positive,margin:{type:'number',minimum:0},maxSlopeDegrees:{type:'number',minimum:0,maximum:45}});
export const environmentSchema=object({
 schema:{const:'environment.v1'},id:{type:'string',pattern:'^[A-Za-z][A-Za-z0-9_-]*$'},label:string,
 type:{enum:['terrain','building','solid','barrier','gate']},
 model:{type:'object'},animation:{type:'object'},
 roofMode:{enum:['full','partial','none']},
 doors:array(object({id:string,asset:{type:'string',pattern:'^[A-Za-z][A-Za-z0-9_-]*$'},position:tuple(3),yaw:num,pocket:string})),
 profiles:{type:'object',minProperties:1,additionalProperties:profileSchema},
 placement:object({min:tuple(2),max:tuple(2)}),
 colliders:array(object({node:string,role:{enum:['wall','floor','roof','ramp','solid','barrier','moving']}})),
 walkables:array(string),
 entrances:array(object({id:string,inner:tuple(3),outer:tuple(3),width:positive,height:positive,profiles:array(string)})),
 routes:array(object({id:string,points:{type:'array',items:tuple(3),minItems:2},profiles:array(string)})),
 lootZones:array(object({id:string,min:tuple(2),max:tuple(2),surface:string})),
 exclusions:array(object({id:string,min:tuple(2),max:tuple(2)})),
 connectors:array(object({id:string,position:tuple(3),outward:tuple(3),height:positive,thickness:positive})),
 gate:object({leaf:string,switchNode:string,duration:positive,travel:tuple(3),passage:object({width:positive,height:positive}),onlyOpen:{const:true}}),
 terrain:object({size:tuple(2,positive),cell:positive,seed:{type:'integer'},amplitude:{type:'number',minimum:0},wavelength:positive,maxSlopeDegrees:{type:'number',minimum:0,maximum:30},platforms:array(object({center:tuple(2),size:tuple(2,positive),height:num,blend:positive})),landform:{enum:['flat','slope','basin','hill']},edgeBlend:positive,surface:{enum:['desert-mottled']}},['size','cell','seed','amplitude','wavelength','maxSlopeDegrees','platforms'])
},['schema','id','label','type','placement','profiles','colliders','walkables','entrances','routes','lootZones','exclusions','connectors']);
