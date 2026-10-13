#target indesign
#include "../lib/core.jsxinc"
#include "../lib/photoshop.jsxinc"
#include "../lib/indesign.jsxinc"

(function(){
    var C=IIO,A=IIOAdobe,root=new Folder(File($.fileName).parent.fsName+'/artifacts/safety-'+new Date().getTime()),doc=null,
        previous=app.documents.length?app.activeDocument:null,oldUnits=app.scriptPreferences.measurementUnit,
        out={ok:false,tests:[]},target=BridgeTalk.getSpecifier('photoshop'),linkDir;
    A.sourceRoot=File($.fileName).parent.parent.fsName;A.mkdir(root.parent);A.mkdir(root);linkDir=A.mkdir(new Folder(root.fsName+'/Links'));
    function check(name,ok){out.tests.push({name:name,ok:!!ok});C.assert(ok,name);}
    function ps(code){var bt=new BridgeTalk(),result=null,error=null;bt.target=target;bt.body='eval(decodeURIComponent('+C.quote(encodeURIComponent(code))+'));';bt.onResult=function(r){result=r.body;};bt.onError=function(e){error=e.body;};bt.send(60);C.assert(result!==null&&!error,'Fixture: '+error);return result;}
    var control={cancelled:false,pulse:function(){},status:function(){},progress:function(){}},settings={ppi:300,selected:false,action:'',set:'',timeout:90,offerDelete:false};
    try{
        ps('(function(){var d=null,old=app.displayDialogs,active=app.documents.length?app.activeDocument:null;try{app.displayDialogs=DialogModes.NO;d=app.documents.add(UnitValue(600,"px"),UnitValue(400,"px"),300,"IIO formats",NewDocumentMode.RGB,DocumentFill.WHITE);var paths='+C.json([linkDir.fsName+'/test.jpg',linkDir.fsName+'/test.png',linkDir.fsName+'/test.tif'])+';var opts=[new JPEGSaveOptions(),new PNGSaveOptions(),new TiffSaveOptions()];for(var i=0;i<paths.length;i++){d.saveAs(new File(paths[i]),opts[i],true,Extension.LOWERCASE);}return "OK";}finally{if(d){d.close(SaveOptions.DONOTSAVECHANGES);}app.displayDialogs=old;if(active){app.activeDocument=active;}}})()');
        app.scriptPreferences.measurementUnit=MeasurementUnits.POINTS;doc=app.documents.add();
        var names=['test.jpg','test.png','test.tif'],i,f,g,frames=[];
        for(i=0;i<names.length;i++){
            f=doc.pages[0].rectangles.add({geometricBounds:[40+i*160,40,170+i*160,190]});g=f.place(new File(linkDir.fsName+'/'+names[i]))[0];g.horizontalScale=g.verticalScale=50;
            f.transparencySettings.dropShadowSettings.mode=ShadowMode.DROP;
            f.transparencySettings.dropShadowSettings.opacity=35;
            g.transparencySettings.featherSettings.mode=FeatherMode.STANDARD;
            frames.push(f);
        }
        doc.save(new File(root.fsName+'/test.indd'));
        var selective={ppi:300,selected:true,action:'',set:'',timeout:90,offerDelete:false};
        check('Selected frame only',A.analyze(doc,selective,[frames[0]]).items.length===1);
        frames[1].locked=true;check('Locked frame skipped',A.analyze(doc,settings,[]).items.length===2);frames[1].locked=false;
        var plan=A.analyze(doc,settings,[]);check('JPEG PNG TIFF eligible',plan.items.length===3);
        /* Force an error after the output relink to exercise the actual rollback path. */
        var item=plan.items[0],output=new File(root.fsName+'/rollback.'+item.source.name.split('.').pop());A.copyVerified(item.source,output);item.output=output;
        var realSame=A.sameGeometry,calls=0,caught=false;
        A.sameGeometry=function(a,b){calls++;if(calls===2){return false;}return realSame(a,b);};
        try{A.relink(doc,item,'test-injected-failure');}catch(expected){caught=true;check('Rollback is recoverable',!expected.fatal);}
        finally{A.sameGeometry=realSame;}
        check('Injected failure caught',caught);
        check('Original link restored',A.path(new File(item.graphic.itemLink.filePath))===A.path(item.source));
        check('Geometry and effects restored',A.sameGeometry(item.snapshot,A.snapshot(item.graphic)));
        plan=A.analyze(doc,settings,[]);
        var report=A.run(doc,plan,settings,control,target);out.report=report;check('JPEG PNG TIFF batch successful',report.complete&&report.success===3);
        var candidates=A.deletionCandidates(doc,plan,report);check('Three local originals eligible',candidates.length===3);
        var tamper=plan.items[0];A.write(tamper.verificationCopy,'bad verification');
        check('Changed verification blocks deletion',A.deletionCandidates(doc,plan,report).length===2);
        /* Restore only the disposable verification artifact, never the original. */
        C.assert(tamper.verificationCopy.remove(),'Test verification cleanup');A.copyVerified(tamper.output,tamper.verificationCopy);
        candidates=A.deletionCandidates(doc,plan,report);
        /* This is explicit test-only approval for synthetic sources in this test directory. */
        A.deleteConfirmed(doc,plan,report,candidates);
        check('Synthetic originals deleted after durable save',!doc.modified && report.deletions.length===3);
        for(i=0;i<candidates.length;i++){check('Backup remains '+i,candidates[i].backup.exists&&!candidates[i].file.exists);}
        var newSource=new File(root.fsName+'/cancelled.jpg');A.copyVerified(candidates[0].backup,newSource);
        f=doc.pages[0].rectangles.add({geometricBounds:[10,10,20,20]});f.place(newSource);
        var cancelPlan=A.analyze(doc,settings,[]);control.cancelled=true;var cancelled=A.run(doc,cancelPlan,settings,control,target);
        check('Cancellation preserves source and blocks deletion',cancelled.cancelled&&!cancelled.complete&&newSource.exists&&A.deletionCandidates(doc,cancelPlan,cancelled).length===0);
        out.ok=true;
    }catch(e){out.error=String(e)+' line '+e.line;}
    finally{
        if(doc&&doc.isValid){doc.close(SaveOptions.NO);}app.scriptPreferences.measurementUnit=oldUnits;
        if(previous&&previous.isValid){app.activeDocument=previous;}
        A.write(new File(root.fsName+'/integration.json'),C.json(out));
    }
    return C.json({ok:out.ok,path:root.fsName,error:out.error||''});
})();
