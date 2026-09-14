(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root&&root.document) api.init(root.document);
})(typeof window!=='undefined'?window:globalThis,function(){
  function setGroupChecked(group, checked){
    if(!group||!group.querySelectorAll) return 0;
    const boxes=[...group.querySelectorAll('input[type="checkbox"]')];
    boxes.forEach(box=>{
      box.checked=!!checked;
      if(typeof box.dispatchEvent==='function'&&typeof Event!=='undefined') box.dispatchEvent(new Event('change',{bubbles:true}));
    });
    return boxes.length;
  }

  function addGroupControls(doc, groupId){
    const group=doc.getElementById(groupId);
    if(!group||doc.querySelector(`[data-logic-filter-controls="${groupId}"]`)) return false;
    const wrap=doc.createElement('div');
    wrap.className='logicFilterControls';
    wrap.dataset.logicFilterControls=groupId;

    const all=doc.createElement('button');
    all.type='button';
    all.textContent='Select All';
    all.className='logicFilterBtn';

    const none=doc.createElement('button');
    none.type='button';
    none.textContent='Select None';
    none.className='logicFilterBtn';

    all.addEventListener('click',()=>setGroupChecked(group,true));
    none.addEventListener('click',()=>setGroupChecked(group,false));
    wrap.append(all,none);
    group.parentNode.insertBefore(wrap,group);
    return true;
  }

  function checkedCount(doc, selector){
    return doc.querySelectorAll(selector+':checked').length;
  }

  function setFeedback(doc,id,msg){
    const el=doc.getElementById(id);
    if(el) el.innerHTML=`<div class="logicBad"><strong>${msg}</strong></div>`;
  }

  function validateBeforeNew(doc, kind){
    if(kind==='square'){
      const main=checkedCount(doc,'#logicSquareCats input');
      if(!main){
        setFeedback(doc,'logicSquareFeedback','Select at least one study category.');
        return false;
      }
      const assertions=doc.querySelector('#logicSquareCats input[value="assertions"]');
      if(assertions&&assertions.checked&&!checkedCount(doc,'#logicAssertionKinds input')){
        setFeedback(doc,'logicSquareFeedback','Select at least one reasoning assertion type, or turn off Reasoning assertions.');
        return false;
      }
      return true;
    }
    if(!checkedCount(doc,'#logicErrorCats input')){
      setFeedback(doc,'logicErrorFeedback','Select at least one argument type.');
      return false;
    }
    return true;
  }

  function bindValidation(doc){
    const sq=doc.getElementById('logicSquareNew');
    if(sq&&!sq.dataset.filterValidationBound){
      sq.dataset.filterValidationBound='1';
      sq.addEventListener('click',e=>{
        if(!validateBeforeNew(doc,'square')){
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },true);
    }
    const er=doc.getElementById('logicErrorNew');
    if(er&&!er.dataset.filterValidationBound){
      er.dataset.filterValidationBound='1';
      er.addEventListener('click',e=>{
        if(!validateBeforeNew(doc,'errors')){
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },true);
    }
  }

  function mount(doc){
    ['logicSquareCats','logicAssertionKinds','logicErrorCats'].forEach(id=>addGroupControls(doc,id));
    bindValidation(doc);
  }

  function init(doc){
    mount(doc);
    if(typeof MutationObserver!=='undefined'){
      const observer=new MutationObserver(()=>mount(doc));
      observer.observe(doc.documentElement||doc.body,{childList:true,subtree:true});
    }
  }

  return {setGroupChecked,addGroupControls,validateBeforeNew,init};
});