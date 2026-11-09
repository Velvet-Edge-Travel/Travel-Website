(function(root){
'use strict';
const sections={flights:'flight',stays:'stay',transfers:'transfer',experiences:'experience',golf:'golf',days:'day',extras:'extra',advice:'advice'};
const clone=x=>JSON.parse(JSON.stringify(x));
const cents=v=>v===''||v==null?null:(Number.isFinite(Number(v))?Math.round(Number(v)*100):null);
function amount(v){
 const s=String(v??'').trim();
 if(!s)return null;
 // Deliberately reject ranges, per-person expressions and ambiguous decimal conventions.
 const m=s.match(/^(?:(?:GBP|EUR|USD|JPY|CHF|AUD|CAD)\s*|[£€$¥]\s*)?([\d,]+(?:\.\d{1,2})?)(?:\s*(?:GBP|EUR|USD|JPY|CHF|AUD|CAD))?(?:\s+for the group)?$/i);
 if(!m||!/^\d+(?:\.\d{1,2})?$|^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(m[1]))return null;
 return cents(m[1].replaceAll(',',''));
}
const ref=v=>String(v||'').trim().toLocaleLowerCase();
function parse(text,file='quote.json',hash=''){
 let data;
 if(/^\s*</.test(text)){
  const m=text.match(/<script\b(?=[^>]*\bid=["']velvet-quote-data["'])[^>]*>([\s\S]*?)<\/script\s*>/i);
  if(!m)throw Error('This HTML has no embedded quote data. Export an editable JSON draft; legacy HTML cannot be safely reconstructed.');
  data=JSON.parse(m[1]);
 }else data=JSON.parse(text);
 if(!data||!data.reference||!data.title||!Object.keys(sections).some(k=>Array.isArray(data[k])))throw Error('Not a recognised Velvet Edge quote draft.');
 const currency=String(data.currency||'').toUpperCase();
 if(!/^[A-Z]{3}$/.test(currency))throw Error('Quote currency is missing or invalid.');
 const warnings=[],items=[],known=new Set();
 if(data.format==='velvet-edge-client-quote')warnings.push('Client quote snapshot: private supplier costs, markups and internal components are unavailable. Import the editable draft for full reconciliation.');
 for(const [key,type]of Object.entries(sections)){
  (data[key]||[]).forEach((raw,i)=>{
   const path=`${key}[${i}]`, active=data.enabledSections?.[type]!==false;
   const treatment=raw.pricingTreatment||({'Included in holiday price':'included','Optional extra — not included':'optional','Pay locally — not included':'local'}[raw.priceStatus])||(['day','extra','advice'].includes(type)?'information':'included');
   const base=cents(raw.baseCost), textual=raw.clientSellingPrice||raw.price||raw.budget;
   if(base===null&&!textual){if(active&&treatment==='included')warnings.push(`${path}: missing price`);return;}
   const quantity=raw.costBasis==='person'?Number(data.payingTravellers):raw.costBasis==='unit'?Number(raw.costQuantity||1):1;
   const valid=Number.isInteger(quantity)&&quantity>0;
   const markupPercent=Number(raw.markupPercent||0),fixed=cents(raw.markupAmount||0);
   let total=base===null?amount(textual):valid&&Number.isFinite(markupPercent)&&fixed!==null?base*quantity+Math.round(base*quantity*markupPercent/100+1e-8)+fixed:null;
   if(total!==null&&(!Number.isSafeInteger(total)||total<0))total=null;
   const description=Object.entries(raw).filter(([k,v])=>typeof v==='string'&&v&&!/image|gallery|photo|baseCost|markup|costBasis|costQuantity|entryId|Visibility|website|pricingTreatment|SellingPrice|PriceTreatment/i.test(k)).map(([k,v])=>`${k}: ${v}`).join('\n');
   const id=raw.entryId||path;
   if(known.has(id))throw Error(`Duplicate entry ID: ${id}`);known.add(id);
   const title=raw.hotel||raw.name||raw.title||[raw.direction,raw.airline,raw.flightNumber].filter(Boolean).join(' · ')||[raw.transport,raw.from,raw.to].filter(Boolean).join(' → ')||path;
   const textCurrency=String(textual||'').match(/\b(GBP|EUR|USD|JPY|CHF|AUD|CAD)\b/i)?.[1]?.toUpperCase()||(/£/.test(textual||'')?'GBP':/€/.test(textual||'')?'EUR':null);
   const rawCurrency=String(raw.currency||textCurrency||currency).toUpperCase();
   if(textCurrency&&base!==null&&textCurrency!==currency){total=null;warnings.push(`${path}: base cost currency and textual currency conflict; total needs review`);}
   if(rawCurrency!==currency)warnings.push(`${path}: currency differs from quote; excluded from quote reconciliation`);
   if(total===null)warnings.push(`${path}: unparsed price ${textual||raw.baseCost}`);
   if(!active)warnings.push(`${path}: priced component in a disabled section; retained, excluded from total`);
   if(textual&&base!==null&&amount(textual)!==total)warnings.push(`${path}: additional price text differs or needs review: ${textual}`);
   items.push({id,title,description,category:key,currency:rawCurrency,unitPrice:base,quantity:valid?quantity:null,taxes:raw.taxes??null,fees:raw.fees??null,total,estimatedCost:base!==null&&valid?base*quantity:null,treatment,active,status:'quote',supplier:raw.supplier||'',confirmation:'',dueDate:'',actualCost:null,payments:[],paymentLink:'',allocation:'',notes:'',history:[],source:{file,hash,path,entryId:raw.entryId||null,raw:clone(raw)}});
  });
 }
 function scan(obj,path=''){
  for(const [k,v]of Object.entries(obj||{})){
   const p=path?`${path}.${k}`:k;
   if(v&&typeof v==='object')scan(v,p);
   else if(v!==''&&v!=null){
    if(/price|cost|budget|tax|fee|amount/i.test(k)&&!['baseCost','markupAmount','markupPercent','costBasis','costQuantity','price','budget','priceStatus','pricingTreatment','pricingMode','clientSellingPrice','clientPriceTreatment','totalPrice','perPerson'].includes(k))warnings.push(`Unmapped monetary field ${p}: ${String(v).slice(0,140)}`);
    if(typeof v==='string'&&!/image|photo|gallery|price|perPerson|cost|budget|amount|markup|currency|website|url/i.test(k)&&/(?:[£€$¥]\s*\d|\b(?:GBP|EUR|USD|JPY)\s*\d|\d\s*(?:GBP|EUR|USD|JPY)\b)/i.test(v))warnings.push(`Price mentioned in free text ${p}: review for an untracked component (${v.slice(0,160)})`);
   }
  }
 }scan(data);
 return {id:ref(data.reference),reference:data.reference,title:data.title,currency,declaredTotal:amount(data.totalPrice),perPerson:amount(data.perPerson),payingTravellers:Number(data.payingTravellers)||null,items,warnings,source:{file,hash,importedAt:new Date().toISOString()},history:[]};
}
const fingerprint=i=>JSON.stringify([i.title,i.description,i.currency,i.unitPrice,i.quantity,i.taxes,i.fees,i.total,i.estimatedCost,i.treatment,i.active]);
function diff(old,next){return next.items.map(i=>({id:i.id,title:i.title,change:!old?.items.find(o=>o.id===i.id)?'new':fingerprint(old.items.find(o=>o.id===i.id))===fingerprint(i)?'unchanged':'changed'})).concat((old?.items||[]).filter(i=>!next.items.some(n=>n.id===i.id)).map(i=>({id:i.id,title:i.title,change:'absent — retained for review'})));}
function merge(old,next){
 if(!old)return clone(next);
 if(next.source.hash&&old.source.hash===next.source.hash)return clone(old);
 const result=clone(next),date=new Date().toISOString();
 result.items=next.items.map(n=>{const o=old.items.find(i=>i.id===n.id);if(!o)return clone(n);if(fingerprint(o)===fingerprint(n))return {...clone(o),source:clone(n.source)};
  return {...clone(o),pendingImport:clone(n),history:[...o.history,{date,reason:'Import differs; local record retained pending review',incoming:clone(n.source),incomingTotal:n.total}]};});
 for(const o of old.items)if(!next.items.some(i=>i.id===o.id))result.items.push({...clone(o),missingFromImport:true});
 result.history=[...(old.history||[]),{date,reason:'Confirmed import',source:next.source,changes:diff(old,next)}];return result;
}
function balances(quote,travellers=[]){
 const groups={};const group=c=>groups[c]||= {quote:0,estimated:0,actual:0,includedActual:0,includedActualMissing:0,actualMissing:0,supplierPaid:0,payables:0,customerAgreed:0,customerPaid:0,receivables:0,optional:0,local:0};
 for(const i of quote.items){const g=group(i.currency);if(i.status==='cancelled'||!i.active)continue;
  if(i.treatment==='included')g.quote+=i.total||0;else if(i.treatment==='optional')g.optional+=i.total||0;else if(i.treatment==='local')g.local+=i.total||0;
  if(i.treatment==='information')continue;
  if(i.treatment==='included'){g.estimated+=i.estimatedCost||0;g.includedActual+=i.actualCost||0;if(i.actualCost===null)g.includedActualMissing++;}g.actual+=i.actualCost||0;if(i.actualCost===null)g.actualMissing++;
  const paid=i.payments.reduce((s,p)=>s+p.amount,0);g.supplierPaid+=paid;g.payables+=i.actualCost===null?0:i.actualCost-paid;
 }
 for(const t of travellers.filter(t=>ref(t.quoteId||t.quoteRef)===quote.id)){
  const g=group(t.currency),agreed=cents(t.total)||0,paid=(t.installments||[]).reduce((s,p)=>s+(cents(p.paid)||0),0);
  g.customerAgreed+=agreed;g.customerPaid+=paid;g.receivables+=agreed-paid;
 }return groups;
}
const api={parse,merge,diff,balances,cents,amount,ref,clone};if(typeof module!=='undefined')module.exports=api;else root.TrackerCore=api;
})(globalThis);

