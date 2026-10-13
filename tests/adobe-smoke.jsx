#target indesign
#include "../lib/core.jsxinc"
#include "../lib/photoshop.jsxinc"
#include "../lib/indesign.jsxinc"

(function(){
    var C=IIO,A=IIOAdobe,root=new Folder(File($.fileName).parent.fsName+'/artifacts/smoke-'+new Date().getTime()),doc=null,
        previous=app.documents.length?app.activeDocument:null,oldUnits=app.scriptPreferences.measurementUnit,
        results={tests:[],ok:false},target=BridgeTalk.getSpecifier('photoshop');
    A.mkdir(root.parent);A.mkdir(root);
    A.sourceRoot=File($.fileName).parent.parent.fsName;
    function check(name,ok){results.tests.push({name:name,ok:!!ok});C.assert(ok,name);}
    function rawPS(code){var bt=new BridgeTalk(),out=null,err=null;bt.target=target;bt.body='eval(decodeURIComponent('+C.quote(encodeURIComponent(code))+'));';bt.onResult=function(r){out=r.body;};bt.onError=function(e){err=e.body;};bt.send(60);C.assert(out!==null&&!err,'Fixture BridgeTalk: '+err);return out;}
    try{
        var source=new File(root.fsName+'/fixture.psd');
        rawPS('(function(){var old=app.displayDialogs,active=app.documents.length?app.activeDocument:null,d=null;try{app.displayDialogs=DialogModes.NO;d=app.documents.add(UnitValue(1201,"px"),UnitValue(803,"px"),300,"IIO fixture",NewDocumentMode.RGB,DocumentFill.TRANSPARENT);var color=new SolidColor();color.rgb.red=200;color.rgb.green=30;color.rgb.blue=50;d.selection.select([[0,0],[400,0],[400,400],[0,400]]);d.selection.fill(color);d.selection.deselect();d.artLayers.add().name="Transparent second layer";var o=new PhotoshopSaveOptions();o.layers=true;o.embedColorProfile=true;d.saveAs(new File('+C.quote(source.fsName)+'),o,true,Extension.LOWERCASE);return "OK";}finally{if(d){d.close(SaveOptions.DONOTSAVECHANGES);}app.displayDialogs=old;if(active){app.activeDocument=active;}}})()');
        var acts=A.bridge(target,{op:'actions'},null,30);results.actions=acts;check('BridgeTalk + Action Manager enumeration',acts.ok && acts.sets instanceof Array);
        app.scriptPreferences.measurementUnit=MeasurementUnits.POINTS;
        doc=app.documents.add();doc.documentPreferences.pageWidth=600;doc.documentPreferences.pageHeight=800;
        var frames=[],i,g,f;
        for(i=0;i<4;i++){
            f=doc.pages[0].rectangles.add({geometricBounds:[50+i*150,80,160+i*150,260]});g=f.place(source)[0];
            f.frameFittingOptions.autoFit=i<3; // Odd pixel dimensions + Auto-Fit must survive relink correction.
            g.horizontalScale=i===3?150:40+i*5;g.verticalScale=i===3?150:40+i*9;
            if(i===1){f.rotationAngle=17;g.rotationAngle=-29;g.shearAngle=12;}
            if(i===2){g.flipItem(Flip.HORIZONTAL,AnchorPoint.CENTER_ANCHOR);g.rotationAngle=23;f.shearAngle=9;}
            g.transparencySettings.blendingSettings.opacity=77;
            f.transparencySettings.blendingSettings.opacity=83;frames.push(f);
        }
        doc.save(new File(root.fsName+'/test.indd'));
        var settings={ppi:300,selected:false,action:'',set:'',timeout:90,offerDelete:false},plan=A.analyze(doc,settings,[]);
        results.analysis={items:plan.items.length,skipped:plan.skipped};check('All four transformed occurrences eligible',plan.items.length===4);
        var control={cancelled:false,pulse:function(){},status:function(){},progress:function(){}};
        var report=A.run(doc,plan,settings,control,target);results.report=report;
        check('Batch complete',report.complete && report.success===4);
        for(i=0;i<plan.items.length;i++){
            check('Geometry occurrence '+i,A.sameGeometry(plan.items[i].snapshot,A.snapshot(plan.items[i].graphic)));
            if(plan.items[i].factor===1){check('No upscale '+i,C.close(plan.items[i].ppi,[Number(plan.items[i].graphic.effectivePpi[0]),Number(plan.items[i].graphic.effectivePpi[1])],0.05));}
        }
        check('Shared original still exists',source.exists);
        var sourceCount=0;for(var sourceKey in plan.sources){if(Object.prototype.hasOwnProperty.call(plan.sources,sourceKey)){sourceCount++;}}
        check('One backup for shared source',sourceCount===1);
        var again=A.analyze(doc,settings,[]);check('Repeat protection',again.items.length===0);
        check('External original not deletion candidate',A.deletionCandidates(doc,plan,report).length===0);
        doc.save();results.ok=true;
    }catch(e){results.error=String(e)+' line '+e.line;}
    finally{
        if(doc && doc.isValid){doc.close(SaveOptions.NO);}
        app.scriptPreferences.measurementUnit=oldUnits;
        if(previous && previous.isValid){app.activeDocument=previous;}
        A.write(new File(root.fsName+'/integration.json'),C.json(results));
    }
    return C.json({ok:results.ok,path:root.fsName,error:results.error||''});
})();
