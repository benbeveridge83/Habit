(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root&&root.document) api.init(root.document, root);
})(typeof window!=='undefined'?window:globalThis,function(){
  function applyLogicVisibilityState(doc, win){
    const title=doc.getElementById('currentSectionLabel');
    if(title) title.textContent='Logic';
    const more=doc.getElementById('mobileMoreBtn');
    if(more) more.classList.add('active');
    doc.querySelectorAll('[data-tab]').forEach(el=>{
      if(el.classList.toggle){
        el.classList.toggle('active', !!(el.dataset&&el.dataset.tab==='logic'));
      }else if(el.dataset&&el.dataset.tab==='logic'){
        el.classList.add('active');
      }else{
        el.classList.remove('active');
      }
    });
    if(win&&typeof win.scrollTo==='function') win.scrollTo({top:0,left:0,behavior:'auto'});
  }

  function init(doc, win){
    const logic=doc.getElementById('tab-logic');
    if(!logic) return;
    const sync=()=>{ if(!logic.classList.contains('hidden')) applyLogicVisibilityState(doc,win); };
    if(typeof MutationObserver!=='undefined'){
      const observer=new MutationObserver(sync);
      observer.observe(logic,{attributes:true,attributeFilter:['class']});
    }
    doc.addEventListener('click',e=>{
      const target=e.target&&e.target.closest?e.target.closest('[data-tab="logic"]'):null;
      if(target) setTimeout(sync,0);
    },true);
  }

  return {applyLogicVisibilityState,init};
});