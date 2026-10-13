const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function scenario({cancel=false,receipt,replyAt,timeout=300}){
 let now=0,bt,writes=[],statuses=[];
 const ctx=vm.createContext({
  Date:class{getTime(){return now;}},
  File:function(p){this.fsName=p;this.exists=p==='done'&&receipt!==undefined;},
  BridgeTalk:function(){bt=this;this.send=()=>true;},
  $:{sleep(ms){now+=ms;}}
 });
 ctx.BridgeTalk.pump=()=>{if(replyAt!==undefined&&now>=replyAt)bt.onResult({body:'{"ok":true}'});};
 for(const name of ['core','indesign'])vm.runInContext(fs.readFileSync(__dirname+'/../lib/'+name+'.jsxinc','utf8'),ctx);
 ctx.IIOAdobe.sourceRoot='test';ctx.IIOAdobe.read=f=>f.fsName==='done'?receipt:'';
 ctx.IIOAdobe.write=(f,t)=>writes.push([f.fsName,t]);
 const control={cancelled:cancel,pulse(){},status(t){statuses.push(t);}};
 let result,error;
 try{result=ctx.IIOAdobe.bridge('photoshop',{cancel:'cancel',done:'done'},control,timeout);}catch(e){error=e;}
 return {result,error,now,writes,statuses};
}
let r=scenario({cancel:true});assert.equal(r.error.uncertain,true);assert.equal(r.now,10000);assert.deepEqual(r.writes,[['cancel','cancel']]);
r=scenario({receipt:'{"ok":true}'});assert.equal(r.result.ok,true);assert.equal(r.now,0);
r=scenario({cancel:true,replyAt:500});assert.equal(r.result.ok,true);assert.equal(r.now,500);
r=scenario({cancel:true,receipt:'{"ok":'});assert.equal(r.error.uncertain,true);assert.equal(r.now,10000);
r=scenario({timeout:1});assert.equal(r.error.uncertain,true);assert.ok(r.now<=1050);
r=scenario({replyAt:1000,timeout:1});assert.equal(r.result.ok,true);
console.log('Bridge regression passed: cancellation bound, completion receipt, partial receipt, callback and timeout.');
