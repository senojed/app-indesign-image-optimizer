// Regression: host operations must run after the modal show() call returns.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
let modal = false, shows = 0, analyses = 0, loads = 0, runs = 0;
let unit = 'original', main;
function outside() { assert.equal(modal, false, 'Host command inside modal ScriptUI dialog'); }
function control(type, text) {
  const c = {type, text: text || '', children: [], items: [], preferredSize: {}, enabled: true};
  let selected = null;
  Object.defineProperty(c, 'selection', {
    get() { return selected; },
    set(v) { selected = typeof v === 'number' ? c.items[v] : v; }
  });
  c.add = (kind, bounds, value) => {
    if (kind === 'item') { const item = {text: value === undefined ? bounds : value, index: c.items.length}; c.items.push(item); return item; }
    const child = control(kind, Array.isArray(value) ? '' : value);
    if (Array.isArray(value)) value.forEach(v => child.add('item', null, v));
    c.children.push(child); return child;
  };
  c.removeAll = () => { c.items = []; selected = null; };
  c.update = () => {};
  c.close = code => { c.result = code; };
  return c;
}
function descendants(c) { return [c, ...c.children.flatMap(descendants)]; }
function button(c, title) { return descendants(c).find(x => x.type === 'button' && x.text === title); }
function Window(type, title) {
  const w = control(type, title);
  let shown = false;
  w.show = () => {
    assert.equal(shown, false, 'A closed native Window must never be shown again');
    shown = true;
    if (type !== 'dialog') return;
    assert.equal(modal, false);
    modal = true;
    try {
      if (title !== 'InDesign Image Optimizer') { w.close(1); return w.result; }
      main = w;
      const edits = descendants(w).filter(c => c.type === 'edittext');
      const dropdowns = descendants(w).filter(c => c.type === 'dropdownlist');
      const checks = descendants(w).filter(c => c.type === 'checkbox');
      shows++;
      if (shows === 1) {
        edits[0].text = '420';
        edits[3].text = '600';
        button(w, 'Nacist sady z Photoshopu').onClick();
      } else if (shows === 2) {
        assert.equal(edits[0].text, '420');
        assert.equal(edits[3].text, '600');
        assert.equal(dropdowns[2].items[0].text, 'Test set');
        edits[0].text = '420'; dropdowns[1].selection = 1; dropdowns[1].onChange(); checks[0].value = true;
        button(w, 'Nahled').onClick();
      } else if (shows === 3) {
        assert.equal(button(w, 'Start').enabled, true);
        assert.equal(edits[0].text, '420');
        assert.equal(checks[0].value, true);
        assert.equal(dropdowns[1].selection.index, 1);
        assert.equal(dropdowns[3].selection.text, 'Test action');
        assert.ok(edits.at(-1).text.includes('420.0/280.0'));
        edits[0].text = '300'; edits[0].onChanging();
        assert.equal(button(w, 'Start').enabled, false);
        button(w, 'Nahled').onClick();
      } else if (shows === 4) {
        assert.equal(button(w, 'Start').enabled, true);
        button(w, 'Start').onClick();
      } else throw Error('Unexpected dialog loop');
      return w.result;
    } finally { modal = false; }
  };
  return w;
}
const doc = {id: 12, saved: true};
const app = {documents: [doc], selection: [], get activeDocument() { outside(); return doc; },
  scriptPreferences: {get measurementUnit() { outside(); return unit; }, set measurementUnit(v) { outside(); unit = v; }}
};
const context = vm.createContext({Window, app, MeasurementUnits: {POINTS: 'points'},
  BridgeTalk: {getSpecifier: () => 'photoshop', isRunning: () => false}, alert: message => { throw Error(message); },
  IIOAdobe: {
    bridge() { outside(); loads++; return {ok: true, version: 'test', sets: [{name: 'Test set', actions: ['Test action']}]}; },
    analyze(document, settings) {
      outside(); analyses++; assert.equal(unit, 'points'); assert.equal(settings.ppi, analyses === 1 ? 420 : 300);
      assert.equal(settings.set, 'Test set'); assert.equal(settings.action, 'Test action');
      return {items: [{source: {name: 'test.jpg'}, ppi: [600,400], factor: settings.ppi/600, output: {name: 'test_001.psd'}}], skipped: []};
    },
    run(document, plan, settings) {
      outside(); runs++; assert.equal(unit, 'original'); assert.equal(settings.ppi,300);
      return {success:1,failed:0,skipped:[],items:[],cancelled:false,complete:false,folder:'test'};
    }
  }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../lib/core.jsxinc'), 'utf8'), context);
vm.runInContext(fs.readFileSync(process.argv[2] || path.join(__dirname, '../lib/ui.jsxinc'), 'utf8'), context);
vm.runInContext('IIOUI();', context);
assert.equal(shows,4);assert.equal(loads,1);assert.equal(analyses,2);assert.equal(runs,1);assert.equal(unit,'original');
console.log('UI regression passed: fresh windows, retained settings/actions/preview, invalidation and host commands outside modal dialog.');
// Explicit Close and native Cancel/Escape must exit without invoking preview or Photoshop.
const beforeCancel = {loads, analyses, runs};
context.IIOUI(w => { button(w, 'Zavrit').onClick(); assert.equal(w.result, 0); return w.result; });
context.IIOUI(w => 2);
context.IIOUI(w => undefined);
assert.deepEqual({loads, analyses, runs}, beforeCancel);
console.log('Close regression passed: button, native Cancel/Escape and window dismissal perform no work.');

context.BridgeTalk.isRunning = () => true;
const initialLoads = loads;
context.IIOUI(w => {
  const lists = descendants(w).filter(c => c.type === 'dropdownlist');
  assert.equal(lists[2].items[0].text, 'Test set');
  assert.equal(lists[1].selection.index, 0, 'Loading must not opt in to running an action');
  assert.equal(descendants(w).find(c=>c.type==='edittext').text, '430');
  return 0;
});
assert.equal(loads, initialLoads + 1);
const realBridge = context.IIOAdobe.bridge;
context.IIOAdobe.bridge = (target,job,control,timeout) => {
  outside(); assert.equal(timeout, 5); throw Error('Photoshop busy');
};
context.IIOUI(w => {
  assert.ok(descendants(w).some(c=>c.type==='statictext' && c.text.includes('Nacteni sad selhalo')));
  return 0;
});
context.BridgeTalk.isRunning = () => false;
context.IIOAdobe.bridge = () => { throw Error('Must not contact a stopped Photoshop'); };
context.IIOUI(w => 0);
context.IIOAdobe.bridge = realBridge;
console.log('Startup actions passed: running-only preload, no action opt-in, bounded failure fallback.');
