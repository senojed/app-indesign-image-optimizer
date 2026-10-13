#target indesign
#targetengine "InDesignImageOptimizer"
#include "lib/en/core.jsxinc"
#include "lib/en/photoshop.jsxinc"
#include "lib/en/indesign.jsxinc"
#include "lib/en/ui.jsxinc"

(function(){
    IIOAdobe.sourceRoot=File($.fileName).parent.fsName;
    if($.global.__iioUIBusy){alert("Image Optimizer is already running.");return;}
    $.global.__iioUIBusy=true;
    try{IIOUI();}catch(e){alert('Image Optimizer: '+String(e));}
    finally{$.global.__iioUIBusy=false;}
})();
