"use strict";(self.webpackChunktrakify=self.webpackChunktrakify||[]).push([[578],{2578:(U,y,s)=>{s.d(y,{j:()=>Y});var t=s(4650),v=s(3261),S=s(4754),p=s(858),M=s(8255),x=s(136),c=s(7392),h=s(6895),w=s(3162),T=s(4859),d=s(1629),l=s(953),b=s(833),Q=s(3628),G={};function ot(){return G}function K(n){var o=new Date(Date.UTC(n.getFullYear(),n.getMonth(),n.getDate(),n.getHours(),n.getMinutes(),n.getSeconds(),n.getMilliseconds()));return o.setUTCFullYear(n.getFullYear()),n.getTime()-o.getTime()}function it(n,o){(0,b.Z)(2,arguments);var e=(0,l.Z)(n),i=(0,l.Z)(o),r=e.getTime()-i.getTime();return r<0?-1:r>0?1:r}function V(n,o){if(null==n)throw new TypeError("assign requires that input parameter not be null or undefined");for(var e in o)Object.prototype.hasOwnProperty.call(o,e)&&(n[e]=o[e]);return n}function rt(n){return V({},n)}var at={lessThanXSeconds:{one:"less than a second",other:"less than {{count}} seconds"},xSeconds:{one:"1 second",other:"{{count}} seconds"},halfAMinute:"half a minute",lessThanXMinutes:{one:"less than a minute",other:"less than {{count}} minutes"},xMinutes:{one:"1 minute",other:"{{count}} minutes"},aboutXHours:{one:"about 1 hour",other:"about {{count}} hours"},xHours:{one:"1 hour",other:"{{count}} hours"},xDays:{one:"1 day",other:"{{count}} days"},aboutXWeeks:{one:"about 1 week",other:"about {{count}} weeks"},xWeeks:{one:"1 week",other:"{{count}} weeks"},aboutXMonths:{one:"about 1 month",other:"about {{count}} months"},xMonths:{one:"1 month",other:"{{count}} months"},aboutXYears:{one:"about 1 year",other:"about {{count}} years"},xYears:{one:"1 year",other:"{{count}} years"},overXYears:{one:"over 1 year",other:"over {{count}} years"},almostXYears:{one:"almost 1 year",other:"almost {{count}} years"}};function J(n){return function(){var o=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=o.width?String(o.width):n.defaultWidth,i=n.formats[e]||n.formats[n.defaultWidth];return i}}var ut={date:J({formats:{full:"EEEE, MMMM do, y",long:"MMMM do, y",medium:"MMM d, y",short:"MM/dd/yyyy"},defaultWidth:"full"}),time:J({formats:{full:"h:mm:ss a zzzz",long:"h:mm:ss a z",medium:"h:mm:ss a",short:"h:mm a"},defaultWidth:"full"}),dateTime:J({formats:{full:"{{date}} 'at' {{time}}",long:"{{date}} 'at' {{time}}",medium:"{{date}}, {{time}}",short:"{{date}}, {{time}}"},defaultWidth:"full"})},pt={lastWeek:"'last' eeee 'at' p",yesterday:"'yesterday at' p",today:"'today at' p",tomorrow:"'tomorrow at' p",nextWeek:"eeee 'at' p",other:"P"};function I(n){return function(o,e){var r;if("formatting"===(null!=e&&e.context?String(e.context):"standalone")&&n.formattingValues){var a=n.defaultFormattingWidth||n.defaultWidth,u=null!=e&&e.width?String(e.width):a;r=n.formattingValues[u]||n.formattingValues[a]}else{var m=n.defaultWidth,P=null!=e&&e.width?String(e.width):n.defaultWidth;r=n.values[P]||n.values[m]}return r[n.argumentCallback?n.argumentCallback(o):o]}}function O(n){return function(o){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},i=e.width,r=i&&n.matchPatterns[i]||n.matchPatterns[n.defaultMatchWidth],a=o.match(r);if(!a)return null;var g,u=a[0],m=i&&n.parsePatterns[i]||n.parsePatterns[n.defaultParseWidth],P=Array.isArray(m)?Tt(m,function(C){return C.test(u)}):St(m,function(C){return C.test(u)});g=n.valueCallback?n.valueCallback(P):P,g=e.valueCallback?e.valueCallback(g):g;var E=o.slice(u.length);return{value:g,rest:E}}}function St(n,o){for(var e in n)if(n.hasOwnProperty(e)&&o(n[e]))return e}function Tt(n,o){for(var e=0;e<n.length;e++)if(o(n[e]))return e}const Jt={code:"en-US",formatDistance:function(o,e,i){var r,a=at[o];return r="string"==typeof a?a:1===e?a.one:a.other.replace("{{count}}",e.toString()),null!=i&&i.addSuffix?i.comparison&&i.comparison>0?"in "+r:r+" ago":r},formatLong:ut,formatRelative:function(o,e,i,r){return pt[o]},localize:{ordinalNumber:function(o,e){var i=Number(o),r=i%100;if(r>20||r<10)switch(r%10){case 1:return i+"st";case 2:return i+"nd";case 3:return i+"rd"}return i+"th"},era:I({values:{narrow:["B","A"],abbreviated:["BC","AD"],wide:["Before Christ","Anno Domini"]},defaultWidth:"wide"}),quarter:I({values:{narrow:["1","2","3","4"],abbreviated:["Q1","Q2","Q3","Q4"],wide:["1st quarter","2nd quarter","3rd quarter","4th quarter"]},defaultWidth:"wide",argumentCallback:function(o){return o-1}}),month:I({values:{narrow:["J","F","M","A","M","J","J","A","S","O","N","D"],abbreviated:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],wide:["January","February","March","April","May","June","July","August","September","October","November","December"]},defaultWidth:"wide"}),day:I({values:{narrow:["S","M","T","W","T","F","S"],short:["Su","Mo","Tu","We","Th","Fr","Sa"],abbreviated:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],wide:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},defaultWidth:"wide"}),dayPeriod:I({values:{narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"}},defaultWidth:"wide",formattingValues:{narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"}},defaultFormattingWidth:"wide"})},match:{ordinalNumber:function Et(n){return function(o){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},i=o.match(n.matchPattern);if(!i)return null;var r=i[0],a=o.match(n.parsePattern);if(!a)return null;var u=n.valueCallback?n.valueCallback(a[0]):a[0];u=e.valueCallback?e.valueCallback(u):u;var m=o.slice(r.length);return{value:u,rest:m}}}({matchPattern:/^(\d+)(th|st|nd|rd)?/i,parsePattern:/\d+/i,valueCallback:function(o){return parseInt(o,10)}}),era:O({matchPatterns:{narrow:/^(b|a)/i,abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,wide:/^(before christ|before common era|anno domini|common era)/i},defaultMatchWidth:"wide",parsePatterns:{any:[/^b/i,/^(a|c)/i]},defaultParseWidth:"any"}),quarter:O({matchPatterns:{narrow:/^[1234]/i,abbreviated:/^q[1234]/i,wide:/^[1234](th|st|nd|rd)? quarter/i},defaultMatchWidth:"wide",parsePatterns:{any:[/1/i,/2/i,/3/i,/4/i]},defaultParseWidth:"any",valueCallback:function(o){return o+1}}),month:O({matchPatterns:{narrow:/^[jfmasond]/i,abbreviated:/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,wide:/^(january|february|march|april|may|june|july|august|september|october|november|december)/i},defaultMatchWidth:"wide",parsePatterns:{narrow:[/^j/i,/^f/i,/^m/i,/^a/i,/^m/i,/^j/i,/^j/i,/^a/i,/^s/i,/^o/i,/^n/i,/^d/i],any:[/^ja/i,/^f/i,/^mar/i,/^ap/i,/^may/i,/^jun/i,/^jul/i,/^au/i,/^s/i,/^o/i,/^n/i,/^d/i]},defaultParseWidth:"any"}),day:O({matchPatterns:{narrow:/^[smtwf]/i,short:/^(su|mo|tu|we|th|fr|sa)/i,abbreviated:/^(sun|mon|tue|wed|thu|fri|sat)/i,wide:/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i},defaultMatchWidth:"wide",parsePatterns:{narrow:[/^s/i,/^m/i,/^t/i,/^w/i,/^t/i,/^f/i,/^s/i],any:[/^su/i,/^m/i,/^tu/i,/^w/i,/^th/i,/^f/i,/^sa/i]},defaultParseWidth:"any"}),dayPeriod:O({matchPatterns:{narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i},defaultMatchWidth:"any",parsePatterns:{any:{am:/^a/i,pm:/^p/i,midnight:/^mi/i,noon:/^no/i,morning:/morning/i,afternoon:/afternoon/i,evening:/evening/i,night:/night/i}},defaultParseWidth:"any"})},options:{weekStartsOn:0,firstWeekContainsDate:1}};var X=6e4,W=1440,$=30*W,q=365*W;function Bt(n,o,e){var i,r,a;(0,b.Z)(2,arguments);var u=ot(),m=null!==(i=null!==(r=e?.locale)&&void 0!==r?r:u.locale)&&void 0!==i?i:Jt;if(!m.formatDistance)throw new RangeError("locale must contain localize.formatDistance property");var P=it(n,o);if(isNaN(P))throw new RangeError("Invalid time value");var E,C,g=V(rt(e),{addSuffix:Boolean(e?.addSuffix),comparison:P});P>0?(E=(0,l.Z)(o),C=(0,l.Z)(n)):(E=(0,l.Z)(n),C=(0,l.Z)(o));var _,H=String(null!==(a=e?.roundingMethod)&&void 0!==a?a:"round");if("floor"===H)_=Math.floor;else if("ceil"===H)_=Math.ceil;else{if("round"!==H)throw new RangeError("roundingMethod must be 'floor', 'ceil' or 'round'");_=Math.round}var f,z=C.getTime()-E.getTime(),F=z/X,Ie=K(C)-K(E),k=(z-Ie)/X,j=e?.unit;if("second"===(f=j?String(j):F<1?"second":F<60?"minute":F<W?"hour":k<$?"day":k<q?"month":"year")){var Oe=_(z/1e3);return m.formatDistance("xSeconds",Oe,g)}if("minute"===f){var De=_(F);return m.formatDistance("xMinutes",De,g)}if("hour"===f){var Fe=_(F/60);return m.formatDistance("xHours",Fe,g)}if("day"===f){var ke=_(k/W);return m.formatDistance("xDays",ke,g)}if("month"===f){var nt=_(k/$);return 12===nt&&"month"!==j?m.formatDistance("xYears",1,g):m.formatDistance("xMonths",nt,g)}if("year"===f){var Ae=_(k/q);return m.formatDistance("xYears",Ae,g)}throw new RangeError("unit must be 'second', 'minute', 'hour', 'day', 'month' or 'year'")}class R{transform(o,e){if(!o)return"";const i=new Date(o);if(function A(n,o){(0,b.Z)(2,arguments);var e=(0,l.Z)(n).getTime(),i=(0,l.Z)(o.start).getTime(),r=(0,l.Z)(o.end).getTime();if(!(i<=r))throw new RangeError("Invalid interval");return e>=i&&e<=r}(i,{start:new Date,end:(0,Q.Z)(new Date,1)})){const a=(0,h.p6)(o," (E.)","en-US"),u=function Ht(n,o){return(0,b.Z)(1,arguments),Bt(n,Date.now(),o)}(i,{roundingMethod:"ceil",addSuffix:!0});return function zt(n){return n.charAt(0).toUpperCase()+n.slice(1)}(u)+a}return(0,h.p6)(o,e,"en-US")}static#t=this.\u0275fac=function(e){return new(e||R)};static#e=this.\u0275pipe=t.Yjl({name:"relativeDate",type:R,pure:!0,standalone:!0})}var jt=s(3022);function Gt(n,o){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(4);t.xp6(1),t.hij(" ",e.tmdbShow.number_of_episodes," episodes ")}}function Kt(n,o){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(4);t.xp6(1),t.hij(" ",e.progress.aired-e.progress.completed," remaining ")}}function Vt(n,o){1&n&&(t.ynx(0),t._uU(1," \xb7 "),t.BQk())}function Xt(n,o){if(1&n&&(t.ynx(0),t.YNc(1,Gt,2,1,"ng-container",5),t.YNc(2,Kt,2,1,"ng-container",5),t.YNc(3,Vt,2,0,"ng-container",5),t.BQk()),2&n){const e=t.oxw(3);t.xp6(1),t.Q6J("ngIf",e.tmdbShow&&(!e.progress||0===e.progress.completed)),t.xp6(1),t.Q6J("ngIf",e.progress&&e.progress.completed>0&&e.progress.aired-e.progress.completed),t.xp6(1),t.Q6J("ngIf",(null==e.tmdbShow||null==e.tmdbShow.networks?null:e.tmdbShow.networks[0])&&(!e.progress||e.progress&&e.progress.aired-e.progress.completed))}}function $t(n,o){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(3);t.xp6(1),t.hij(" ",null==e.tmdbShow.networks||null==e.tmdbShow.networks[0]?null:e.tmdbShow.networks[0].name," ")}}function qt(n,o){if(1&n&&(t.ynx(0),t.YNc(1,Xt,4,3,"ng-container",5),t.YNc(2,$t,2,1,"ng-container",5),t.BQk()),2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("ngIf",e.withEpisodesCount),t.xp6(1),t.Q6J("ngIf",null==e.tmdbShow.networks?null:e.tmdbShow.networks[0])}}function te(n,o){if(1&n&&(t.ynx(0),t.YNc(1,qt,3,2,"ng-container",5),t.BQk()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.tmdbShow)}}function ee(n,o){1&n&&t._uU(0,"...")}function ne(n,o){if(1&n){const e=t.EpF();t.TgZ(0,"button",9),t.NdJ("click",function(r){t.CHM(e);const a=t.oxw(2);return a.preventEvent(r),t.KtG(a.isFavorite?a.removeFavorite.emit(a.show):a.addFavorite.emit(a.show))}),t.TgZ(1,"mat-icon",10),t._uU(2),t.qZA()()}if(2&n){const e=t.oxw(2);t.ekj("remove",!e.isFavorite),t.xp6(2),t.Oqu(e.isFavorite?"star":"star_outline")}}function oe(n,o){if(1&n&&(t.TgZ(0,"div",6)(1,"h2",7),t._uU(2),t.qZA(),t.YNc(3,ne,3,3,"button",8),t.qZA()),2&n){const e=t.oxw();t.xp6(2),t.AsE(" ",(null==e.tmdbShow?null:e.tmdbShow.name)||e.show.title," ",e.withYear&&null!==e.show.year?" ("+e.show.year+")":""," "),t.xp6(1),t.Q6J("ngIf",e.isLoggedIn)}}function ie(n,o){if(1&n&&t._UZ(0,"mat-progress-bar",11),2&n){const e=t.oxw();t.Q6J("value",e.progress.completed/e.progress.aired*100)}}function re(n,o){if(1&n&&(t.ynx(0),t.TgZ(1,"p",12),t._uU(2),t.ALo(3,"number"),t.ALo(4,"number"),t.qZA(),t.TgZ(5,"p",13),t._uU(6),t.ALo(7,"relativeDate"),t.ALo(8,"date"),t.qZA(),t.BQk()),2&n){const e=t.oxw(2);t.xp6(2),t.lnq(" S",t.xi3(3,4,e.episode.season,"2.0-0"),"E",t.xi3(4,7,e.episode.number,"2.0-0")," ",e.episode.title," "),t.xp6(4),t.hij(" ",e.withRelativeDate&&e.episode.first_aired?t.xi3(7,10,e.episode.first_aired,"d. MMM. yyyy (E.)"):t.xi3(8,13,e.episode.first_aired,"d. MMM. yyyy (E.)")," ")}}function ae(n,o){if(1&n&&(t.ynx(0),t.TgZ(1,"p",14),t._uU(2),t.qZA(),t.BQk()),2&n){const e=t.oxw(2);t.xp6(2),t.Oqu(null==e.tmdbShow?null:e.tmdbShow.status)}}function se(n,o){if(1&n&&(t.ynx(0),t.YNc(1,re,9,16,"ng-container",5),t.YNc(2,ae,3,1,"ng-container",5),t.ALo(3,"isShowEnded"),t.BQk()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.episode),t.xp6(1),t.Q6J("ngIf",null===e.episode&&!t.lcZ(3,2,e.tmdbShow))}}class L{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe}preventEvent(o){o.stopPropagation(),o.preventDefault()}static#t=this.\u0275fac=function(e){return new(e||L)};static#e=this.\u0275cmp=t.Xpm({type:L,selectors:[["t-show-item-content"]],inputs:{isLoggedIn:"isLoggedIn",show:"show",showWatched:"showWatched",progress:"progress",tmdbShow:"tmdbShow",isFavorite:"isFavorite",episode:"episode",withYear:"withYear",withEpisode:"withEpisode",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite"},standalone:!0,features:[t.jDz],decls:7,vars:5,consts:[["ticker","",1,"mat-small","top-subtitle"],[4,"ngIf","ngIfElse"],["tmdbShowLoading",""],["class","title-wrapper",4,"ngIf"],["class","progress-bar","mode","determinate","color","accent","aria-label","Shows episodes completed percentage of all aired episodes",3,"value",4,"ngIf"],[4,"ngIf"],[1,"title-wrapper"],["ticker","",1,"mat-headline-6","title"],["mat-icon-button","","aria-label","Favorite","class","favorite-button",3,"remove","click",4,"ngIf"],["mat-icon-button","","aria-label","Favorite",1,"favorite-button",3,"click"],[1,"favorite-icon"],["mode","determinate","color","accent","aria-label","Shows episodes completed percentage of all aired episodes",1,"progress-bar",3,"value"],["ticker","",1,"mat-small","next-episode-text"],["ticker","",1,"mat-small","next-episode-date"],[1,"mat-small","show-status"]],template:function(e,i){if(1&e&&(t.TgZ(0,"p",0),t.YNc(1,te,2,1,"ng-container",1),t.YNc(2,ee,1,0,"ng-template",null,2,t.W1O),t.qZA(),t.YNc(4,oe,4,3,"div",3),t.YNc(5,ie,1,1,"mat-progress-bar",4),t.YNc(6,se,4,4,"ng-container",5)),2&e){const r=t.MAs(3);t.xp6(1),t.Q6J("ngIf",void 0!==i.tmdbShow)("ngIfElse",r),t.xp6(3),t.Q6J("ngIf",i.show),t.xp6(1),t.Q6J("ngIf",i.withProgressbar&&i.progress&&i.showWatched),t.xp6(1),t.Q6J("ngIf",i.withEpisode)}},dependencies:[h.ez,h.O5,h.JJ,h.uU,d.d,T.ot,T.RK,c.Ps,c.Hw,w.Cv,w.pW,R,jt.t],styles:["[_nghost-%COMP%]{display:block;width:100%;overflow:hidden}.title-wrapper[_ngcontent-%COMP%]{display:flex;align-items:center;margin-bottom:.125rem;--icon-size: 1rem}@media (min-width: 576px){.title-wrapper[_ngcontent-%COMP%]{margin-bottom:.5rem;--icon-size: 1.25rem}}@media (min-width: 1200px){.title-wrapper[_ngcontent-%COMP%]{margin-bottom:.75rem}}.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{margin-bottom:0;margin-right:.25rem;font-size:1rem;font-weight:400;line-height:1.5rem}@media (min-width: 576px){.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{font-size:1.5rem;font-weight:500;line-height:2rem}}.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]:hover{cursor:pointer}.title-wrapper[_ngcontent-%COMP%]   .favorite-button[_ngcontent-%COMP%]{width:var(--icon-size);height:var(--icon-size);font-size:var(--icon-size);padding:0}.title-wrapper[_ngcontent-%COMP%]   .favorite-button.remove[_ngcontent-%COMP%]{display:none}.title-wrapper[_ngcontent-%COMP%]:hover   .favorite-button.remove[_ngcontent-%COMP%]{display:flex}.title-wrapper[_ngcontent-%COMP%]   .favorite-icon[_ngcontent-%COMP%]{width:var(--icon-size);height:var(--icon-size);font-size:var(--icon-size);line-height:var(--icon-size)}.progress-bar[_ngcontent-%COMP%]{margin-bottom:.25rem}@media (min-width: 576px){.progress-bar[_ngcontent-%COMP%]{margin-bottom:.75rem}}@media (min-width: 1200px){.progress-bar[_ngcontent-%COMP%]{margin-bottom:1rem}}.top-subtitle[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}@media (min-width: 576px){.top-subtitle[_ngcontent-%COMP%]{margin-bottom:.25rem}}@media (min-width: 1200px){.top-subtitle[_ngcontent-%COMP%]{margin-bottom:.5rem}}.next-episode-text[_ngcontent-%COMP%]{margin:0}@media (min-width: 576px){.next-episode-text[_ngcontent-%COMP%]{margin-bottom:.25rem}}@media (min-width: 1200px){.next-episode-text[_ngcontent-%COMP%]{margin-bottom:.5rem}}.next-episode-date[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}@media (min-width: 576px){.next-episode-date[_ngcontent-%COMP%]{margin-top:.25rem}}@media (min-width: 1200px){.next-episode-date[_ngcontent-%COMP%]{margin-top:.5rem}}.show-status[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}"],changeDetection:0})}function de(n,o){if(1&n){const e=t.EpF();t.TgZ(0,"img",5),t.NdJ("load",function(){t.CHM(e);const r=t.oxw();return t.KtG(r.posterLoaded=!0)}),t.qZA()}if(2&n){const e=o.ngIf,i=t.oxw();t.Q6J("src",i.posterPrefixLg+e,t.LSH)("alt",i.tmdbShow||i.show?((null==i.tmdbShow?null:i.tmdbShow.name)||(null==i.show?null:i.show.title))+" Poster":"Poster"),t.uIk("loading",void 0!==i.initialIndex&&i.initialIndex<=4?null:"lazy")("fetchpriority",void 0!==i.initialIndex&&i.initialIndex<=4?"high":null)}}function le(n,o){if(1&n){const e=t.EpF();t.TgZ(0,"img",6),t.NdJ("load",function(){t.CHM(e);const r=t.oxw();return t.KtG(r.posterLoaded=!0)}),t.qZA()}if(2&n){const e=t.oxw();t.Q6J("priority",void 0!==e.initialIndex&&e.initialIndex<=4)}}function ce(n,o){1&n&&(t.TgZ(0,"button",11)(1,"mat-icon"),t._uU(2,"checkbox"),t.qZA()())}function he(n,o){if(1&n){const e=t.EpF();t.TgZ(0,"button",12),t.NdJ("click",function(r){t.CHM(e);const a=t.oxw(3);return a.preventEvent(r),t.KtG(a.isWatchlist?a.removeShow.emit(a.show):a.addShow.emit(a.show))}),t.TgZ(1,"mat-icon"),t._uU(2),t.qZA()()}if(2&n){const e=t.oxw(3);t.uIk("aria-label",e.isWatchlist?"Remove show":"Add show")("data-test-id",e.isWatchlist?"remove-button":"add-button"),t.xp6(2),t.Oqu(e.isWatchlist?"remove":"add")}}function ue(n,o){if(1&n&&(t.ynx(0),t.YNc(1,ce,3,0,"button",9),t.YNc(2,he,3,3,"button",10),t.BQk()),2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("ngIf",e.progress||e.showWatched),t.xp6(1),t.Q6J("ngIf",void 0!==e.isWatchlist&&!(e.progress||e.showWatched))}}const me=function(n,o,e){return{show:n,isFavorite:o,isHidden:e}};function pe(n,o){if(1&n){const e=t.EpF();t.ynx(0),t.TgZ(1,"button",13),t.NdJ("click",function(r){t.CHM(e);const a=t.oxw(2);return t.KtG(a.preventEvent(r))}),t.TgZ(2,"mat-icon"),t._uU(3,"more_vert"),t.qZA()(),t.BQk()}if(2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("matMenuTriggerFor",e.menu)("matMenuTriggerData",t.kEZ(2,me,e.show,e.isFavorite,e.isHidden))}}function ge(n,o){if(1&n&&(t.TgZ(0,"div",7),t.YNc(1,ue,3,2,"ng-container",8),t.YNc(2,pe,4,6,"ng-container",8),t.qZA()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.withAddButtons&&e.show),t.xp6(1),t.Q6J("ngIf",!e.withAddButtons&&e.menu&&e.show)}}class Z{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe,this.addShow=new t.vpe,this.removeShow=new t.vpe,this.posterLoaded=!1,this.posterPrefixLg=x.Lq}ngOnChanges(o){o.i?.firstChange&&void 0!==o.i?.currentValue&&void 0===this.initialIndex&&(this.initialIndex=o.i.currentValue)}preventEvent(o){o.stopPropagation(),o.preventDefault()}static#t=this.\u0275fac=function(e){return new(e||Z)};static#e=this.\u0275cmp=t.Xpm({type:Z,selectors:[["t-show-item"]],inputs:{isLoggedIn:"isLoggedIn",show:"show",showWatched:"showWatched",progress:"progress",tmdbShow:"tmdbShow",tmdbSeason:"tmdbSeason",isFavorite:"isFavorite",isHidden:"isHidden",isWatchlist:"isWatchlist",episode:"episode",withYear:"withYear",withEpisode:"withEpisode",withAddButtons:"withAddButtons",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate",menu:"menu"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite",addShow:"addShow",removeShow:"removeShow"},standalone:!0,features:[t.TTD,t.jDz],decls:6,vars:15,consts:[[1,"poster"],["width","185","height","278",3,"src","alt","load",4,"ngIf","ngIfElse"],["imgFallback",""],[3,"isLoggedIn","show","showWatched","progress","tmdbShow","isFavorite","episode","withYear","withEpisode","withEpisodesCount","withProgressbar","withRelativeDate","addFavorite","removeFavorite"],["class","show-button",4,"ngIf"],["width","185","height","278",3,"src","alt","load"],["ngSrc","assets/poster.png","width","154","height","231","alt","Poster",3,"priority","load"],[1,"show-button"],[4,"ngIf"],["mat-icon-button","","aria-label","Show added","disabled","","data-test-id","show-added",4,"ngIf"],["mat-icon-button","",3,"click",4,"ngIf"],["mat-icon-button","","aria-label","Show added","disabled","","data-test-id","show-added"],["mat-icon-button","",3,"click"],["mat-icon-button","","aria-label","Menu","data-test-id","show-item-menu",3,"matMenuTriggerFor","matMenuTriggerData","click"]],template:function(e,i){if(1&e&&(t.TgZ(0,"div",0),t.YNc(1,de,1,4,"img",1),t.YNc(2,le,1,1,"ng-template",null,2,t.W1O),t.qZA(),t.TgZ(4,"t-show-item-content",3),t.NdJ("addFavorite",function(a){return i.addFavorite.emit(a)})("removeFavorite",function(a){return i.removeFavorite.emit(a)}),t.qZA(),t.YNc(5,ge,3,2,"div",4)),2&e){const r=t.MAs(3);t.xp6(1),t.Q6J("ngIf",i.posterPrefixLg&&((null==i.tmdbSeason?null:i.tmdbSeason.poster_path)||(null==i.tmdbShow?null:i.tmdbShow.poster_path)))("ngIfElse",r),t.xp6(3),t.Q6J("isLoggedIn",i.isLoggedIn)("show",i.show)("showWatched",i.showWatched)("progress",i.progress)("tmdbShow",i.tmdbShow)("isFavorite",i.isFavorite)("episode",i.episode)("withYear",i.withYear)("withEpisode",i.withEpisode)("withEpisodesCount",i.withEpisodesCount)("withProgressbar",i.withProgressbar)("withRelativeDate",i.withRelativeDate),t.xp6(1),t.Q6J("ngIf",i.isLoggedIn)}},dependencies:[c.Ps,c.Hw,h.ez,h.O5,w.Cv,M.Tx,M.p6,h.Zd,T.ot,T.RK,L],styles:["[_nghost-%COMP%]{display:grid;grid-template-columns:5rem 1fr;align-items:center;gap:1rem;width:100%;height:100%}@media (min-width: 576px){[_nghost-%COMP%]{grid-template-columns:6rem 1fr}}@media (min-width: 1200px){[_nghost-%COMP%]{grid-template-columns:9.625rem 1fr}}.poster[_ngcontent-%COMP%]{aspect-ratio:2/3;cursor:pointer;border-radius:var(--border-radius);overflow:hidden;display:flex;place-items:center}.show-button[_ngcontent-%COMP%]{grid-column:3;margin-left:-1rem}"],changeDetection:0})}var B=s(4633),fe=s(3322),ve=s(7579),we=s(4968),_e=s(8372),tt=s(2722);class D{constructor(o){this.ref=o,this.element=o.nativeElement}static#t=this.\u0275fac=function(e){return new(e||D)(t.Y36(t.SBq))};static#e=this.\u0275dir=t.lG2({type:D,selectors:[["","tTransitionGroupItem",""]],standalone:!0})}class N{constructor(o){this.cdr=o,this.destroy$=new ve.x,this.moveClass="move"}ngOnInit(){(0,we.R)(window,"scroll").pipe((0,_e.b)(10),(0,tt.R)(this.destroy$)).subscribe(()=>{this.cdr.markForCheck(),this.refreshPosition("previousPosition")})}ngAfterViewInit(){requestAnimationFrame(()=>this.refreshPosition("previousPosition")),this.items?.changes.pipe((0,tt.R)(this.destroy$)).subscribe(o=>{this.cdr.markForCheck(),o.forEach(r=>r.previousPosition=r.newPosition||r.previousPosition),o.forEach(r=>r.onMove?.()),this.refreshPosition("newPosition"),o.forEach(r=>r.previousPosition=r.previousPosition||r.newPosition);const e=()=>{o.forEach(this.applyTranslation),this._forceReflow=document.body.offsetHeight,this.items?.forEach(this.runTransition.bind(this))};o.some(r=>!(!r.previousPosition||!r.newPosition)&&(!!(r.previousPosition.left-r.newPosition.left)||!!(r.previousPosition.top-r.newPosition.top)))?e():requestAnimationFrame(()=>{this.refreshPosition("newPosition"),e()})})}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}runTransition(o){!o.moved||(o.element.classList.add(this.moveClass),o.element.style.transform=o.element.style.transitionDuration="",o.element.addEventListener("transitionend",o.onMove=e=>{(!e||/transform$/.test(e.propertyName))&&(o.onMove&&o.element.removeEventListener("transitionend",o.onMove),o.onMove=null,o.element.classList.remove(this.moveClass))}))}refreshPosition(o){this.items?.forEach(e=>{e[o]=e.element.getBoundingClientRect()})}applyTranslation(o){if(o.moved=!1,!o.previousPosition||!o.newPosition)return;const e=o.previousPosition.left-o.newPosition.left,i=o.previousPosition.top-o.newPosition.top;(e||i)&&(o.moved=!0,o.element.style.transform="translate("+e+"px,"+i+"px)",o.element.style.transitionDuration="0s")}static#t=this.\u0275fac=function(e){return new(e||N)(t.Y36(t.sBO))};static#e=this.\u0275dir=t.lG2({type:N,selectors:[["","tTransitionGroup",""]],contentQueries:function(e,i,r){if(1&e&&t.Suo(r,D,4),2&e){let a;t.iGM(a=t.CRH())&&(i.items=a)}},standalone:!0})}var et=s(3238),xe=s(1521);const be=function(n,o,e){return{show:n,season:o,episode:e}},Pe=function(n){return{show:n}},Ce=function(n){return{back:n}};function ye(n,o){if(1&n){const e=t.EpF();t.TgZ(0,"a",5),t.ALo(1,"ngGenericPipe"),t.ALo(2,"showSlug"),t.ALo(3,"ngGenericPipe"),t.ALo(4,"showSlug"),t.TgZ(5,"mat-list-item")(6,"t-show-item",6),t.NdJ("addFavorite",function(r){t.CHM(e);const a=t.oxw(3);return t.KtG(a.addFavorite.emit(r))})("removeFavorite",function(r){t.CHM(e);const a=t.oxw(3);return t.KtG(a.removeFavorite.emit(r))})("addShow",function(r){t.CHM(e);const a=t.oxw(3);return t.KtG(a.add.emit(r))})("removeShow",function(r){t.CHM(e);const a=t.oxw(3);return t.KtG(a.remove.emit(r))}),t.qZA()()()}if(2&n){const e=o.$implicit,i=t.oxw(3);t.Q6J("routerLink",e.show?i.withLinkToEpisode&&e.nextEpisode?t.xi3(1,19,t.kEZ(29,be,t.lcZ(2,22,e.show),e.nextEpisode.season+"",e.nextEpisode.number+""),i.paths.episode):t.xi3(3,24,t.VKq(33,Pe,t.lcZ(4,27,e.show)),i.paths.show):null)("state",t.VKq(35,Ce,i.back)),t.xp6(6),t.Q6J("isLoggedIn",i.isLoggedIn)("show",e.show)("showWatched",e.showWatched)("progress",e.showProgress)("tmdbShow",e.tmdbShow)("tmdbSeason",e.tmdbSeason)("episode",e.nextEpisode)("isFavorite",e.isFavorite)("isHidden",e.isHidden)("isWatchlist",!!e.isWatchlist)("withYear",i.withYear)("withEpisode",i.withEpisode)("withAddButtons",i.withAddButtons)("withEpisodesCount",i.withEpisodesCount)("withProgressbar",i.withProgressbar)("withRelativeDate",i.withRelativeDate)("menu",i.menu)}}function Me(n,o){if(1&n&&(t.TgZ(0,"mat-list",3),t.YNc(1,ye,7,37,"a",4),t.qZA()),2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("ngForOf",e.showsInfos)("ngForTrackBy",e.id)}}function Se(n,o){if(1&n&&(t.ynx(0),t.YNc(1,Me,2,2,"mat-list",2),t.BQk()),2&n){const e=t.oxw(),i=t.MAs(2);t.xp6(1),t.Q6J("ngIf",e.showsInfos.length)("ngIfElse",i)}}const Te=function(){return{}};function Ee(n,o){if(1&n&&(t.TgZ(0,"h2",7),t._uU(1,"No shows in the list."),t.qZA(),t.TgZ(2,"p"),t._uU(3,"Change the filter."),t.qZA(),t.TgZ(4,"p"),t._uU(5,"Or "),t.TgZ(6,"a",8),t.ALo(7,"ngGenericPipe"),t._uU(8,"add"),t.qZA(),t._uU(9," a show."),t.qZA()),2&n){const e=t.oxw();t.xp6(6),t.Q6J("routerLink",t.xi3(7,1,t.DdM(4,Te),e.paths.addShow))}}class Y{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe,this.add=new t.vpe,this.remove=new t.vpe,this.paths=v}id(o,e){return""+e.show?.ids.trakt+e.nextEpisode?.ids.trakt}static#t=this.\u0275fac=function(e){return new(e||Y)};static#e=this.\u0275cmp=t.Xpm({type:Y,selectors:[["t-shows"]],inputs:{isLoggedIn:"isLoggedIn",showsInfos:"showsInfos",withYear:"withYear",withEpisode:"withEpisode",withAddButtons:"withAddButtons",withLinkToEpisode:"withLinkToEpisode",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate",menu:"menu",back:"back"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite",add:"add",remove:"remove"},standalone:!0,features:[t.jDz],decls:3,vars:1,consts:[[4,"ngIf"],["noShows",""],["class","shows","tTransitionGroup","",4,"ngIf","ngIfElse"],["tTransitionGroup","",1,"shows"],["class","show","tTransitionGroupItem","","matRipple","","tHideRippleOnScroll","","data-test-id","show",3,"routerLink","state",4,"ngFor","ngForOf","ngForTrackBy"],["tTransitionGroupItem","","matRipple","","tHideRippleOnScroll","","data-test-id","show",1,"show",3,"routerLink","state"],[3,"isLoggedIn","show","showWatched","progress","tmdbShow","tmdbSeason","episode","isFavorite","isHidden","isWatchlist","withYear","withEpisode","withAddButtons","withEpisodesCount","withProgressbar","withRelativeDate","menu","addFavorite","removeFavorite","addShow","removeShow"],[1,"mat-body-2"],[1,"inline-link",3,"routerLink"]],template:function(e,i){1&e&&(t.YNc(0,Se,2,2,"ng-container",0),t.YNc(1,Ee,10,5,"ng-template",null,1,t.W1O)),2&e&&t.Q6J("ngIf",i.showsInfos)},dependencies:[S.r,S.a,p.Bz,p.rH,Z,B.ie,B.i$,B.Tg,fe.v,h.O5,h.sg,N,D,et.si,et.wG,xe.g],styles:[".shows[_ngcontent-%COMP%]{margin-top:-1rem}.shows[_ngcontent-%COMP%]   .show.move[_ngcontent-%COMP%]{transition:transform .3s}.loading-item[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center}.loading-title[_ngcontent-%COMP%]{margin-bottom:0}.inline-link[_ngcontent-%COMP%]{display:inline;text-decoration:underline}"],changeDetection:0})}},1629:(U,y,s)=>{s.d(y,{d:()=>p});var t=s(4650);const v=["ticker",""],S=["*"];class p{constructor(){this.tickerIf=!0,this.indent=0}get duration(){return-12*this.indent}onMouseEnter({scrollWidth:x,clientWidth:c}){this.indent=c-x}static#t=this.\u0275fac=function(c){return new(c||p)};static#e=this.\u0275cmp=t.Xpm({type:p,selectors:[["","ticker",""]],hostVars:6,hostBindings:function(c,h){1&c&&t.NdJ("mouseenter",function(T){return h.onMouseEnter(T.target)}),2&c&&(t.Udp("--indent",h.indent,"px")("transition-duration",h.duration,"ms"),t.ekj("ticker",h.tickerIf))},inputs:{tickerIf:"tickerIf"},standalone:!0,features:[t.jDz],attrs:v,ngContentSelectors:S,decls:1,vars:0,template:function(c,h){1&c&&(t.F$t(),t.Hsn(0))},styles:[".ticker[_nghost-%COMP%]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:text-indent linear}.ticker[_nghost-%COMP%]:hover{text-indent:var(--indent);text-overflow:clip;-webkit-user-select:none;user-select:none}"],changeDetection:0})}},1521:(U,y,s)=>{s.d(y,{g:()=>w});var t=s(5861),v=s(7579),S=s(4968),p=s(8372),M=s(2722),x=s(5698),c=s(4650),h=s(3238);class w{constructor(d,l,b,A){this.el=d,this.matRipple=l,this.ngZone=b,this.cdr=A,this.destroy$=new v.x,this.touchTapDelay=100,this.isClick=new v.x,this.isNearThreshold=10,this.pointerDownEvents=["mousedown","touchstart"],this.pointerUpEvents=["mouseup","mouseleave","touchend","touchcancel","dragstart"],this.pointerMoveEvents=["pointermove","touchmove"],this.pointerUpEventsRegistered=!1,this.pointerMoveEventsRegistered=!1,this.isPointerDown=!1,this.isTouch=!1,this.matRipple.disabled=!0}ngOnInit(){(0,S.R)(window,"scroll").pipe((0,p.b)(10),(0,M.R)(this.destroy$)).subscribe(()=>{this.cdr.markForCheck(),this.matRipple.fadeOutAll()})}ngOnDestroy(){this.removeEvents(),clearTimeout(this.timeoutId),this.destroy$.next(),this.destroy$.complete()}onPointerDown(d){0===d.button&&(this.isTouch="touch"===d.pointerType,this.isPointerDown=!0,this.downPosition={x:d.clientX,y:d.clientY},this.currentPosition={x:d.clientX,y:d.clientY},this.isClick.pipe((0,x.q)(1),(0,M.R)(this.destroy$)).subscribe(()=>{this.cdr.markForCheck(),this.matRipple.launch(d.x,d.y,{persistent:!0}),clearTimeout(this.timeoutId)}),this.pointerUpEventsRegistered||(this.registerEvents(this.pointerUpEvents),this.pointerUpEventsRegistered=!0),this.isTouch?(clearTimeout(this.timeoutId),this.timeoutId=window.setTimeout(()=>{this.isNear(this.currentPosition,this.downPosition)&&this.isClick.next(void 0)},this.touchTapDelay),this.pointerMoveEventsRegistered||(this.registerEvents(this.pointerMoveEvents),this.pointerMoveEventsRegistered=!0)):this.isClick.next(void 0))}registerEvents(d){this.ngZone.runOutsideAngular(()=>{d.forEach(l=>{this.el.nativeElement.addEventListener(l,this,{passive:!0})})})}removeEvents(){this.el&&(this.pointerDownEvents.forEach(d=>{this.el.nativeElement.removeEventListener(d,this,{passive:!0})}),this.pointerUpEventsRegistered&&this.pointerUpEvents.forEach(d=>{this.el.nativeElement.removeEventListener(d,this,{passive:!0})}),this.pointerMoveEventsRegistered&&this.pointerMoveEvents.forEach(d=>{this.el.nativeElement.removeEventListener(d,this,{passive:!0})}))}handleEvent(d){var l=this;return(0,t.Z)(function*(){"pointermove"===d.type?l.onPointerMove(d):"touchmove"===d.type?l.onTouchMove(d):yield l.onPointerUp()})()}onPointerMove(d){this.currentPosition={x:d.clientX,y:d.clientY}}onTouchMove(d){this.currentPosition={x:d.touches[0].clientX,y:d.touches[0].clientY}}onPointerUp(){!this.isPointerDown||(this.isPointerDown=!1,this.isNear(this.currentPosition,this.downPosition)&&(this.isClick.next(void 0),clearTimeout(this.timeoutId)),this.matRipple.fadeOutAll())}isNear(d,l){return!(!d||!l)&&Math.abs(d.x-l.x)<this.isNearThreshold&&Math.abs(d.y-l.y)<this.isNearThreshold}static#t=this.\u0275fac=function(l){return new(l||w)(c.Y36(c.SBq),c.Y36(h.wG),c.Y36(c.R0b),c.Y36(c.sBO))};static#e=this.\u0275dir=c.lG2({type:w,selectors:[["","tHideRippleOnScroll",""]],hostBindings:function(l,b){1&l&&c.NdJ("pointerdown",function(Q){return b.onPointerDown(Q)})},standalone:!0})}},3322:(U,y,s)=>{s.d(y,{v:()=>v});var t=s(4650);class v{transform(p){return p?isNaN(p.ids.slug)?p.ids.slug:p.ids.trakt+"":""}static#t=this.\u0275fac=function(M){return new(M||v)};static#e=this.\u0275pipe=t.Yjl({name:"showSlug",type:v,pure:!0,standalone:!0})}}}]);