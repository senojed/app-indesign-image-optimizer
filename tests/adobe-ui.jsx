#target indesign
#include "../lib/core.jsxinc"
#include "../lib/photoshop.jsxinc"
#include "../lib/indesign.jsxinc"
#include "../lib/ui.jsxinc"
(function(){
    var previous=app.documents.length?app.activeDocument:null,doc=null,
        root=new Folder(File($.fileName).parent.fsName+'/artifacts/ui-'+new Date().getTime()),shown=0,error='',out={ok:false};
    IIOAdobe.sourceRoot=File($.fileName).parent.parent.fsName;
    function findAll(c,type,result){if(c.type===type){result.push(c);}if(c.children){for(var i=0;i<c.children.length;i++){findAll(c.children[i],type,result);}}return result;}
    function click(w,title){var buttons=findAll(w,'button',[]);for(var i=0;i<buttons.length;i++){if(buttons[i].text===title){buttons[i].onClick();return;}}throw new Error('Missing button '+title);}
    try{
        IIOAdobe.mkdir(root.parent);IIOAdobe.mkdir(root);
        doc=app.documents.add();doc.save(new File(root.fsName+'/ui-test.indd'));
        IIOUI(function(w){
            shown++;w.layout.layout(true);
            var edits=findAll(w,'edittext',[]),lists=findAll(w,'dropdownlist',[]);
            IIO.assert(edits.length>=5 && lists.length===4,'Incomplete native control tree.');
            if(shown===1){edits[0].text='420';click(w,'Nacist sady z Photoshopu');return 11;}
            if(shown===2){IIO.assert(edits[0].text==='420','Lost PPI');IIO.assert(lists[2].items.length>0,'No action sets');out.actionSets=lists[2].items.length;click(w,'Nahled');return 10;}
            if(shown===3){IIO.assert(edits[0].text==='420','Lost PPI after preview');IIO.assert(edits[edits.length-1].text.indexOf('PRESKOCENO:')>=0,'Missing preview');w.close(0);return 0;}
            throw new Error('Unexpected dialog count');
        });
        IIO.assert(shown===3,'Incomplete UI roundtrip');
        out.ok=true;out.dialogs=shown;out.indesign=app.version;
    }catch(e){out.error=String(e)+' line '+e.line;}
    finally{
        // No global Window/alert overrides and no modal show() in this construction test.
        if(doc&&doc.isValid){doc.close(SaveOptions.NO);}if(previous&&previous.isValid){app.activeDocument=previous;}
        IIOAdobe.write(new File(root.fsName+'/integration.json'),IIO.json(out));
    }
    out.path=root.fsName;return IIO.json(out);
})();
