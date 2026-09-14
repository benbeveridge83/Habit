(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.HabitLogicQuestionBank=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const LABELS={mp:'Modus Ponens',mt:'Modus Tollens',ac:'Affirming the Consequent',da:'Denying the Antecedent',um:'Undistributed Middle',ilmj:'Illicit Major',ilmn:'Illicit Minor',four:'Four-Term Fallacy',noerror:'No error / valid reasoning'};
  const WHYS={
    mp:'This affirms the antecedent and validly concludes the consequent.',
    mt:'This denies the consequent and validly denies the antecedent.',
    ac:'The consequent can be true for some other reason, so it does not prove the antecedent.',
    da:'The antecedent being false does not force the consequent to be false.',
    um:'The middle term is never distributed, so the premises do not establish a link between the two end terms.',
    ilmj:'The major term is distributed in the conclusion but not in the major premise.',
    ilmn:'The minor term is distributed in the conclusion but not in the minor premise.',
    four:'A term changes meaning between the premises, so the argument actually contains four terms.',
    noerror:'The premises support the conclusion by a valid form.'
  };
  const CONDITIONALS=[
    {p:'the library is open',np:'the library is not open',q:'the front lights are on',nq:'the front lights are not on'},
    {p:'a vehicle has fuel',np:'the vehicle does not have fuel',q:'the engine can run',nq:'the engine cannot run'},
    {p:'the password is correct',np:'the password is not correct',q:'the account opens',nq:'the account does not open'},
    {p:'a person is a senator',np:'the person is not a senator',q:'the person is a citizen',nq:'the person is not a citizen'},
    {p:'the sprinkler is running',np:'the sprinkler is not running',q:'the lawn gets wet',nq:'the lawn does not get wet'},
    {p:'a shape is a square',np:'the shape is not a square',q:'the shape has four sides',nq:'the shape does not have four sides'},
    {p:'a number is divisible by four',np:'the number is not divisible by four',q:'the number is even',nq:'the number is not even'},
    {p:'the freezer has power',np:'the freezer does not have power',q:'the indicator is lit',nq:'the indicator is not lit'}
  ];
  function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
  function conditionalStem(kind,x){
    const first=`If ${x.p}, then ${x.q}. `;
    if(kind==='mp')return first+`${cap(x.p)}. Therefore ${x.q}.`;
    if(kind==='mt')return first+`${cap(x.nq)}. Therefore ${x.np}.`;
    if(kind==='ac')return first+`${cap(x.q)}. Therefore ${x.p}.`;
    return first+`${cap(x.np)}. Therefore ${x.nq}.`;
  }
  const FIXED={
    um:[
      'All cats are animals. All dogs are animals. Therefore all dogs are cats.',
      'All roses are plants. All oak trees are plants. Therefore all oak trees are roses.',
      'All lawyers are professionals. All engineers are professionals. Therefore all engineers are lawyers.',
      'All novels are books. All dictionaries are books. Therefore all dictionaries are novels.',
      'All salmon are fish. All tuna are fish. Therefore all tuna are salmon.'
    ],
    ilmj:[
      'All dogs are mammals. No cats are dogs. Therefore no cats are mammals.',
      'All poets are writers. No accountants are poets. Therefore no accountants are writers.',
      'All roses are flowers. No tulips are roses. Therefore no tulips are flowers.',
      'All surgeons are doctors. No teachers are surgeons. Therefore no teachers are doctors.',
      'All violins are instruments. No pianos are violins. Therefore no pianos are instruments.'
    ],
    ilmn:[
      'All poets are writers. All poets are dreamers. Therefore all dreamers are writers.',
      'All pilots are trained workers. All pilots are travelers. Therefore all travelers are trained workers.',
      'All sparrows are birds. All sparrows are small animals. Therefore all small animals are birds.',
      'All judges are lawyers. All judges are public officials. Therefore all public officials are lawyers.',
      'All oak trees are plants. All oak trees are long-lived things. Therefore all long-lived things are plants.'
    ],
    four:[
      'All banks keep money safe. River banks are banks. Therefore river banks keep money safe.',
      'Every bat is a mammal. A baseball bat is a bat. Therefore a baseball bat is a mammal.',
      'All seals are animals. An official seal is a seal. Therefore an official seal is an animal.',
      'Every crane is a bird. A construction crane is a crane. Therefore a construction crane is a bird.',
      'Every club is an organization. A golf club is a club. Therefore a golf club is an organization.'
    ],
    noerror:[
      'All surgeons are doctors. All doctors are professionals. Therefore all surgeons are professionals.',
      'All squares are rectangles. All rectangles are quadrilaterals. Therefore all squares are quadrilaterals.',
      'No reptiles are mammals. All snakes are reptiles. Therefore no snakes are mammals.',
      'All judges are lawyers. Some judges are writers. Therefore some writers are lawyers.',
      'No birds are mammals. Some pets are birds. Therefore some pets are not mammals.'
    ]
  };
  function getExamples(kind){
    const answer=LABELS[kind]||LABELS.noerror,why=WHYS[kind]||WHYS.noerror;
    if(['mp','mt','ac','da'].includes(kind))return CONDITIONALS.map(x=>({stem:conditionalStem(kind,x),answer,why}));
    return (FIXED[kind]||FIXED.noerror).map(stem=>({stem,answer,why}));
  }
  function pick(kind,previousStem,randomFn){
    const all=getExamples(kind),pool=all.length>1?all.filter(x=>x.stem!==previousStem):all;
    const rnd=typeof randomFn==='function'?randomFn:Math.random;
    const index=Math.min(pool.length-1,Math.max(0,Math.floor(rnd()*pool.length)));
    return {...pool[index]};
  }
  return {getExamples,pick,labels:{...LABELS}};
});
