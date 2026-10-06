import test from 'node:test';
import assert from 'node:assert/strict';
import {rockGeometry} from '../tools/compiler/rock.js';
import {validate} from '../tools/validator/validation.js';
test('seeded rocks have exact dimensions, finite flat faces and repeatable geometry',()=>{
 const a=rockGeometry({size:[3,1.5,2],seed:52}),b=rockGeometry({size:[3,1.5,2],seed:52}),c=rockGeometry({size:[3,1.5,2],seed:53});
 assert.deepEqual(a.attributes.position.array,b.attributes.position.array);assert.notDeepEqual(a.attributes.position.array,c.attributes.position.array);
 assert.deepEqual(a.boundingBox.min.toArray(),[-1.5,-.75,-1]);assert.deepEqual(a.boundingBox.max.toArray(),[1.5,.75,1]);
 const n=a.attributes.normal.array;assert.ok(n.every(Number.isFinite));for(let i=0;i<n.length;i+=9)for(let j=0;j<3;j++){assert.equal(n[i+j],n[i+j+3]);assert.equal(n[i+j],n[i+j+6]);}
 assert.ok(a.attributes.position.count<240);a.dispose();b.dispose();c.dispose();
});
test('rock schema rejects unbounded seeds, malformed dimensions and raw mesh data',()=>{
 const shape={type:'rock',size:[2,1,2],seed:7};const model=s=>({schema:'model.v1',id:'test.rock',type:'static',parts:[{id:'Rock',shape:s}]});
 assert.deepEqual(validate(model(shape)),[]);for(const s of [{...shape,seed:-1},{...shape,seed:1.5},{...shape,size:[1,0,2]},{...shape,vertices:[0,1,2]}])assert.ok(validate(model(s)).length);
});
