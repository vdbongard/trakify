"use strict";(self.webpackChunktrakify=self.webpackChunktrakify||[]).push([[198],{8424:(Z,M,s)=>{s.d(M,{N:()=>B});var t=s(7579),v=s(2722),m=s(3900),O=s(9646),x=s(515),S=s(6451),_=s(2805),P=s(4004),I=s(9841),f=s(8675),C=s(1884),a=s(404),c=s(975),d=s(4650),T=s(6895),L=s(1572);function b(p,u){1&p&&(d.ynx(0),d.Hsn(1),d.BQk())}function A(p,u){if(1&p&&(d.ynx(0),d.YNc(1,b,2,0,"ng-container",0),d.ALo(2,"async"),d.BQk()),2&p){const g=d.oxw(),h=d.MAs(3);let w;d.xp6(1),d.Q6J("ngIf",!1===d.lcZ(2,2,g.isLoadingDelayed))("ngIfElse",null!==(w=g.customLoading)&&void 0!==w?w:h)}}function R(p,u){1&p&&(d.TgZ(0,"div",3),d._UZ(1,"mat-spinner",4),d.qZA())}function U(p,u){1&p&&(d.TgZ(0,"div"),d._uU(1,"An error occurred"),d.qZA())}const F=["*"];let B=(()=>{class p extends a.H{constructor(){super(...arguments),this.showErrorTemplate=!1,this.loadingDelay=800,this.minimumLoadingShown=600,this.loadingStateChanged=new t.x,this.state=c.Gu}ngOnChanges(g){const h=g.loadingState?.currentValue;h&&(this.loadingStateChanged.next(),h.pipe((0,v.R)(this.loadingStateChanged),(0,v.R)(this.destroy$)).subscribe(()=>{const w=h.pipe((0,m.w)(E=>E!==c.Gu.LOADING?(0,O.of)(void 0):x.E));this.isLoadingDelayed=(0,S.T)((0,_.H)(this.loadingDelay).pipe((0,P.U)(()=>!0),(0,v.R)(w)),(0,I.a)([w,(0,_.H)(this.loadingDelay+this.minimumLoadingShown)]).pipe((0,P.U)(()=>!1))).pipe((0,f.O)(!1),(0,C.x)())}))}}return p.\u0275fac=function(){let u;return function(h){return(u||(u=d.n5z(p)))(h||p)}}(),p.\u0275cmp=d.Xpm({type:p,selectors:[["t-loading"]],inputs:{loadingState:"loadingState",customLoading:"customLoading",customError:"customError",showErrorTemplate:"showErrorTemplate"},features:[d.qOj,d.TTD],ngContentSelectors:F,decls:6,vars:4,consts:[[4,"ngIf","ngIfElse"],["loading",""],["error",""],[1,"loading-wrapper"],["diameter","32"]],template:function(g,h){if(1&g&&(d.F$t(),d.YNc(0,A,3,4,"ng-container",0),d.ALo(1,"async"),d.YNc(2,R,2,0,"ng-template",null,1,d.W1O),d.YNc(4,U,2,0,"ng-template",null,2,d.W1O)),2&g){const w=d.MAs(5);let E;d.Q6J("ngIf",!h.showErrorTemplate||d.lcZ(1,2,h.loadingState)!==h.state.ERROR)("ngIfElse",null!==(E=h.customError)&&void 0!==E?E:w)}},dependencies:[T.O5,L.Ou,T.Ov],styles:[".loading-wrapper[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;margin-top:1rem}"]}),p})()},1455:(Z,M,s)=>{s.d(M,{j:()=>nt});var t=s(4650),v=s(2869),m=s(6895),O=s(858),x=s(4633),S=s(3238),_=s(4854),P=s(4859),I=s(3162),f=s(7392),C=s(8255);let a=(()=>{class n{transform(e,o){if(!e)return"";const r=(new Date).getTime(),i=new Date(e).getTime();if(i<=r+864e5){const y=(0,m.p6)(i-r,"H","en-US");return`In ${y} ${"1"===y?"hour":"hours"}`}if(i<=r+6048e5){const y=(0,m.p6)(i-r,"d","en-US");return`In ${y} ${"1"===y?"day":"days"}`}return(0,m.p6)(e,o,"en-US")}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275pipe=t.Yjl({name:"relativeDate",type:n,pure:!0}),n})();var c=s(3022);function d(n,l){if(1&n){const e=t.EpF();t.TgZ(0,"img",9),t.NdJ("load",function(){t.CHM(e);const r=t.oxw();return t.KtG(r.posterLoaded=!0)}),t.qZA()}if(2&n){const e=l.ngIf,o=t.oxw();t.Q6J("src",o.posterPrefixLg+e,t.LSH)("alt",o.tmdbShow||o.show?((null==o.tmdbShow?null:o.tmdbShow.name)||(null==o.show?null:o.show.title))+" Poster":"Poster"),t.uIk("loading",void 0!==o.initialIndex&&o.initialIndex<=4?null:"lazy")("fetchpriority",void 0!==o.initialIndex&&o.initialIndex<=4?"high":null)}}function T(n,l){if(1&n){const e=t.EpF();t.TgZ(0,"img",10),t.NdJ("load",function(){t.CHM(e);const r=t.oxw();return t.KtG(r.posterLoaded=!0)}),t.qZA()}if(2&n){const e=t.oxw();t.Q6J("priority",void 0!==e.initialIndex&&e.initialIndex<=4)}}function L(n,l){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(2);t.xp6(1),t.hij(" ",e.tmdbShow.number_of_episodes," episodes ")}}function b(n,l){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(2);t.xp6(1),t.hij(" ",e.progress.aired-e.progress.completed," remaining ")}}function A(n,l){1&n&&(t.ynx(0),t._uU(1," \xb7 "),t.BQk())}function R(n,l){if(1&n&&(t.ynx(0),t.YNc(1,L,2,1,"ng-container",6),t.YNc(2,b,2,1,"ng-container",6),t.YNc(3,A,2,0,"ng-container",6),t.BQk()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.tmdbShow&&(!e.progress||0===e.progress.completed)),t.xp6(1),t.Q6J("ngIf",e.progress&&e.progress.completed>0&&e.progress.aired-e.progress.completed),t.xp6(1),t.Q6J("ngIf",e.tmdbShow&&(!e.progress||e.progress&&e.progress.aired-e.progress.completed))}}function U(n,l){if(1&n){const e=t.EpF();t.TgZ(0,"div",11)(1,"h2",12),t._uU(2),t.qZA(),t.TgZ(3,"button",13),t.NdJ("click",function(r){t.CHM(e);const i=t.oxw();return i.preventEvent(r),t.KtG(i.isFavorite?i.removeFavorite.emit(i.show):i.addFavorite.emit(i.show))}),t.TgZ(4,"mat-icon",14),t._uU(5),t.qZA()()()}if(2&n){const e=t.oxw();t.xp6(2),t.AsE(" ",(null==e.tmdbShow?null:e.tmdbShow.name)||e.show.title," ",e.withYear&&null!==e.show.year?" ("+e.show.year+")":""," "),t.xp6(1),t.ekj("remove",!e.isFavorite),t.xp6(2),t.Oqu(e.isFavorite?"star":"star_outline")}}function F(n,l){if(1&n&&t._UZ(0,"mat-progress-bar",15),2&n){const e=t.oxw();t.Q6J("value",e.progress.completed/e.progress.aired*100)}}function B(n,l){if(1&n&&(t.ynx(0),t.TgZ(1,"p",16),t._uU(2),t.ALo(3,"number"),t.ALo(4,"number"),t.qZA(),t.TgZ(5,"p",17),t._uU(6),t.ALo(7,"relativeDate"),t.ALo(8,"date"),t.qZA(),t.BQk()),2&n){const e=t.oxw(2);t.xp6(2),t.lnq(" S",t.xi3(3,4,e.episode.season,"2.0-0"),"E",t.xi3(4,7,e.episode.number,"2.0-0")," ",e.episode.title," "),t.xp6(4),t.hij(" ",e.withRelativeDate&&e.episode.first_aired?t.xi3(7,10,e.episode.first_aired,"d. MMM. yyyy (E.)"):t.xi3(8,13,e.episode.first_aired,"d. MMM. yyyy (E.)")," ")}}function p(n,l){if(1&n&&(t.ynx(0),t.TgZ(1,"p",18),t._uU(2),t.qZA(),t.BQk()),2&n){const e=t.oxw(2);t.xp6(2),t.Oqu(null==e.tmdbShow?null:e.tmdbShow.status)}}function u(n,l){if(1&n&&(t.ynx(0),t.YNc(1,B,9,16,"ng-container",6),t.YNc(2,p,3,1,"ng-container",6),t.ALo(3,"isShowEnded"),t.BQk()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.episode),t.xp6(1),t.Q6J("ngIf",null===e.episode&&!t.lcZ(3,2,e.tmdbShow))}}function g(n,l){1&n&&(t.TgZ(0,"button",21)(1,"mat-icon"),t._uU(2,"checkbox"),t.qZA()())}function h(n,l){if(1&n){const e=t.EpF();t.TgZ(0,"button",22),t.NdJ("click",function(r){t.CHM(e);const i=t.oxw(2);return i.preventEvent(r),t.KtG(i.isWatchlist?i.removeShow.emit(i.show.ids):i.addShow.emit(i.show.ids))}),t.TgZ(1,"mat-icon"),t._uU(2),t.qZA()()}if(2&n){const e=t.oxw(2);t.uIk("aria-label",e.isWatchlist?"Remove show":"Add show")("data-test-id",e.isWatchlist?"remove-button":"add-button"),t.xp6(2),t.Oqu(e.isWatchlist?"remove":"add")}}function w(n,l){if(1&n&&(t.ynx(0),t.YNc(1,g,3,0,"button",19),t.YNc(2,h,3,3,"button",20),t.BQk()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.progress||e.showWatched),t.xp6(1),t.Q6J("ngIf",void 0!==e.isWatchlist&&!(e.progress||e.showWatched))}}const E=function(n,l){return{show:n,isFavorite:l}};function Q(n,l){if(1&n){const e=t.EpF();t.ynx(0),t.TgZ(1,"button",23),t.NdJ("click",function(r){t.CHM(e);const i=t.oxw();return t.KtG(i.preventEvent(r))}),t.TgZ(2,"mat-icon"),t._uU(3,"more_vert"),t.qZA()(),t.BQk()}if(2&n){const e=t.oxw();t.xp6(1),t.Q6J("matMenuTriggerFor",e.menu)("matMenuTriggerData",t.WLB(2,E,e.show,e.isFavorite))}}let G=(()=>{class n{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe,this.addShow=new t.vpe,this.removeShow=new t.vpe,this.manageLists=new t.vpe,this.posterLoaded=!1,this.posterPrefixLg=_.$3}ngOnChanges(e){e.i?.firstChange&&void 0!==e.i?.currentValue&&void 0===this.initialIndex&&(this.initialIndex=e.i.currentValue)}preventEvent(e){e.stopPropagation(),e.preventDefault()}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["t-show-item"]],inputs:{i:"i",show:"show",showWatched:"showWatched",progress:"progress",tmdbShow:"tmdbShow",tmdbSeason:"tmdbSeason",isFavorite:"isFavorite",isWatchlist:"isWatchlist",episode:"episode",withYear:"withYear",withEpisode:"withEpisode",withAddButtons:"withAddButtons",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate",menu:"menu"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite",addShow:"addShow",removeShow:"removeShow",manageLists:"manageLists"},features:[t.TTD],decls:15,vars:13,consts:[[1,"poster-wrapper"],["width","185","height","278",3,"src","alt","load",4,"ngIf","ngIfElse"],["imgFallback",""],[1,"right"],[1,"left-wrapper"],[1,"mat-small","small-text"],[4,"ngIf"],["class","title-wrapper",4,"ngIf"],["class","progress-bar","mode","determinate","color","accent","aria-label","Shows episodes completed percentage of all aired episodes",3,"value",4,"ngIf"],["width","185","height","278",3,"src","alt","load"],["rawSrc","assets/poster.png","width","154","height","231","alt","Poster",3,"priority","load"],[1,"title-wrapper"],[1,"mat-title","title"],["mat-icon-button","","aria-label","Favorite",1,"favorite-button",3,"click"],[1,"favorite-icon"],["mode","determinate","color","accent","aria-label","Shows episodes completed percentage of all aired episodes",1,"progress-bar",3,"value"],[1,"mat-small","next-episode-text"],[1,"mat-small","next-episode-date"],[1,"mat-small","show-status"],["mat-icon-button","","aria-label","Show added","disabled","","data-test-id","show-added",4,"ngIf"],["mat-icon-button","",3,"click",4,"ngIf"],["mat-icon-button","","aria-label","Show added","disabled","","data-test-id","show-added"],["mat-icon-button","",3,"click"],["mat-icon-button","","aria-label","Menu","data-test-id","show-item-menu",3,"matMenuTriggerFor","matMenuTriggerData","click"]],template:function(e,o){if(1&e&&(t.TgZ(0,"div",0),t.YNc(1,d,1,4,"img",1),t.YNc(2,T,1,1,"ng-template",null,2,t.W1O),t.qZA(),t.TgZ(4,"div",3)(5,"div",4)(6,"p",5),t.YNc(7,R,4,3,"ng-container",6),t._uU(8),t.qZA(),t.YNc(9,U,6,5,"div",7),t.YNc(10,F,1,1,"mat-progress-bar",8),t.YNc(11,u,4,4,"ng-container",6),t.qZA(),t.TgZ(12,"div"),t.YNc(13,w,3,2,"ng-container",6),t.YNc(14,Q,4,5,"ng-container",6),t.qZA()()),2&e){const r=t.MAs(3);let i;t.ekj("not-loaded",!o.posterLoaded),t.xp6(1),t.Q6J("ngIf",o.posterPrefixLg&&((null==o.tmdbSeason?null:o.tmdbSeason.poster_path)||(null==o.tmdbShow?null:o.tmdbShow.poster_path)))("ngIfElse",r),t.xp6(3),t.ekj("without-gap",!o.withAddButtons),t.xp6(3),t.Q6J("ngIf",o.withEpisodesCount),t.xp6(1),t.hij(" ",null!==(i=null==o.tmdbShow||null==o.tmdbShow.networks||null==o.tmdbShow.networks[0]?null:o.tmdbShow.networks[0].name)&&void 0!==i?i:"\xa0"," "),t.xp6(1),t.Q6J("ngIf",o.show),t.xp6(1),t.Q6J("ngIf",o.withProgressbar&&o.progress&&o.showWatched),t.xp6(1),t.Q6J("ngIf",o.withEpisode),t.xp6(2),t.Q6J("ngIf",o.withAddButtons&&o.show),t.xp6(1),t.Q6J("ngIf",!o.withAddButtons&&o.menu&&o.show)}},dependencies:[m.O5,P.lW,I.pW,f.Hw,C.p6,m.Zd,m.JJ,m.uU,a,c.t],styles:["[_nghost-%COMP%]{display:grid;grid-template-columns:5rem 1fr;align-items:center;gap:1rem;width:100%;height:100%}@media (min-width: 576px){[_nghost-%COMP%]{grid-template-columns:6rem 1fr}}@media (min-width: 1200px){[_nghost-%COMP%]{grid-template-columns:9.625rem 1fr}}.poster-wrapper[_ngcontent-%COMP%]{aspect-ratio:2/3;cursor:pointer;border-radius:var(--border-radius);overflow:hidden;display:flex;place-items:center}.poster-wrapper.not-loaded[_ngcontent-%COMP%]{background-color:var(--background-2)}.right[_ngcontent-%COMP%]{width:100%;overflow:hidden;display:grid;grid-template-columns:1fr auto;align-items:center;gap:1rem}.right.without-gap[_ngcontent-%COMP%]{gap:unset}.left-wrapper[_ngcontent-%COMP%]{overflow:hidden}.title-wrapper[_ngcontent-%COMP%]{display:flex;align-items:center;margin-bottom:.125rem;--icon-size: 1rem}@media (min-width: 576px){.title-wrapper[_ngcontent-%COMP%]{margin-bottom:.75rem;--icon-size: 1.25rem}}.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;margin-bottom:0;margin-right:.25rem;font-size:1rem;font-weight:400;line-height:1.5rem}@media (min-width: 576px){.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{font-size:1.5rem;font-weight:500;line-height:2rem}}.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]:hover{cursor:pointer}.title-wrapper[_ngcontent-%COMP%]   .favorite-button[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;width:var(--icon-size);height:var(--icon-size)}.title-wrapper[_ngcontent-%COMP%]   .favorite-button.remove[_ngcontent-%COMP%]{display:none}.title-wrapper[_ngcontent-%COMP%]:hover   .favorite-button.remove[_ngcontent-%COMP%]{display:flex}.title-wrapper[_ngcontent-%COMP%]   .favorite-icon[_ngcontent-%COMP%]{width:var(--icon-size);height:var(--icon-size);font-size:var(--icon-size);line-height:var(--icon-size)}.progress-bar[_ngcontent-%COMP%]{margin-bottom:.25rem}@media (min-width: 576px){.progress-bar[_ngcontent-%COMP%]{margin-bottom:1rem}}.small-text[_ngcontent-%COMP%], .next-episode-text[_ngcontent-%COMP%], .next-episode-date[_ngcontent-%COMP%]{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.small-text[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}@media (min-width: 576px){.small-text[_ngcontent-%COMP%]{margin-bottom:.5rem}}.next-episode-text[_ngcontent-%COMP%]{margin:0}@media (min-width: 576px){.next-episode-text[_ngcontent-%COMP%]{margin-bottom:.5rem}}.next-episode-date[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}@media (min-width: 576px){.next-episode-date[_ngcontent-%COMP%]{margin-top:.5rem}}.show-status[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}"]}),n})();var K=s(1521);let W=(()=>{class n{constructor(e){this.ref=e,this.element=e.nativeElement}}return n.\u0275fac=function(e){return new(e||n)(t.Y36(t.SBq))},n.\u0275dir=t.lG2({type:n,selectors:[["","tTransitionGroupItem",""]]}),n})();var J=s(7579),j=s(4968),H=s(8372),N=s(2722);let k=(()=>{class n{constructor(){this.destroy$=new J.x,this.moveClass="move"}ngOnInit(){(0,j.R)(window,"scroll").pipe((0,H.b)(10),(0,N.R)(this.destroy$)).subscribe(()=>this.refreshPosition("previousPosition"))}ngAfterViewInit(){requestAnimationFrame(()=>this.refreshPosition("previousPosition")),this.items?.changes.pipe((0,N.R)(this.destroy$)).subscribe(e=>{e.forEach(i=>i.previousPosition=i.newPosition||i.previousPosition),e.forEach(i=>i.onMove?.()),this.refreshPosition("newPosition"),e.forEach(i=>i.previousPosition=i.previousPosition||i.newPosition);const o=()=>{e.forEach(this.applyTranslation),this._forceReflow=document.body.offsetHeight,this.items?.forEach(this.runTransition.bind(this))};e.some(i=>!(!i.previousPosition||!i.newPosition)&&(!!(i.previousPosition.left-i.newPosition.left)||!!(i.previousPosition.top-i.newPosition.top)))?o():requestAnimationFrame(()=>{this.refreshPosition("newPosition"),o()})})}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}runTransition(e){!e.moved||(e.element.classList.add(this.moveClass),e.element.style.transform=e.element.style.transitionDuration="",e.element.addEventListener("transitionend",e.onMove=o=>{(!o||/transform$/.test(o.propertyName))&&(e.onMove&&e.element.removeEventListener("transitionend",e.onMove),e.onMove=null,e.element.classList.remove(this.moveClass))}))}refreshPosition(e){this.items?.forEach(o=>{o[e]=o.element.getBoundingClientRect()})}applyTranslation(e){if(e.moved=!1,!e.previousPosition||!e.newPosition)return;const o=e.previousPosition.left-e.newPosition.left,r=e.previousPosition.top-e.newPosition.top;(o||r)&&(e.moved=!0,e.element.style.transform="translate("+o+"px,"+r+"px)",e.element.style.transitionDuration="0s")}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275dir=t.lG2({type:n,selectors:[["","tTransitionGroup",""]],contentQueries:function(e,o,r){if(1&e&&t.Suo(r,W,4),2&e){let i;t.iGM(i=t.CRH())&&(o.items=i)}}}),n})();var $=s(4754);const z=function(n,l,e){return{slug:n,season:l,episode:e}},X=function(n){return{slug:n}};function V(n,l){if(1&n){const e=t.EpF();t.TgZ(0,"a",5),t.ALo(1,"ngGenericPipe"),t.ALo(2,"ngGenericPipe"),t.TgZ(3,"mat-list-item")(4,"t-show-item",6),t.NdJ("addFavorite",function(r){t.CHM(e);const i=t.oxw(3);return t.KtG(i.addFavorite.emit(r))})("removeFavorite",function(r){t.CHM(e);const i=t.oxw(3);return t.KtG(i.removeFavorite.emit(r))})("addShow",function(r){t.CHM(e);const i=t.oxw(3);return t.KtG(i.add.emit(r))})("removeShow",function(r){t.CHM(e);const i=t.oxw(3);return t.KtG(i.remove.emit(r))})("manageLists",function(r){t.CHM(e);const i=t.oxw(3);return t.KtG(i.manageLists.emit(r))}),t.qZA()()()}if(2&n){const e=l.$implicit,o=l.index,r=t.oxw(3);t.Q6J("routerLink",e.show?r.withLinkToEpisode&&e.nextEpisode?t.xi3(1,17,t.kEZ(23,z,e.show.ids.slug,e.nextEpisode.season+"",e.nextEpisode.number+""),r.paths.episode):t.xi3(2,20,t.VKq(27,X,e.show.ids.slug+""),r.paths.show):null),t.xp6(4),t.Q6J("i",o)("show",e.show)("showWatched",e.showWatched)("progress",e.showProgress)("tmdbShow",e.tmdbShow)("tmdbSeason",e.tmdbSeason)("episode",e.nextEpisode)("isFavorite",e.isFavorite)("isWatchlist",!!e.isWatchlist)("withYear",r.withYear)("withEpisode",r.withEpisode)("withAddButtons",r.withAddButtons)("withEpisodesCount",r.withEpisodesCount)("withProgressbar",r.withProgressbar)("withRelativeDate",r.withRelativeDate)("menu",r.menu)}}function q(n,l){if(1&n&&(t.TgZ(0,"mat-list",3),t.YNc(1,V,5,29,"a",4),t.qZA()),2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("ngForOf",e.showsInfos)("ngForTrackBy",e.showId)}}function tt(n,l){if(1&n&&(t.ynx(0),t.YNc(1,q,2,2,"mat-list",2),t.BQk()),2&n){const e=t.oxw(),o=t.MAs(2);t.xp6(1),t.Q6J("ngIf",e.showsInfos.length)("ngIfElse",o)}}function et(n,l){1&n&&(t.TgZ(0,"h2",7),t._uU(1,"No shows in the list."),t.qZA(),t.TgZ(2,"p")(3,"a",8),t._uU(4,"Add"),t.qZA(),t._uU(5," one show."),t.qZA())}let nt=(()=>{class n{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe,this.add=new t.vpe,this.remove=new t.vpe,this.manageLists=new t.vpe,this.paths=v}showId(e,o){return o.show?.ids.trakt}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["t-shows"]],inputs:{showsInfos:"showsInfos",withYear:"withYear",withEpisode:"withEpisode",withAddButtons:"withAddButtons",withLinkToEpisode:"withLinkToEpisode",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate",menu:"menu"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite",add:"add",remove:"remove",manageLists:"manageLists"},decls:3,vars:1,consts:[[4,"ngIf"],["noShows",""],["class","shows","tTransitionGroup","",4,"ngIf","ngIfElse"],["tTransitionGroup","",1,"shows"],["class","show link","tTransitionGroupItem","","matRipple","","tHideRippleOnScroll","","data-test-id","show",3,"routerLink",4,"ngFor","ngForOf","ngForTrackBy"],["tTransitionGroupItem","","matRipple","","tHideRippleOnScroll","","data-test-id","show",1,"show","link",3,"routerLink"],[3,"i","show","showWatched","progress","tmdbShow","tmdbSeason","episode","isFavorite","isWatchlist","withYear","withEpisode","withAddButtons","withEpisodesCount","withProgressbar","withRelativeDate","menu","addFavorite","removeFavorite","addShow","removeShow","manageLists"],[1,"mat-subheading-1"],["routerLink","/series/add-series"]],template:function(e,o){1&e&&(t.YNc(0,tt,2,2,"ng-container",0),t.YNc(1,et,6,0,"ng-template",null,1,t.W1O)),2&e&&t.Q6J("ngIf",o.showsInfos)},dependencies:[m.sg,m.O5,O.yS,x.i$,x.Tg,S.wG,G,K.g,W,k,$.a],styles:[".shows[_ngcontent-%COMP%]{margin-top:-1rem}.shows[_ngcontent-%COMP%]   .show.move[_ngcontent-%COMP%]{transition:transform .3s}mat-list-item.show[_ngcontent-%COMP%]{padding:.5rem 0}.loading-item[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center}.loading-title[_ngcontent-%COMP%]{margin-bottom:0}"]}),n})()},1521:(Z,M,s)=>{s.d(M,{g:()=>I});var t=s(5861),v=s(7579),m=s(4968),O=s(8372),x=s(2722),S=s(5698),_=s(4650),P=s(3238);let I=(()=>{class f{constructor(a,c,d){this.el=a,this.matRipple=c,this.ngZone=d,this.destroy$=new v.x,this.touchTapDelay=100,this.isClick=new v.x,this.isNearThreshold=10,this.pointerDownEvents=["mousedown","touchstart"],this.pointerUpEvents=["mouseup","mouseleave","touchend","touchcancel","dragstart"],this.pointerMoveEvents=["pointermove","touchmove"],this.pointerUpEventsRegistered=!1,this.pointerMoveEventsRegistered=!1,this.isPointerDown=!1,this.isTouch=!1,this.matRipple.disabled=!0}ngOnInit(){(0,m.R)(window,"scroll").pipe((0,O.b)(10),(0,x.R)(this.destroy$)).subscribe(()=>this.matRipple.fadeOutAll())}ngOnDestroy(){this.removeEvents(),clearTimeout(this.timeoutId),this.destroy$.next(),this.destroy$.complete()}onPointerDown(a){0===a.button&&(this.isTouch="touch"===a.pointerType,this.isPointerDown=!0,this.downPosition={x:a.clientX,y:a.clientY},this.currentPosition={x:a.clientX,y:a.clientY},this.isClick.pipe((0,S.q)(1),(0,x.R)(this.destroy$)).subscribe(()=>{this.matRipple.launch(a.x,a.y,{persistent:!0}),clearTimeout(this.timeoutId)}),this.pointerUpEventsRegistered||(this.registerEvents(this.pointerUpEvents),this.pointerUpEventsRegistered=!0),this.isTouch?(clearTimeout(this.timeoutId),this.timeoutId=window.setTimeout(()=>{this.isNear(this.currentPosition,this.downPosition)&&this.isClick.next(void 0)},this.touchTapDelay),this.pointerMoveEventsRegistered||(this.registerEvents(this.pointerMoveEvents),this.pointerMoveEventsRegistered=!0)):this.isClick.next(void 0))}registerEvents(a){this.ngZone.runOutsideAngular(()=>{a.forEach(c=>{this.el.nativeElement.addEventListener(c,this,{passive:!0})})})}removeEvents(){this.el&&(this.pointerDownEvents.forEach(a=>{this.el.nativeElement.removeEventListener(a,this,{passive:!0})}),this.pointerUpEventsRegistered&&this.pointerUpEvents.forEach(a=>{this.el.nativeElement.removeEventListener(a,this,{passive:!0})}),this.pointerMoveEventsRegistered&&this.pointerMoveEvents.forEach(a=>{this.el.nativeElement.removeEventListener(a,this,{passive:!0})}))}handleEvent(a){var c=this;return(0,t.Z)(function*(){"pointermove"===a.type?c.onPointerMove(a):"touchmove"===a.type?c.onTouchMove(a):yield c.onPointerUp()})()}onPointerMove(a){this.currentPosition={x:a.clientX,y:a.clientY}}onTouchMove(a){this.currentPosition={x:a.touches[0].clientX,y:a.touches[0].clientY}}onPointerUp(){!this.isPointerDown||(this.isPointerDown=!1,this.isNear(this.currentPosition,this.downPosition)&&(this.isClick.next(void 0),clearTimeout(this.timeoutId)),this.matRipple.fadeOutAll())}isNear(a,c){return!(!a||!c)&&Math.abs(a.x-c.x)<this.isNearThreshold&&Math.abs(a.y-c.y)<this.isNearThreshold}}return f.\u0275fac=function(a){return new(a||f)(_.Y36(_.SBq),_.Y36(P.wG),_.Y36(_.R0b))},f.\u0275dir=_.lG2({type:f,selectors:[["","tHideRippleOnScroll",""]],hostBindings:function(a,c){1&a&&_.NdJ("pointerdown",function(T){return c.onPointerDown(T)})}}),f})()}}]);