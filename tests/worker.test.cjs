const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const sources = ['core', 'photoshop'].map(n => fs.readFileSync(path.join(__dirname, '../lib', n+'.jsxinc'), 'utf8')).join('\n');
const setup = `
var files={},openedPaths=[],nextID=1,actionBehavior='none',policy='preserve';
function File(path){this.fsName=path;this.path=path;}
File.prototype.__defineGetter__('exists',function(){return !!files[this.path];});
File.prototype.__defineGetter__('length',function(){return files[this.path]?100:0;});
File.prototype.open=function(){return true;};
File.prototype.write=function(t){files[this.path]={text:t};return true;};
File.prototype.close=function(){return true;};
function UnitValue(n){return {as:function(){return n;}};}
var DialogModes={NO:0},SaveOptions={DONOTSAVECHANGES:0},ColorProfile={NONE:'none'},ResampleMethod={BICUBIC:0},Extension={LOWERCASE:0};
function PhotoshopSaveOptions(){}
function ActionReference(){}
ActionReference.prototype.putProperty=ActionReference.prototype.putEnumerated=function(){};
function charIDToTypeID(x){return x;}function stringIDToTypeID(x){return x;}function typeIDToStringID(x){return x;}
function executeActionGet(){return {getObjectValue:function(){return {hasKey:function(){return true;},getEnumerationValue:function(){return policy;}};}};}
var $={global:{}};
function Doc(w,h){this.id=nextID++;this.width=UnitValue(w);this.height=UnitValue(h);this.resolution=300;this.mode='RGB';this.bitsPerChannel='8';this.colorProfileType='custom';this.colorProfileName='sRGB';this.layers=[{typename:'ArtLayer'},{typename:'ArtLayer'}];app.documents.push(this);app.activeDocument=this;}
Doc.prototype.duplicate=function(){return new Doc(this.width.as(),this.height.as());};
Doc.prototype.close=function(){var n=app.documents.indexOf(this);if(n>=0){app.documents.splice(n,1);}app.activeDocument=app.documents[0];};
Doc.prototype.resizeImage=function(w,h,r){this.width=w;this.height=h;this.resolution=r;};
Doc.prototype.saveAs=function(f){files[f.path]={w:this.width.as(),h:this.height.as(),profile:this.colorProfileName,mode:this.mode};};
var app={version:'mock',displayDialogs:7,documents:[],activeDocument:null,
open:function(f){openedPaths.push(f.path);var a=files[f.path]||{w:1000,h:500,profile:'sRGB',mode:'RGB'};var d=new Doc(a.w,a.h);d.colorProfileName=a.profile;d.mode=a.mode;return d;},
doAction:function(){var d=this.activeDocument;if(actionBehavior==='throw'){throw Error('action failed');}if(actionBehavior==='resize'){d.width=UnitValue(12);}if(actionBehavior==='close'){d.close();}if(actionBehavior==='new'){new Doc(50,50);}if(actionBehavior==='cmyk'){d.mode='CMYK';d.colorProfileName='PSO';}}};
var job={op:'process',id:'test',input:'scratch/input.jpg',output:'Links/staging.psd',cancel:'cancel',done:'done.json',factor:0.5,action:'',set:''};
`;
let count=0;
function test(name, before, validate) {
  const ctx=vm.createContext({});
  vm.runInContext(setup+sources+before+'\nvar response=IIOPhotoshop(job,IIO);',ctx);
  const result=JSON.parse(ctx.response);
  validate(result, ctx);
  assert.equal(ctx.app.displayDialogs,7, name+' restores dialogs');
  assert.equal(ctx.$.global.__iioBusy,false, name+' releases worker lock');
  count++;
}
test('downscale and preserve user document','var userDocument=new Doc(25,25);', (r,c)=>{
  assert.equal(r.ok,true);assert.equal(r.after.w,500);assert.equal(r.after.h,250);assert.equal(r.layers,2);
  assert.equal(c.app.documents.length,1);assert.equal(c.app.activeDocument,c.userDocument);
  assert.deepEqual(Array.from(c.openedPaths),['scratch/input.jpg','Links/staging.psd']);
});
test('no upscale','job.factor=1;',r=>{assert.equal(r.ok,true);assert.equal(r.after.w,1000);});
test('policy blocks before open',"policy='convert';",(r,c)=>{assert.equal(r.ok,false);assert.equal(c.openedPaths.length,0);});
test('cancel blocks before open',"files.cancel={};",(r,c)=>{assert.equal(r.ok,false);assert.equal(c.openedPaths.length,0);});
test('collision blocks before open',"files[job.output]={};",(r,c)=>{assert.equal(r.ok,false);assert.equal(c.openedPaths.length,0);});
test('action refuses other open docs',"new Doc(1,1);job.action='test';",(r,c)=>{assert.equal(r.ok,false);assert.equal(c.app.documents.length,1);assert.equal(c.openedPaths.length,0);});
for(const action of ['throw','resize','close','new']) {
  test('action '+action,`job.action='test';actionBehavior='${action}';`,(r,c)=>{
    assert.equal(r.ok,false);assert.equal(r.fatal,true);assert.equal(c.files[c.job.output],undefined);
  });
}
test('trusted color action',"job.action='test';actionBehavior='cmyk';",r=>{assert.equal(r.ok,true);assert.equal(r.after.mode,'CMYK');assert.equal(r.after.profile,'PSO');});
console.log(`${count} Photoshop worker control-flow tests passed (mock host, not Adobe integration).`);
