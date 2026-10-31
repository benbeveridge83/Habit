(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.HabitGreatBooksVolumeLabels=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const GATEWAY_VOLUME_TITLES={
    '2':'Imaginative Literature I',
    '3':'Imaginative Literature II',
    '4':'Imaginative Literature III',
    '5':'Critical Essays',
    '6':'Man and Society I',
    '7':'Man and Society II',
    '8':'Natural Science',
    '9':'Mathematics',
    '10':'Philosophical Essays'
  };
  function volumeLabel(item){
    if(item&&item.collection==='gateway'){
      const title=GATEWAY_VOLUME_TITLES[String(item.volume||'')];
      if(title)return title;
    }
    return item&&item.collectionLabel?String(item.collectionLabel):(item&&item.collection==='gateway'?'Gateway to the Great Books':'Great Books of the Western World');
  }
  return {volumeLabel,gatewayVolumeTitles:{...GATEWAY_VOLUME_TITLES}};
});
