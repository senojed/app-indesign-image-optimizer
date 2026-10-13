#target indesign
#include "../lib/core.jsxinc"
#include "../lib/photoshop.jsxinc"
#include "../lib/indesign.jsxinc"
(function(){
    var A=IIOAdobe,C=IIO,root=new Folder(File($.fileName).parent.fsName+'/artifacts/unicode-'+new Date().getTime()),doc=null,
        previous=app.documents.length?app.activeDocument:null,oldUnits=app.scriptPreferences.measurementUnit,out={ok:false,tests:[]};
    A.sourceRoot=File($.fileName).parent.parent.fsName;A.mkdir(root.parent);A.mkdir(root);
    function check(name,ok){out.tests.push({name:name,ok:!!ok});C.assert(ok,name);}
    try{
        /* Reuse a generated fixture, never a user's source. */
        var dirs=root.parent.getFiles('smoke-*'),source=null,i;
        for(i=0;i<dirs.length;i++){var f=new File(dirs[i].fsName+'/fixture.psd');if(f.exists){source=f;break;}}
        C.assert(source,'Nejprve spustte adobe-smoke.jsx.');
        var folderA=A.mkdir(new Folder(root.fsName+'/prvni')),folderB=A.mkdir(new Folder(root.fsName+'/druhy'));
        var a=new File(folderA.fsName+'/Příliš žluťoučký kůň.psd'),b=new File(folderB.fsName+'/Příliš žluťoučký kůň.psd');
        A.copyVerified(source,a);A.copyVerified(source,b);
        app.scriptPreferences.measurementUnit=MeasurementUnits.POINTS;doc=app.documents.add();
        for(i=0;i<2;i++){var frame=doc.pages[0].rectangles.add({geometricBounds:[20+i*120,20,120+i*120,180]});var g=frame.place(i===0?a:b)[0];g.horizontalScale=g.verticalScale=50;}
        doc.save(new File(root.fsName+'/Žluťoučký dokument.indd'));
        var settings={ppi:300,selected:false,set:'',action:'',timeout:90,offerDelete:false},plan=A.analyze(doc,settings,[]);
        check('Unicode sources eligible',plan.items.length===2);
        check('Same basenames have unique outputs',A.path(plan.items[0].output)!==A.path(plan.items[1].output));
        /* Existing preview destination must never be overwritten. */
        var collision=new File(plan.items[0].output.fsName);A.mkdir(collision.parent);A.write(collision,'existing file');
        plan=A.analyze(doc,settings,[]);check('Existing filename skipped',A.path(plan.items[0].output)!==A.path(collision));
        var report=A.run(doc,plan,settings,{cancelled:false,pulse:function(){},status:function(){},progress:function(){}},BridgeTalk.getSpecifier('photoshop'));
        out.report=report;check('Unicode batch succeeded',report.complete&&report.success===2);check('Collision content intact',A.read(collision)==='existing file');
        var count=0;for(var k in plan.sources){if(Object.prototype.hasOwnProperty.call(plan.sources,k)){count++;}}
        check('Separate backups for identical basenames',count===2);out.ok=true;
    }catch(e){out.error=String(e)+' line '+e.line;}
    finally{if(doc&&doc.isValid){doc.close(SaveOptions.NO);}app.scriptPreferences.measurementUnit=oldUnits;if(previous&&previous.isValid){app.activeDocument=previous;}A.write(new File(root.fsName+'/integration.json'),C.json(out));}
    return C.json({ok:out.ok,path:root.fsName,error:out.error||''});
})();
