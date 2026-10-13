#target indesign
#include "../lib/core.jsxinc"
#include "../lib/photoshop.jsxinc"
#include "../lib/indesign.jsxinc"
(function(){
    IIOAdobe.sourceRoot=File($.fileName).parent.parent.fsName;
    var sample={ok:true,no:false,n:null,num:-1.25e3,text:'Příliš žluťoučký "kůň"\nC:\\Links\\obrázek.psd',a:[1,2,3]},encoded=IIO.json(sample);
    var decoded=IIO.json(IIO.parse(encoded));
    if(decoded!==encoded){return IIO.json({ok:false,error:'JSON roundtrip',encoded:encoded,decoded:decoded});}
    var result=IIOAdobe.bridge(BridgeTalk.getSpecifier('photoshop'),{op:'actions'},null,30);
    IIO.assert(result.ok && result.sets instanceof Array,'Action Manager probe selhal.');
    return IIO.json({ok:true,indesign:app.version,photoshop:result.version,actionSets:result.sets.length,jsonRoundtrip:true});
})();
