(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))s(u);new MutationObserver(u=>{for(const c of u)if(c.type==="childList")for(const m of c.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&s(m)}).observe(document,{childList:!0,subtree:!0});function a(u){const c={};return u.integrity&&(c.integrity=u.integrity),u.referrerpolicy&&(c.referrerPolicy=u.referrerpolicy),u.crossorigin==="use-credentials"?c.credentials="include":u.crossorigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function s(u){if(u.ep)return;u.ep=!0;const c=a(u);fetch(u.href,c)}})();var w={exports:{}};/**
 * @license Complex.js v2.1.1 12/05/2020
 *
 * Copyright (c) 2020, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/(function(n,r){(function(a){var s=Math.cosh||function(e){return Math.abs(e)<1e-9?1-e:(Math.exp(e)+Math.exp(-e))*.5},u=Math.sinh||function(e){return Math.abs(e)<1e-9?e:(Math.exp(e)-Math.exp(-e))*.5},c=function(e){var t=Math.PI/4;if(-t>e||e>t)return Math.cos(e)-1;var i=e*e;return i*(i*(i*(i*(i*(i*(i*(i/20922789888e3-1/87178291200)+1/479001600)-1/3628800)+1/40320)-1/720)+1/24)-1/2)},m=function(e,t){var i=Math.abs(e),h=Math.abs(t);return i<3e3&&h<3e3?Math.sqrt(i*i+h*h):(i<h?(i=h,h=e/t):h=t/e,i*Math.sqrt(1+h*h))},d=function(){throw SyntaxError("Invalid Param")};function M(e,t){var i=Math.abs(e),h=Math.abs(t);return e===0?Math.log(h):t===0?Math.log(i):i<3e3&&h<3e3?Math.log(e*e+t*t)*.5:(e=e/2,t=t/2,.5*Math.log(e*e+t*t)+Math.LN2)}var P=function(e,t){var i={re:0,im:0};if(e==null)i.re=i.im=0;else if(t!==void 0)i.re=e,i.im=t;else switch(typeof e){case"object":if("im"in e&&"re"in e)i.re=e.re,i.im=e.im;else if("abs"in e&&"arg"in e){if(!Number.isFinite(e.abs)&&Number.isFinite(e.arg))return o.INFINITY;i.re=e.abs*Math.cos(e.arg),i.im=e.abs*Math.sin(e.arg)}else if("r"in e&&"phi"in e){if(!Number.isFinite(e.r)&&Number.isFinite(e.phi))return o.INFINITY;i.re=e.r*Math.cos(e.phi),i.im=e.r*Math.sin(e.phi)}else e.length===2?(i.re=e[0],i.im=e[1]):d();break;case"string":i.im=i.re=0;var h=e.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g),p=1,v=0;h===null&&d();for(var f=0;f<h.length;f++){var I=h[f];I===" "||I==="	"||I===`
`||(I==="+"?p++:I==="-"?v++:I==="i"||I==="I"?(p+v===0&&d(),h[f+1]!==" "&&!isNaN(h[f+1])?(i.im+=parseFloat((v%2?"-":"")+h[f+1]),f++):i.im+=parseFloat((v%2?"-":"")+"1"),p=v=0):((p+v===0||isNaN(I))&&d(),h[f+1]==="i"||h[f+1]==="I"?(i.im+=parseFloat((v%2?"-":"")+I),f++):i.re+=parseFloat((v%2?"-":"")+I),p=v=0))}p+v>0&&d();break;case"number":i.im=0,i.re=e;break;default:d()}return isNaN(i.re)||isNaN(i.im),i};function o(e,t){if(!(this instanceof o))return new o(e,t);var i=P(e,t);this.re=i.re,this.im=i.im}o.prototype={re:0,im:0,sign:function(){var e=this.abs();return new o(this.re/e,this.im/e)},add:function(e,t){var i=new o(e,t);return this.isInfinite()&&i.isInfinite()?o.NAN:this.isInfinite()||i.isInfinite()?o.INFINITY:new o(this.re+i.re,this.im+i.im)},sub:function(e,t){var i=new o(e,t);return this.isInfinite()&&i.isInfinite()?o.NAN:this.isInfinite()||i.isInfinite()?o.INFINITY:new o(this.re-i.re,this.im-i.im)},mul:function(e,t){var i=new o(e,t);return this.isInfinite()&&i.isZero()||this.isZero()&&i.isInfinite()?o.NAN:this.isInfinite()||i.isInfinite()?o.INFINITY:i.im===0&&this.im===0?new o(this.re*i.re,0):new o(this.re*i.re-this.im*i.im,this.re*i.im+this.im*i.re)},div:function(e,t){var i=new o(e,t);if(this.isZero()&&i.isZero()||this.isInfinite()&&i.isInfinite())return o.NAN;if(this.isInfinite()||i.isZero())return o.INFINITY;if(this.isZero()||i.isInfinite())return o.ZERO;e=this.re,t=this.im;var h=i.re,p=i.im,v,f;return p===0?new o(e/h,t/h):Math.abs(h)<Math.abs(p)?(f=h/p,v=h*f+p,new o((e*f+t)/v,(t*f-e)/v)):(f=p/h,v=p*f+h,new o((e+t*f)/v,(t-e*f)/v))},pow:function(e,t){var i=new o(e,t);if(e=this.re,t=this.im,i.isZero())return o.ONE;if(i.im===0){if(t===0&&e>0)return new o(Math.pow(e,i.re),0);if(e===0)switch((i.re%4+4)%4){case 0:return new o(Math.pow(t,i.re),0);case 1:return new o(0,Math.pow(t,i.re));case 2:return new o(-Math.pow(t,i.re),0);case 3:return new o(0,-Math.pow(t,i.re))}}if(e===0&&t===0&&i.re>0&&i.im>=0)return o.ZERO;var h=Math.atan2(t,e),p=M(e,t);return e=Math.exp(i.re*p-i.im*h),t=i.im*p+i.re*h,new o(e*Math.cos(t),e*Math.sin(t))},sqrt:function(){var e=this.re,t=this.im,i=this.abs(),h,p;if(e>=0){if(t===0)return new o(Math.sqrt(e),0);h=.5*Math.sqrt(2*(i+e))}else h=Math.abs(t)/Math.sqrt(2*(i-e));return e<=0?p=.5*Math.sqrt(2*(i-e)):p=Math.abs(t)/Math.sqrt(2*(i+e)),new o(h,t<0?-p:p)},exp:function(){var e=Math.exp(this.re);return this.im,new o(e*Math.cos(this.im),e*Math.sin(this.im))},expm1:function(){var e=this.re,t=this.im;return new o(Math.expm1(e)*Math.cos(t)+c(t),Math.exp(e)*Math.sin(t))},log:function(){var e=this.re,t=this.im;return new o(M(e,t),Math.atan2(t,e))},abs:function(){return m(this.re,this.im)},arg:function(){return Math.atan2(this.im,this.re)},sin:function(){var e=this.re,t=this.im;return new o(Math.sin(e)*s(t),Math.cos(e)*u(t))},cos:function(){var e=this.re,t=this.im;return new o(Math.cos(e)*s(t),-Math.sin(e)*u(t))},tan:function(){var e=2*this.re,t=2*this.im,i=Math.cos(e)+s(t);return new o(Math.sin(e)/i,u(t)/i)},cot:function(){var e=2*this.re,t=2*this.im,i=Math.cos(e)-s(t);return new o(-Math.sin(e)/i,u(t)/i)},sec:function(){var e=this.re,t=this.im,i=.5*s(2*t)+.5*Math.cos(2*e);return new o(Math.cos(e)*s(t)/i,Math.sin(e)*u(t)/i)},csc:function(){var e=this.re,t=this.im,i=.5*s(2*t)-.5*Math.cos(2*e);return new o(Math.sin(e)*s(t)/i,-Math.cos(e)*u(t)/i)},asin:function(){var e=this.re,t=this.im,i=new o(t*t-e*e+1,-2*e*t).sqrt(),h=new o(i.re-t,i.im+e).log();return new o(h.im,-h.re)},acos:function(){var e=this.re,t=this.im,i=new o(t*t-e*e+1,-2*e*t).sqrt(),h=new o(i.re-t,i.im+e).log();return new o(Math.PI/2-h.im,h.re)},atan:function(){var e=this.re,t=this.im;if(e===0){if(t===1)return new o(0,1/0);if(t===-1)return new o(0,-1/0)}var i=e*e+(1-t)*(1-t),h=new o((1-t*t-e*e)/i,-2*e/i).log();return new o(-.5*h.im,.5*h.re)},acot:function(){var e=this.re,t=this.im;if(t===0)return new o(Math.atan2(1,e),0);var i=e*e+t*t;return i!==0?new o(e/i,-t/i).atan():new o(e!==0?e/0:0,t!==0?-t/0:0).atan()},asec:function(){var e=this.re,t=this.im;if(e===0&&t===0)return new o(0,1/0);var i=e*e+t*t;return i!==0?new o(e/i,-t/i).acos():new o(e!==0?e/0:0,t!==0?-t/0:0).acos()},acsc:function(){var e=this.re,t=this.im;if(e===0&&t===0)return new o(Math.PI/2,1/0);var i=e*e+t*t;return i!==0?new o(e/i,-t/i).asin():new o(e!==0?e/0:0,t!==0?-t/0:0).asin()},sinh:function(){var e=this.re,t=this.im;return new o(u(e)*Math.cos(t),s(e)*Math.sin(t))},cosh:function(){var e=this.re,t=this.im;return new o(s(e)*Math.cos(t),u(e)*Math.sin(t))},tanh:function(){var e=2*this.re,t=2*this.im,i=s(e)+Math.cos(t);return new o(u(e)/i,Math.sin(t)/i)},coth:function(){var e=2*this.re,t=2*this.im,i=s(e)-Math.cos(t);return new o(u(e)/i,-Math.sin(t)/i)},csch:function(){var e=this.re,t=this.im,i=Math.cos(2*t)-s(2*e);return new o(-2*u(e)*Math.cos(t)/i,2*s(e)*Math.sin(t)/i)},sech:function(){var e=this.re,t=this.im,i=Math.cos(2*t)+s(2*e);return new o(2*s(e)*Math.cos(t)/i,-2*u(e)*Math.sin(t)/i)},asinh:function(){var e=this.im;this.im=-this.re,this.re=e;var t=this.asin();return this.re=-this.im,this.im=e,e=t.re,t.re=-t.im,t.im=e,t},acosh:function(){var e=this.acos();if(e.im<=0){var t=e.re;e.re=-e.im,e.im=t}else{var t=e.im;e.im=-e.re,e.re=t}return e},atanh:function(){var e=this.re,t=this.im,i=e>1&&t===0,h=1-e,p=1+e,v=h*h+t*t,f=v!==0?new o((p*h-t*t)/v,(t*h+p*t)/v):new o(e!==-1?e/0:0,t!==0?t/0:0),I=f.re;return f.re=M(f.re,f.im)/2,f.im=Math.atan2(f.im,I)/2,i&&(f.im=-f.im),f},acoth:function(){var e=this.re,t=this.im;if(e===0&&t===0)return new o(0,Math.PI/2);var i=e*e+t*t;return i!==0?new o(e/i,-t/i).atanh():new o(e!==0?e/0:0,t!==0?-t/0:0).atanh()},acsch:function(){var e=this.re,t=this.im;if(t===0)return new o(e!==0?Math.log(e+Math.sqrt(e*e+1)):1/0,0);var i=e*e+t*t;return i!==0?new o(e/i,-t/i).asinh():new o(e!==0?e/0:0,t!==0?-t/0:0).asinh()},asech:function(){var e=this.re,t=this.im;if(this.isZero())return o.INFINITY;var i=e*e+t*t;return i!==0?new o(e/i,-t/i).acosh():new o(e!==0?e/0:0,t!==0?-t/0:0).acosh()},inverse:function(){if(this.isZero())return o.INFINITY;if(this.isInfinite())return o.ZERO;var e=this.re,t=this.im,i=e*e+t*t;return new o(e/i,-t/i)},conjugate:function(){return new o(this.re,-this.im)},neg:function(){return new o(-this.re,-this.im)},ceil:function(e){return e=Math.pow(10,e||0),new o(Math.ceil(this.re*e)/e,Math.ceil(this.im*e)/e)},floor:function(e){return e=Math.pow(10,e||0),new o(Math.floor(this.re*e)/e,Math.floor(this.im*e)/e)},round:function(e){return e=Math.pow(10,e||0),new o(Math.round(this.re*e)/e,Math.round(this.im*e)/e)},equals:function(e,t){var i=new o(e,t);return Math.abs(i.re-this.re)<=o.EPSILON&&Math.abs(i.im-this.im)<=o.EPSILON},clone:function(){return new o(this.re,this.im)},toString:function(){var e=this.re,t=this.im,i="";return this.isNaN()?"NaN":this.isInfinite()?"Infinity":(Math.abs(e)<o.EPSILON&&(e=0),Math.abs(t)<o.EPSILON&&(t=0),t===0?i+e:(e!==0?(i+=e,i+=" ",t<0?(t=-t,i+="-"):i+="+",i+=" "):t<0&&(t=-t,i+="-"),t!==1&&(i+=t),i+"i"))},toVector:function(){return[this.re,this.im]},valueOf:function(){return this.im===0?this.re:null},isNaN:function(){return isNaN(this.re)||isNaN(this.im)},isZero:function(){return this.im===0&&this.re===0},isFinite:function(){return isFinite(this.re)&&isFinite(this.im)},isInfinite:function(){return!(this.isNaN()||this.isFinite())}},o.ZERO=new o(0,0),o.ONE=new o(1,0),o.I=new o(0,1),o.PI=new o(Math.PI,0),o.E=new o(Math.E,0),o.INFINITY=new o(1/0,1/0),o.NAN=new o(NaN,NaN),o.EPSILON=1e-15,Object.defineProperty(o,"__esModule",{value:!0}),o.default=o,o.Complex=o,n.exports=o})()})(w);var b={},l={};Object.defineProperty(l,"__esModule",{value:!0});l.polarToRectangular=l.makeBoundedLinear=ae=l.makeLinear=se=l.sum=l.countMap=H=l.initializedArray=re=l.count=B=l.zip=l.FIGURE_SPACE=l.NON_BREAKING_SPACE=l.dateIsValid=l.MIN_DATE=l.MAX_DATE=ne=l.makePromise=l.filterMap=l.pick=l.pickAny=l.csvStringToArray=l.parseTimeT=l.parseIntX=l.parseFloatX=l.getAttribute=l.followPath=l.parseXml=l.testXml=g=l.sleep=l.assertClass=void 0;function pe(n,r,a="Assertion Failed."){const s=u=>{throw new Error(`${a}  Expected type:  ${r.name}.  Found type:  ${u}.`)};if(n===null)s("null");else if(typeof n!="object")s(typeof n);else if(!(n instanceof r))s(n.constructor.name);else return n;throw new Error("wtf")}l.assertClass=pe;function we(n){return new Promise(r=>setTimeout(r,n))}var g=l.sleep=we;function Q(n){const a=new DOMParser().parseFromString(n,"application/xml");for(const s of Array.from(a.querySelectorAll("parsererror")))if(s instanceof HTMLElement)return{error:s};return{parsed:a}}l.testXml=Q;function ve(n){if(n!==void 0)return Q(n)?.parsed?.documentElement}l.parseXml=ve;function J(n,...r){for(const a of r){if(n===void 0)return;if(typeof a=="number")n=n.children[a];else{const s=n.getElementsByTagName(a);if(s.length!=1)return;n=s[0]}}return n}l.followPath=J;function Me(n,r,...a){if(r=J(r,...a),r!==void 0&&!!r.hasAttribute(n))return r.getAttribute(n)??void 0}l.getAttribute=Me;function ee(n){if(n==null)return;const r=parseFloat(n);if(isFinite(r))return r}l.parseFloatX=ee;function te(n){const r=ee(n);if(r!==void 0)return r>Number.MAX_SAFE_INTEGER||r<Number.MIN_SAFE_INTEGER||r!=Math.floor(r)?void 0:r}l.parseIntX=te;function be(n){if(typeof n=="string"&&(n=te(n)),n!=null&&!(n<=0))return new Date(n*1e3)}l.parseTimeT=be;const Ie=n=>{const r=/(,|\r?\n|\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^,\r\n]*))/gi,a=[[]];let s;for(;s=r.exec(n);)s[1].length&&s[1]!==","&&a.push([]),a[a.length-1].push(s[2]!==void 0?s[2].replace(/""/g,'"'):s[3]);return a};l.csvStringToArray=Ie;function ge(n){const r=n.values().next();if(!r.done)return r.value}l.pickAny=ge;function Ee(n){return n[Math.random()*n.length|0]}l.pick=Ee;function Ne(n,r){const a=[];return n.forEach((s,u)=>{const c=r(s,u);c!==void 0&&a.push(c)}),a}l.filterMap=Ne;function ye(){let n,r;return{promise:new Promise((s,u)=>{n=s,r=u}),resolve:n,reject:r}}var ne=l.makePromise=ye;l.MAX_DATE=new Date(864e13);l.MIN_DATE=new Date(-864e13);function xe(n){return isFinite(n.getTime())}l.dateIsValid=xe;l.NON_BREAKING_SPACE="\xA0";l.FIGURE_SPACE="\u2007";function*Ce(...n){const r=n.map(a=>a[Symbol.iterator]());for(;;){const a=r.map(s=>s.next());if(a.some(({done:s})=>s))break;yield a.map(({value:s})=>s)}}var B=l.zip=Ce;function*Pe(n=0,r=1/0,a=1){for(let s=n;s<r;s+=a)yield s}var re=l.count=Pe;function ie(n,r){const a=[];for(let s=0;s<n;s++)a.push(r(s));return a}var H=l.initializedArray=ie;l.countMap=ie;function Te(n){return n.reduce((r,a)=>r+a,0)}var se=l.sum=Te;function Se(n,r,a,s){const u=(s-r)/(a-n);return function(c){return(c-n)*u+r}}var ae=l.makeLinear=Se;function Le(n,r,a,s){a<n&&([n,r,a,s]=[a,s,n,r]);const u=(s-r)/(a-n);return function(c){return c<=n?r:c>=a?s:(c-n)*u+r}}l.makeBoundedLinear=Le;function Ae(n,r){return{x:Math.sin(r)*n,y:Math.cos(r)*n}}l.polarToRectangular=Ae;Object.defineProperty(b,"__esModule",{value:!0});b.createElementFromHTML=b.getHashInfo=b.getAudioBalanceControl=b.getBlobFromCanvas=b.loadDateTimeLocal=x=b.getById=void 0;const oe=l;function Fe(n,r){const a=document.getElementById(n);if(!a)throw new Error("Could not find element with id "+n+".  Expected type:  "+r.name);if(a instanceof r)return a;throw new Error("Element with id "+n+" has type "+a.constructor.name+".  Expected type:  "+r.name)}var x=b.getById=Fe;function ke(n,r,a="milliseconds"){let s;switch(a){case"minutes":{s=r.getSeconds()*1e3+r.getMilliseconds();break}case"seconds":{s=r.getMilliseconds();break}case"milliseconds":{s=0;break}default:throw new Error("wtf")}n.valueAsNumber=+r-r.getTimezoneOffset()*6e4-s}b.loadDateTimeLocal=ke;function Ve(n){const{reject:r,resolve:a,promise:s}=(0,oe.makePromise)();return n.toBlob(u=>{u?a(u):r(new Error("blob is null!"))}),s}b.getBlobFromCanvas=Ve;function Oe(n){const r=new AudioContext,a=r.createMediaElementSource(n),s=new StereoPannerNode(r,{pan:0});return a.connect(s).connect(r.destination),u=>{s.pan.value=u}}b.getAudioBalanceControl=Oe;function _e(){const n=new Map;return/^#?(.*)$/.exec(location.hash.replace("+","%20"))[1].split("&").forEach(s=>{const u=s.split("=",2);if(u.length==2){const c=decodeURIComponent(u[0]),m=decodeURIComponent(u[1]);n.set(c,m)}}),n}b.getHashInfo=_e;function Re(n,r){var a=document.createElement("div");return a.innerHTML=n.trim(),(0,oe.assertClass)(a.firstChild,r,"createElementFromHTML:")}b.createElementFromHTML=Re;function*ue(n,r=[]){if(n.length==0)yield r;else for(let a=0;a<n.length;a++){const s=n[a],u=[...r,s],c=[...n.slice(0,a),...n.slice(a+1)];yield*ue(c,u)}}function X(n,r){if(!(r instanceof Array))return n;if(n.length!=r.length)throw new Error("wtf");let a=1/0,s;for(const u of ue(n)){let c=0;for(const[m,d]of B(u,r))c+=m.sub(d).abs();c<a&&(a=c,s=u)}return s}const D=new w.exports.Complex(1),V={shortName:"Square Root",allWs(n,r){const a=n.sqrt(),s=[a,a.neg()];return X(s,r)},error(n,r){return n.pow(2).sub(r).abs()},branchPoints:[w.exports.Complex.ZERO],initialZ:new w.exports.Complex(4),showSimpleCut:!0},De={shortName:"Natural Log",allWs(n,r){function a(u,c){return u.add(0,c)}const s=n.log();return r?r.map(u=>{const c=u.im-s.im,m=Math.round(c/(Math.PI*2))*Math.PI*2;return a(s,m)}):[a(s,Math.PI*4),a(s,Math.PI*2),s,a(s,-Math.PI*2),a(s,-Math.PI*4)]},error(n,r){return n.exp().sub(r).abs()},branchPoints:[w.exports.Complex.ZERO],initialZ:w.exports.Complex.E,showSimpleCut:!0},Ze={shortName:"\u{1D498}\xB3-\u{1D49B}\u{1D498}-2 = 0",initialZ:w.exports.Complex.ZERO,branchPoints:[new w.exports.Complex(3),new w.exports.Complex({r:3,phi:Math.PI*2/3}),new w.exports.Complex({r:3,phi:Math.PI*4/3})],allWs(n,r){const a=D.sub(n.pow(3).div(27)).sqrt(),s=n.isZero()?D:n.div(n.pow(3).pow(1/3)),u=D.add(a).pow(1/3),c=s.mul(D.sub(a).pow(1/3)),m=u.add(c),d=u.sub(c).mul(0,.866025403785),M=u.add(c).mul(-.5),P=M.add(d),o=M.sub(d);return X([m,P,o],r)},error(n,r){return n.pow(3).sub(r.mul(n)).sub(2).abs()},showSimpleCut:!1},R=[V,De,Ze],q=x("formula",HTMLSelectElement);R.forEach(n=>{const r=document.createElement("option");r.innerText=n.shortName,q.appendChild(r)});const ce=x("bottom",SVGGElement),le=x("main",SVGGElement),Z=x("top",SVGGElement),he=x("positionInfo",HTMLDivElement),qe=x("errorInfo",HTMLDivElement),j=new Intl.NumberFormat("en-US",{minimumSignificantDigits:4,maximumSignificantDigits:4});function Be(n){const r=n.re,a=n.im;let s="";return(r|0)==r?s+=r:s+=j.format(r),a!=0&&(a>0&&(s+="+"),(a|0)==a?s+=a:s+=j.format(a),s+="\u{1D4F2}"),s}class T{static#t=Array.from(document.querySelectorAll("button, select"));static#e;static now(){if(this.#e)throw new Error("Already disabled.");const r=[];this.#t.forEach(a=>{a.disabled||(a.disabled=!0,r.push(a))}),this.#e=r,G()}static restore(){if(!this.#e)throw new Error("Already disabled.");this.#e.forEach(r=>r.disabled=!1),this.#e=void 0,G()}static isEnabled(){return this.#e==null}static isDisabled(){return this.#e!=null}}class Y{constructor(r,a){this.color=r,this.#n=a,this.#r=a;const s=document.createElement("div");s.style.color=r,he.appendChild(s),this.#i=s,this.displayValue();const u=a.re,c=-a.im,m=document.createElementNS("http://www.w3.org/2000/svg","circle");m.cx.baseVal.value=u,m.cy.baseVal.value=c,m.r.baseVal.value=.2,m.style.setProperty("--base-color",r),Z.appendChild(m),this.#t=m;const d=document.createElementNS("http://www.w3.org/2000/svg","rect"),M=.5;d.x.baseVal.value=u-M/2,d.y.baseVal.value=c-M/2,d.width.baseVal.value=M,d.height.baseVal.value=M,d.style.setProperty("--base-color",r),ce.appendChild(d),this.newLine()}#t;#e;get lastSegment(){return this.#e}#n;get currentValue(){return this.#n}set currentValue(r){const a=r.re,s=-r.im,u=this.#e;u.x2.baseVal.value=a,u.y2.baseVal.value=s;const c=this.#t;c.cx.baseVal.value=a,c.cy.baseVal.value=s,this.#n=r,this.displayValue()}#r;undo(){this.currentValue=this.#r}get lastSaved(){return this.#r}#i;displayValue(){this.#i.innerText=Be(this.#n)}newLine(){const r=this.#n,a=r.re,s=-r.im,u=document.createElementNS("http://www.w3.org/2000/svg","line");u.x1.baseVal.value=a,u.y1.baseVal.value=s,u.x2.baseVal.value=a,u.y2.baseVal.value=s,u.setAttribute("stroke",this.color),u.classList.add("active"),this.#e?.classList?.remove("active"),le.appendChild(u),this.#e=u,this.#r=r}save(){this.#n.equals(this.#r)||(this.#e&&this.#e.classList.add("can-be-styled"),this.newLine())}}let E,N,A,y;const F=x("showCut",HTMLInputElement);function G(){F.disabled=T.isDisabled()||!E.showSimpleCut}function fe(){y&&(y.style.display=F.checked?"":"none")}F.addEventListener("click",()=>{fe()});function me(){if(y){const n=15*Math.SQRT2,a=E.branchPoints[0].sub(N.lastSaved).arg(),s=new w.exports.Complex({r:n,phi:a});y.x2.baseVal.value=s.re,y.y2.baseVal.value=-s.im}}function S(n){ce.innerHTML="",le.innerHTML="",Z.innerHTML="",y=void 0,he.innerHTML="",n?(E=n,q.selectedIndex=R.indexOf(n)):E=R[q.selectedIndex];const r=E.initialZ;N=new Y("black",r);const a=E.allWs(r);if(A=a.map((s,u)=>{const c=`hsl(${u/a.length}turn, 100%, 50%)`;return new Y(c,s)}),E.showSimpleCut){y=document.createElementNS("http://www.w3.org/2000/svg","line"),y.classList.add("cut-ray");const s=E.branchPoints[0];y.x1.baseVal.value=s.re,y.y1.baseVal.value=-s.im,me(),fe(),Z.appendChild(y)}G(),de();for(const s of E.branchPoints){const u=document.createElementNS("http://www.w3.org/2000/svg","circle");u.classList.add("branch-point"),u.cx.baseVal.value=s.re,u.cy.baseVal.value=-s.im,u.r.baseVal.value=.1,Z.appendChild(u)}}S();q.addEventListener("change",()=>{S()});x("reset",HTMLButtonElement).addEventListener("click",()=>S(E));function de(){const n=N.currentValue,r=se(A.map(a=>E.error(a.currentValue,n)));qe.innerText=`Total error = ${r}`}function C(n){N.currentValue=n;for(const[r,a]of B(E.allWs(n,A.map(s=>s.lastSaved)),A))a.currentValue=r;de()}const k=document.querySelector("svg"),z=k.createSVGPoint();function He(n){z.x=n.clientX,z.y=n.clientY;const r=z.matrixTransform(k.getScreenCTM().inverse());return new w.exports.Complex(r.x,-r.y)}function L(){N.save(),me(),A.forEach(n=>n.save())}k.addEventListener("mouseleave",()=>{T.isDisabled()||(N.undo(),A.forEach(n=>n.undo()))});k.addEventListener("mousemove",n=>{T.isDisabled()||(C(He(n)),n.buttons&1&&L())});k.addEventListener("mouseup",n=>{T.isDisabled()||L()});function O(n){switch(typeof n){case"number":{const r=R[n];if(!r)throw new Error(`No such formula: ${n}`);S(r);break}case"object":{S(n);break}case"string":{const r=R.find(a=>a.shortName==n);if(!r)throw new Error(`No such formula: "${n}"`);S(r);break}}}const ze={shortName:"Sixth Root",allWs(n,r){const s=n.pow(.16666666666666666),u=H(6,c=>s.mul({r:1,phi:Math.PI*2/6*c}));return X(u,r)},error(n,r){return n.pow(6).sub(r).abs()},branchPoints:[w.exports.Complex.ZERO],initialZ:new w.exports.Complex(6),showSimpleCut:!0};function $(n,r,a){const s=r.sub(n),u=new w.exports.Complex({r:1,phi:2*Math.PI/a}),c=H(Math.abs(a)-1,m=>u.pow(m+1).mul(s).add(n));return c.push(r),c}class W{constructor(r,a,s){this.center=r,this.steps=s,this.#t=a.sub(r)}#t;#e=0;getPosition(r){return r==1&&(r=0),this.#t.mul({r:1,phi:r*2*Math.PI}).add(this.center)}updateNow(r){const a=this.steps*r|0;for(;this.#e<a;)this.#e++,C(this.getPosition(this.#e/this.steps)),L();C(this.getPosition(r))}}function U(n,r){const a=ne(),s=performance.now(),u=s+n,c=ae(s,0,u,1);let m=s;function d(M){try{M>=u?(r.updateNow(1),a.resolve()):(M>m&&r.updateNow(c(M)),requestAnimationFrame(d))}catch(P){a.reject(P)}}return requestAnimationFrame(d),a.promise}function K(n,r,a){const s=r.sub(n);return H(a,u=>r.sub(s.mul((a-u-1)/a)))}function Ge(n){return new w.exports.Complex({re:-n.im,im:n.re})}function _(n){Array.from(k.querySelectorAll(".can-be-styled")).forEach(r=>{const a=r.classList;a.remove("can-be-styled"),a.add(n)})}["thin","fat"].forEach(n=>{x(n,HTMLButtonElement).addEventListener("click",()=>{_(n)})});async function Xe(){F.checked=!1,O(V),await g(100);const n=30;for(const u of $(w.exports.Complex.ZERO,N.lastSaved,n))C(u),await g(3e3/n),L();_("fat"),await g(500);for(const u of $(w.exports.Complex.ZERO,N.lastSaved,n))C(u),L(),await g(3e3/n);await g(2e3),O(V);async function r(u,c=Math.floor(50/u),m=3e3){const d=u*c;let M=N.lastSaved;for(let P=0;P<4;P++){const o=Ge(M);for(const[e,t]of B(K(M,o,d),re()))C(e),await g(m/d),(t+1)%c==0&&L();M=o}}await r(1),_("thin"),await g(500),await r(2),_("fat"),await g(500),await r(30),await g(500),F.checked=!0,O(V);for(const u of K(N.lastSaved,new w.exports.Complex(-4,1),50))C(u),await g(3e3/50);const a=performance.now();function s(u){{const m=(u-a)/3e3*2*Math.PI,d=new w.exports.Complex({re:-4,im:Math.cos(m)});C(d),requestAnimationFrame(s)}}requestAnimationFrame(s)}x("showMeCirclesAndRoots",HTMLButtonElement).addEventListener("click",async()=>{T.now(),F.checked=!1,O(V),await U(5e3,new W(w.exports.Complex.ZERO,N.lastSaved,20)),_("fat"),await g(500),await U(5e3,new W(w.exports.Complex.ZERO,N.lastSaved,20)),T.restore()});window.phil={updateZ(n,r){C(new w.exports.Complex(n,r))},selectFormula:O,sixthRootFormula:ze,demo:Xe,DisableUserInterface:T};
