(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HabitLogicRearrangementCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const METHODS=['conversion','obversion','contraposition'];
const typeNames={A:'Universal affirmative',E:'Universal negative',I:'Particular affirmative',O:'Particular negative'};
const valid={conversion:['E','I'],obversion:['A','E','I','O'],contraposition:['A','O']};
const complements=x=>'non-'+x;
function sentence(form,s,p){switch(form){case 'A':return `All ${s} are ${p}.`;case 'E':return `No ${s} are ${p}.`;case 'I':return `Some ${s} are ${p}.`;case 'O':return `Some ${s} are not ${p}.`;default:throw Error('Invalid categorical form '+form);}}
function transform(form,s,p,method){if(!METHODS.includes(method))throw Error('Unknown method');if(!typeNames[form])throw Error('Unknown form');const ok=valid[method].includes(form);let out='';if(method==='conversion'){out=sentence(form,p,s);}else if(method==='obversion'){out=sentence(({A:'E',E:'A',I:'O',O:'I'})[form],s,complements(p));}else{out=sentence(form,complements(p),complements(s));}return {valid:ok,output:ok?out:null,candidate:out,method,form,source:sentence(form,s,p)};}
function explain(method,form){if(method==='obversion')return 'Obversion always preserves equivalence: change affirmative/negative quality, and replace the predicate with its complement.';
if(method==='conversion')return valid.conversion.includes(form)?'Conversion swaps subject and predicate without changing quantity or quality. This is equivalent for E and I propositions.':'Simple conversion of A or O does not generally preserve truth. Converting A by limitation requires an extra existence assumption and is not equivalent.';
return valid.contraposition.includes(form)?'Contraposition swaps the terms and complements both. It preserves truth for A and O categorical propositions.':'For E and I propositions, simple contraposition is not generally a truth-preserving equivalence.';}
function figure(n){return ({1:['M','P','S','M'],2:['P','M','S','M'],3:['M','P','M','S'],4:['P','M','M','S']})[n]||null;}
function syllogism(mood,n,S='S',P='P',M='M'){const f=figure(n);if(!f||!/[AEIO]{3}/.test(mood)||mood.length!==3)throw Error('Invalid mood or figure');const terms={S,P,M};return {mood,figure:n,propositions:[sentence(mood[0],terms[f[0]],terms[f[1]]),sentence(mood[1],terms[f[2]],terms[f[3]]),sentence(mood[2],S,P)]};}
function unique(list){return [...new Set(list)];}
function transformationQuestion(method,form,mode='natural',terms){const sym=mode==='symbolic';const pair=terms||(sym?['S','P']:['students','musicians']);const [s,p]=pair;const t=transform(form,s,p,method);const invalidText=`No generally equivalent ${method} exists for this ${form}-proposition.`;let choices=unique([t.valid?t.output:invalidText,
 sentence('A',p,s),sentence('E',p,s),sentence('I',p,s),sentence('O',p,s),
 sentence('A',complements(p),complements(s)),sentence('E',s,complements(p)),
 sentence('O',complements(p),complements(s)),sentence('I',s,complements(p)),
 sentence('A',s,complements(p)),sentence('E',complements(p),complements(s)),
 invalidText]);
 const answer=t.valid?t.output:invalidText;
 choices=unique([answer,...choices.filter(x=>x!==answer)]).slice(0,5);
 const passage=mode==='lsat'?`A researcher is evaluating the following categorical claim: “${t.source}” The researcher wants to use ${method} to reorganize the logical form, rather than infer a merely related proposition. Which option gives the result of that operation without introducing an unlicensed existence assumption?`: `Apply ${method} to this ${form}-statement: ${t.source}`;
 return {kind:method,form,mode,stem:passage,choices,answer,why:explain(method,form),source:t.source};}
function syllogismQuestion(kind='mood',mood='EIO',fig=1,terms=['students','professors','artists']){
 const [S,P,M]=terms;const example=syllogism(mood,fig,S,P,M);const stem=`Major premise: ${example.propositions[0]}\nMinor premise: ${example.propositions[1]}\nConclusion: ${example.propositions[2]}\n\n${kind==='figure'?'What is the syllogism’s figure?':kind==='mood'?'What is its mood?':'Which mood and figure identify it?'}`;
 let choices,answer;
 if(kind==='figure'){choices=['Figure 1','Figure 2','Figure 3','Figure 4'];answer=`Figure ${fig}`;}
 else if(kind==='mood'){choices=unique([mood,'AAA','EAE','AII','EIO','AEE','IAI','OAO','AAI']).slice(0,6);answer=mood;}
 else {answer=`${mood}–${fig}`;choices=unique([answer,`${mood}–${(fig%4)+1}`,`AAA–${fig}`,`EAE–${fig}`,`AII–${fig}`]).slice(0,5);}
 return {kind,stem,answer,choices,why:`Mood ${mood} = major premise ${mood[0]}, minor premise ${mood[1]}, conclusion ${mood[2]}. Figure ${fig} has the middle term placed ${figure(fig).join('–')}, reading major subject/predicate then minor subject/predicate. Mood and figure classify form, not necessarily validity.`};
}
return {METHODS,typeNames,valid,sentence,transform,explain,figure,syllogism,transformationQuestion,syllogismQuestion};
});