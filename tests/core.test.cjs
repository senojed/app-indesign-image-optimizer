const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const context = vm.createContext({console});
for (const file of ['core', 'photoshop', 'indesign', 'ui']) {
  const code = fs.readFileSync(path.join(root, 'lib', file + '.jsxinc'), 'utf8');
  new vm.Script(code, {filename: file});
  vm.runInContext(code, context);
}
let tests = 0;
function check(code) { assert.equal(vm.runInContext(code, context), true, code); tests++; }
check('IIO.factor(600, 300, 300) === 0.5');
check('IIO.factor(150, 299, 300) === 1');
check('IIO.factor(300, 300, 300) === 1');
check('IIO.factor(1200, 600, 300) === 0.25');
check('IIO.json(IIO.dimensions(1201, 801, 0.5)) === "[600,400]"');
check('(function(){try{IIO.dimensions(1,100,0.2);return false;}catch(e){return true;}})()');
check('(function(){try{IIO.factor(NaN,300,300);return false;}catch(e){return true;}})()');
check('IIO.raster("a.PSD") && IIO.raster("b.tiff") && !IIO.raster("a.pdf") && !IIO.raster("a.svg") && !IIO.raster("a.ai") && !IIO.raster("a.eps")');
check('IIO.key("C:\\\\Links\\\\A.JPG") === "c:/links/a.jpg"');
check('IIO.close(IIO.mul([2,1,3,4,21,-19],IIO.inverse([2,1,3,4,21,-19])),[1,0,0,1,0,0],1e-9)');
check('(function(){try{IIO.inverse([0,0,0,1,0,0]);return false;}catch(e){return true;}})()');
check(`(function(){
  function point(m,p){return [m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];}
  var unit=[[0,0],[1,0],[0,1],[1,1]],i,j,a,b,c,p,q;
  for(i=0;i<200;i++){
    a=[-2-i/20,0.3,0.8,3+i/30,21,-42];b=[1+i/50,0.2,-0.4,2,9,13];p=[];q=[];
    for(j=0;j<4;j++){p.push(point(a,unit[j]));q.push(point(b,unit[j]));}
    c=IIO.compensate(p,q);for(j=0;j<4;j++){if(!IIO.close(point(c,q[j]),p[j],1e-8)){return false;}}
  }return true;
})()`);
check(`(function(){var o={a:'Příliš "žluťoučký" \\n / \\u2028',b:[null,true,false,-1,1.2e4]};return IIO.json(IIO.parse(IIO.json(o)))===IIO.json(o);})()`);
for (const invalid of ['{"__proto__":{}}', '[1,]', '{"a":1,}', '1 garbage', '01', '"\\q"', '"unterminated']) {
  context.input = invalid;
  check('(function(){try{IIO.parse(input);return false;}catch(e){return true;}})()');
}
check(`(function(){var s={batchComplete:true,verifiedBackup:true,outputsVerified:true,allOccurrencesDone:true,noReferences:true,directChild:true,raster:true,alias:false,otherDocumentUse:false};if(!IIO.deletable(s)){return false;}for(var k in s){var old=s[k];s[k]=!old;if(IIO.deletable(s)){return false;}s[k]=old;}return true;})()`);
console.log(`${tests} core/safety tests passed; all JSX modules parse.`);
