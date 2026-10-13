#target indesign
#targetengine "InDesignImageOptimizer"
#include "lib/core.jsxinc"
#include "lib/photoshop.jsxinc"
#include "lib/indesign.jsxinc"
#include "lib/ui.jsxinc"

(function(){
    IIOAdobe.sourceRoot=File($.fileName).parent.fsName;
    if($.global.__iioUIBusy){alert('Image Optimizer uz bezi.');return;}
    $.global.__iioUIBusy=true;
    try{IIOUI();}catch(e){alert('Image Optimizer: '+String(e));}
    finally{$.global.__iioUIBusy=false;}
})();
