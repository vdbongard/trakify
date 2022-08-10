"use strict";(self.webpackChunkseries_tracker=self.webpackChunkseries_tracker||[]).push([[291],{8291:(F,S,o)=>{o.d(S,{k:()=>k});var t=o(5861),g=o(1135),T=o(2722),L=o(5698),f=o(3900),R=o(2557),C=o(9646),P=o(4128),E=o(5492),a=o(975),h=o(6124),b=o(5606),s=o(4650),_=o(1420),B=o(5046),W=o(858),Z=o(5262),K=o(5374),N=o(7009),U=o(6895),Y=o(1455),j=o(8424),v=o(7392),M=o(3848),D=o(4859);function x(u,y){if(1&u){const m=s.EpF();s.TgZ(0,"a",10),s.NdJ("click",function(){const p=s.CHM(m),w=p.$implicit,O=p.index,n=s.oxw(3);return n.router.navigate([],{queryParams:{slug:w.ids.slug}}),s.KtG(n.activeListIndex=O)}),s._uU(1),s.qZA()}if(2&u){const m=y.$implicit,l=y.index,p=s.oxw(3);s.Q6J("active",p.activeListIndex===l),s.xp6(1),s.hij(" ",m.name," ")}}function I(u,y){if(1&u&&(s.TgZ(0,"nav",8),s.YNc(1,x,2,2,"a",9),s.qZA()),2&u){const m=s.oxw(2),l=s.MAs(2);s.Q6J("tabPanel",l),s.xp6(1),s.Q6J("ngForOf",m.lists)}}function A(u,y){if(1&u&&(s.ynx(0),s.YNc(1,I,2,2,"nav",7),s.BQk()),2&u){const m=s.oxw(),l=s.MAs(8);s.xp6(1),s.Q6J("ngIf",m.lists.length)("ngIfElse",l)}}function J(u,y){if(1&u){const m=s.EpF();s.TgZ(0,"button",11),s.NdJ("click",function(){s.CHM(m);const p=s.oxw();return s.KtG(p.dialogService.manageListItemsViaDialog(null==p.lists?null:p.lists[p.activeListIndex]))}),s.TgZ(1,"mat-icon"),s._uU(2,"add"),s.qZA()()}}function H(u,y){1&u&&(s.TgZ(0,"div",1)(1,"h2",12),s._uU(2,"No list added."),s.qZA()())}let k=(()=>{class u extends E.H{constructor(m,l,p,w,O,n,c){super(),this.showService=m,this.tmdbService=l,this.router=p,this.route=w,this.listService=O,this.dialogService=n,this.snackBar=c,this.loadingState=new g.X(a.Gu.LOADING)}ngOnInit(){var m=this;this.route.queryParams.pipe((0,T.R)(this.destroy$)).subscribe(function(){var l=(0,t.Z)(function*(p){const w=p.slug;m.lists||m.getLists(w),w&&(yield m.getListItems(w))});return function(p){return l.apply(this,arguments)}}())}getLists(m){var p,l=this;return this.listService.lists$.pipe((0,L.q)(1)).subscribe({next:(p=(0,t.Z)(function*(w){l.lists=w,0!==l.lists.length?(l.activeListIndex=m&&l.lists.findIndex(O=>O.ids.slug===m)||0,l.activeListIndex>=0&&(yield l.router.navigate([],{queryParamsHandling:"merge",queryParams:{slug:l.lists[l.activeListIndex].ids.slug}})),yield(0,h.D)()):l.loadingState.next(a.Gu.SUCCESS)}),function(O){return p.apply(this,arguments)}),error:p=>(0,b.q)(p,this.snackBar,this.loadingState)})}getListItems(m){var l=this;return(0,t.Z)(function*(){var p;!m||(l.loadingState.next(a.Gu.LOADING),l.showsInfos=void 0,yield(0,h.D)(),l.listService.getListItems$(m).pipe((0,f.w)(p=>{const w=p?.map(O=>l.tmdbService.getTmdbShow$(O.show.ids).pipe((0,L.q)(1)))??[];return(0,R.$)([(0,C.of)(p),(0,P.D)(w)])}),(0,L.q)(1)).subscribe({next:(p=(0,t.Z)(function*([w,O]){l.showsInfos=w?.map((n,c)=>({show:n.show,tmdbShow:O[c]})),l.loadingState.next(a.Gu.SUCCESS)}),function(O){return p.apply(this,arguments)}),error:p=>(0,b.q)(p,l.snackBar,l.loadingState)}))})()}}return u.\u0275fac=function(m){return new(m||u)(s.Y36(_.X),s.Y36(B.U),s.Y36(W.F0),s.Y36(W.gz),s.Y36(Z.X),s.Y36(K.x),s.Y36(N.ux))},u.\u0275cmp=s.Xpm({type:u,selectors:[["app-lists"]],features:[s.qOj],decls:9,vars:7,consts:[[4,"ngIf"],[1,"list"],["tabPanel",""],[3,"loadingState"],[3,"showsInfos","tmdbConfig"],["mat-fab","","color","primary","class","fab","aria-label","Add list items",3,"click",4,"ngIf"],["noList",""],["mat-tab-nav-bar","",3,"tabPanel",4,"ngIf","ngIfElse"],["mat-tab-nav-bar","",3,"tabPanel"],["mat-tab-link","",3,"active","click",4,"ngFor","ngForOf"],["mat-tab-link","",3,"active","click"],["mat-fab","","color","primary","aria-label","Add list items",1,"fab",3,"click"],[1,"mat-subheading-1"]],template:function(m,l){1&m&&(s.YNc(0,A,2,2,"ng-container",0),s.TgZ(1,"mat-tab-nav-panel",1,2)(3,"app-loading",3),s._UZ(4,"app-shows",4),s.ALo(5,"async"),s.qZA()(),s.YNc(6,J,3,0,"button",5),s.YNc(7,H,3,0,"ng-template",null,6,s.W1O)),2&m&&(s.Q6J("ngIf",l.lists),s.xp6(3),s.Q6J("loadingState",l.loadingState),s.xp6(1),s.Q6J("showsInfos",l.showsInfos)("tmdbConfig",s.lcZ(5,5,l.tmdbService.tmdbConfig$)),s.xp6(2),s.Q6J("ngIf",void 0!==l.activeListIndex))},dependencies:[U.sg,U.O5,Y.j,j.N,v.Hw,M.BU,M.sW,M.Nj,D.lW,U.Ov],styles:[".list[_ngcontent-%COMP%]{display:block;max-width:50rem;margin:0 auto;padding:1rem}.list[_ngcontent-%COMP%]     .mat-list-base{margin-left:-1rem;margin-right:-1rem}"]}),u})()},8424:(F,S,o)=>{o.d(S,{N:()=>j});var t=o(7579),g=o(2722),T=o(3900),L=o(9646),f=o(515),R=o(6451),C=o(2805),P=o(4004),E=o(9841),a=o(8675),h=o(1884),b=o(975),s=o(5492),_=o(4650),B=o(6895),W=o(1572);function Z(v,M){1&v&&(_.ynx(0),_.Hsn(1),_.BQk())}function K(v,M){if(1&v&&(_.ynx(0),_.YNc(1,Z,2,0,"ng-container",0),_.ALo(2,"async"),_.BQk()),2&v){const D=_.oxw(),x=_.MAs(3);let I;_.xp6(1),_.Q6J("ngIf",!1===_.lcZ(2,2,D.isLoadingDelayed))("ngIfElse",null!==(I=D.customLoading)&&void 0!==I?I:x)}}function N(v,M){1&v&&(_.TgZ(0,"div",3),_._UZ(1,"mat-spinner",4),_.qZA())}function U(v,M){1&v&&(_.TgZ(0,"div"),_._uU(1,"An error occurred"),_.qZA())}const Y=["*"];let j=(()=>{class v extends s.H{constructor(){super(...arguments),this.loadingDelay=400,this.minimumLoadingShown=600,this.loadingStateChanged=new t.x,this.loadingStateEnum=b.Gu}ngOnChanges(D){const x=D.loadingState?.currentValue;x&&(this.loadingStateChanged.next(),x.pipe((0,g.R)(this.loadingStateChanged),(0,g.R)(this.destroy$)).subscribe(()=>{const I=x.pipe((0,T.w)(A=>A!==b.Gu.LOADING?(0,L.of)(void 0):f.E));this.isLoadingDelayed=(0,R.T)((0,C.H)(this.loadingDelay).pipe((0,P.U)(()=>!0),(0,g.R)(I)),(0,E.a)([I,(0,C.H)(this.loadingDelay+this.minimumLoadingShown)]).pipe((0,P.U)(()=>!1))).pipe((0,a.O)(!1),(0,h.x)())}))}}return v.\u0275fac=function(){let M;return function(x){return(M||(M=_.n5z(v)))(x||v)}}(),v.\u0275cmp=_.Xpm({type:v,selectors:[["app-loading"]],inputs:{loadingState:"loadingState",customLoading:"customLoading",customError:"customError"},features:[_.qOj,_.TTD],ngContentSelectors:Y,decls:6,vars:4,consts:[[4,"ngIf","ngIfElse"],["loading",""],["error",""],[1,"loading-wrapper"],["diameter","32"]],template:function(D,x){if(1&D&&(_.F$t(),_.YNc(0,K,3,4,"ng-container",0),_.ALo(1,"async"),_.YNc(2,N,2,0,"ng-template",null,1,_.W1O),_.YNc(4,U,2,0,"ng-template",null,2,_.W1O)),2&D){const I=_.MAs(5);let A;_.Q6J("ngIf",_.lcZ(1,2,x.loadingState)!==x.loadingStateEnum.ERROR)("ngIfElse",null!==(A=x.customError)&&void 0!==A?A:I)}},dependencies:[B.O5,W.Ou,B.Ov],styles:[".loading-wrapper[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;margin-top:1rem}"]}),v})()},1455:(F,S,o)=>{o.d(S,{j:()=>O});var t=o(4650),g=o(6895),T=o(4633),L=o(858),f=o(3238),R=o(4859),C=o(3162),P=o(7392),E=o(8255),a=o(1800);let h=(()=>{class n{transform(e,i){if(!e)return"";const d=(new Date).getTime(),r=new Date(e).getTime();if(r<=d+864e5){const G=(0,g.p6)(r-d,"H","en-US");return`In ${G} ${"1"===G?"hour":"hours"}`}if(r<=d+6048e5){const G=(0,g.p6)(r-d,"d","en-US");return`In ${G} ${"1"===G?"day":"days"}`}return(0,g.p6)(e,i,"en-US")}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275pipe=t.Yjl({name:"relativeDate",type:n,pure:!0}),n})();function b(n,c){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(3);t.xp6(1),t.hij(" ",e.tmdbShow.number_of_episodes," episodes ")}}function s(n,c){if(1&n&&(t.ynx(0),t._uU(1),t.BQk()),2&n){const e=t.oxw(3);t.xp6(1),t.hij(" ",e.progress.aired-e.progress.completed," remaining ")}}function _(n,c){1&n&&(t.ynx(0),t._uU(1," \xb7 "),t.BQk())}function B(n,c){if(1&n&&(t.ynx(0),t.YNc(1,b,2,1,"ng-container",7),t.YNc(2,s,2,1,"ng-container",7),t.YNc(3,_,2,0,"ng-container",7),t.BQk()),2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("ngIf",e.tmdbShow&&(!e.progress||0===e.progress.completed)),t.xp6(1),t.Q6J("ngIf",e.progress&&e.progress.completed>0&&e.progress.aired-e.progress.completed),t.xp6(1),t.Q6J("ngIf",e.tmdbShow&&(!e.progress||e.progress&&e.progress.aired-e.progress.completed))}}function W(n,c){if(1&n&&(t.TgZ(0,"p",8),t.YNc(1,B,4,3,"ng-container",7),t._uU(2),t.qZA()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.withEpisodesCount),t.xp6(1),t.hij(" ",null==e.tmdbShow||null==e.tmdbShow.networks||null==e.tmdbShow.networks[0]?null:e.tmdbShow.networks[0].name," ")}}function Z(n,c){if(1&n){const e=t.EpF();t.TgZ(0,"button",12),t.NdJ("click",function(d){t.CHM(e);const r=t.oxw(2);return r.preventEvent(d),t.KtG(r.isFavorite?r.removeFavorite.emit(r.show.ids.trakt):r.addFavorite.emit(r.show.ids.trakt))}),t.TgZ(1,"mat-icon",13),t._uU(2),t.qZA()()}if(2&n){const e=t.oxw(2);t.ekj("remove",!e.isFavorite),t.xp6(2),t.Oqu(e.isFavorite?"star":"star_outline")}}function K(n,c){if(1&n&&(t.TgZ(0,"div",9)(1,"h2",10),t._uU(2),t.qZA(),t.YNc(3,Z,3,3,"button",11),t.qZA()),2&n){const e=t.oxw();t.xp6(2),t.AsE(" ",(null==e.tmdbShow?null:e.tmdbShow.name)||e.show.title,"",e.withYear&&" ("+e.show.year+")"," "),t.xp6(1),t.Q6J("ngIf",void 0!==e.isFavorite)}}function N(n,c){if(1&n&&t._UZ(0,"mat-progress-bar",14),2&n){const e=t.oxw();t.Q6J("value",e.progress.completed/e.progress.aired*100)}}function U(n,c){if(1&n&&(t.ynx(0),t.TgZ(1,"p",15),t._uU(2),t.ALo(3,"number"),t.ALo(4,"number"),t.qZA(),t.TgZ(5,"p",16),t._uU(6),t.ALo(7,"relativeDate"),t.ALo(8,"date"),t.qZA(),t.BQk()),2&n){const e=t.oxw();t.xp6(2),t.lnq(" S",t.xi3(3,4,e.episode.season,"2.0-0"),"E",t.xi3(4,7,e.episode.number,"2.0-0")," ",e.episode.title," "),t.xp6(4),t.hij(" ",e.withRelativeDate?t.xi3(7,10,e.episode.first_aired,"d. MMM. yyyy (E.)"):t.xi3(8,13,e.episode.first_aired,"d. MMM. yyyy (E.)")," ")}}function Y(n,c){1&n&&(t.TgZ(0,"button",19)(1,"mat-icon"),t._uU(2,"checkbox"),t.qZA()())}function j(n,c){if(1&n){const e=t.EpF();t.TgZ(0,"button",20),t.NdJ("click",function(d){t.CHM(e);const r=t.oxw(2);return r.preventEvent(d),t.KtG(r.isWatchlist?r.removeShow.emit(r.show.ids):r.addShow.emit(r.show.ids))}),t.TgZ(1,"mat-icon"),t._uU(2),t.qZA()()}if(2&n){const e=t.oxw(2);t.uIk("aria-label",e.isWatchlist?"Remove show":"Add show"),t.xp6(2),t.Oqu(e.isWatchlist?"remove":"add")}}function v(n,c){if(1&n&&(t.ynx(0),t.YNc(1,Y,3,0,"button",17),t.YNc(2,j,3,2,"button",18),t.BQk()),2&n){const e=t.oxw();t.xp6(1),t.Q6J("ngIf",e.progress&&e.showWatched),t.xp6(1),t.Q6J("ngIf",!(e.progress&&e.showWatched))}}const M=function(n,c){return{show:n,isFavorite:c}};function D(n,c){if(1&n){const e=t.EpF();t.ynx(0),t.TgZ(1,"button",21),t.NdJ("click",function(d){t.CHM(e);const r=t.oxw();return t.KtG(r.preventEvent(d))}),t.TgZ(2,"mat-icon"),t._uU(3,"more_vert"),t.qZA()(),t.BQk()}if(2&n){const e=t.oxw();t.xp6(1),t.Q6J("matMenuTriggerFor",e.menu)("matMenuTriggerData",t.WLB(2,M,e.show,e.isFavorite))}}let x=(()=>{class n{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe,this.addShow=new t.vpe,this.removeShow=new t.vpe,this.manageLists=new t.vpe,this.posterLoaded=!1}preventEvent(e){e.stopPropagation(),e.preventDefault()}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-show-item"]],inputs:{show:"show",showWatched:"showWatched",progress:"progress",imgPrefix:"imgPrefix",tmdbShow:"tmdbShow",tmdbSeason:"tmdbSeason",isFavorite:"isFavorite",isWatchlist:"isWatchlist",episode:"episode",withYear:"withYear",withEpisode:"withEpisode",withAddButtons:"withAddButtons",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate",menu:"menu"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite",addShow:"addShow",removeShow:"removeShow",manageLists:"manageLists"},decls:11,vars:12,consts:[[1,"poster-wrapper"],["width","185","height","278","loading","lazy","appImageFallback","assets/poster.png",3,"src","alt","load"],[1,"right"],[1,"left-wrapper"],["class","mat-small small-text",4,"ngIf"],["class","title-wrapper",4,"ngIf"],["class","progress-bar","mode","determinate",3,"value",4,"ngIf"],[4,"ngIf"],[1,"mat-small","small-text"],[1,"title-wrapper"],[1,"mat-title","title"],["mat-icon-button","","aria-label","Favorite","class","favorite-button",3,"remove","click",4,"ngIf"],["mat-icon-button","","aria-label","Favorite",1,"favorite-button",3,"click"],[1,"favorite-icon"],["mode","determinate",1,"progress-bar",3,"value"],[1,"mat-small","next-episode-text"],[1,"mat-small","next-episode-date"],["mat-icon-button","","aria-label","Show added","disabled","",4,"ngIf"],["mat-icon-button","",3,"click",4,"ngIf"],["mat-icon-button","","aria-label","Show added","disabled",""],["mat-icon-button","",3,"click"],["mat-icon-button","","aria-label","Menu",3,"matMenuTriggerFor","matMenuTriggerData","click"]],template:function(e,i){if(1&e&&(t.TgZ(0,"div",0)(1,"img",1),t.NdJ("load",function(){return i.posterLoaded=!0}),t.qZA()(),t.TgZ(2,"div",2)(3,"div",3),t.YNc(4,W,3,2,"p",4),t.YNc(5,K,4,3,"div",5),t.YNc(6,N,1,1,"mat-progress-bar",6),t.YNc(7,U,9,16,"ng-container",7),t.qZA(),t.TgZ(8,"div"),t.YNc(9,v,3,2,"ng-container",7),t.YNc(10,D,4,5,"ng-container",7),t.qZA()()),2&e){let d,r;t.ekj("not-loaded",!i.posterLoaded),t.xp6(1),t.Q6J("src",i.imgPrefix&&(i.tmdbSeason||i.tmdbShow)?i.imgPrefix+(null!==(d=null==i.tmdbSeason?null:i.tmdbSeason.poster_path)&&void 0!==d?d:null==i.tmdbShow?null:i.tmdbShow.poster_path):null,t.LSH)("alt",(null!==(r=i.tmdbShow)&&void 0!==r?r:i.show)?((null==i.tmdbShow?null:i.tmdbShow.name)||(null==i.show?null:i.show.title))+" Poster":"Poster"),t.xp6(1),t.ekj("without-gap",!i.withAddButtons),t.xp6(2),t.Q6J("ngIf",i.progress||i.tmdbShow),t.xp6(1),t.Q6J("ngIf",i.show),t.xp6(1),t.Q6J("ngIf",i.withProgressbar&&i.progress&&i.showWatched),t.xp6(1),t.Q6J("ngIf",i.withEpisode&&i.episode),t.xp6(2),t.Q6J("ngIf",i.withAddButtons&&i.show),t.xp6(1),t.Q6J("ngIf",!i.withAddButtons&&i.menu&&i.show)}},dependencies:[g.O5,R.lW,C.pW,P.Hw,E.p6,a.H,g.JJ,g.uU,h],styles:["[_nghost-%COMP%]{display:grid;grid-template-columns:5rem 1fr;align-items:center;gap:1rem;width:100%;height:100%}@media (min-width: 576px){[_nghost-%COMP%]{grid-template-columns:9.625rem 1fr}}.poster-wrapper[_ngcontent-%COMP%]{aspect-ratio:2/3;cursor:pointer;border-radius:var(--border-radius);overflow:hidden;display:flex;place-items:center}.poster-wrapper.not-loaded[_ngcontent-%COMP%]{background-color:var(--background-2)}.right[_ngcontent-%COMP%]{width:100%;overflow:hidden;display:grid;grid-template-columns:1fr auto;align-items:center;gap:1rem}.right.without-gap[_ngcontent-%COMP%]{gap:unset}.left-wrapper[_ngcontent-%COMP%]{overflow:hidden}.title-wrapper[_ngcontent-%COMP%]{display:flex;align-items:center;margin-bottom:.125rem;--icon-size: 1rem}@media (min-width: 576px){.title-wrapper[_ngcontent-%COMP%]{margin-bottom:.75rem;--icon-size: 1.25rem}}.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;margin-bottom:0;margin-right:.25rem;font-size:1rem;font-weight:400;line-height:1.5rem}@media (min-width: 576px){.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]{font-size:1.5rem;font-weight:500;line-height:2rem}}.title-wrapper[_ngcontent-%COMP%]   .title[_ngcontent-%COMP%]:hover{cursor:pointer}.title-wrapper[_ngcontent-%COMP%]   .favorite-button[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center;width:var(--icon-size);height:var(--icon-size)}.title-wrapper[_ngcontent-%COMP%]   .favorite-button.remove[_ngcontent-%COMP%]{display:none}.title-wrapper[_ngcontent-%COMP%]:hover   .favorite-button.remove[_ngcontent-%COMP%]{display:flex}.title-wrapper[_ngcontent-%COMP%]   .favorite-icon[_ngcontent-%COMP%]{width:var(--icon-size);height:var(--icon-size);font-size:var(--icon-size);line-height:var(--icon-size)}.progress-bar[_ngcontent-%COMP%]{margin-bottom:.25rem}@media (min-width: 576px){.progress-bar[_ngcontent-%COMP%]{margin-bottom:1rem}}.small-text[_ngcontent-%COMP%], .next-episode-text[_ngcontent-%COMP%], .next-episode-date[_ngcontent-%COMP%]{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.small-text[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}@media (min-width: 576px){.small-text[_ngcontent-%COMP%]{margin-bottom:.5rem}}.next-episode-text[_ngcontent-%COMP%]{margin:0}@media (min-width: 576px){.next-episode-text[_ngcontent-%COMP%]{margin-bottom:.5rem}}.next-episode-date[_ngcontent-%COMP%]{margin:0;color:var(--text-color-2)}@media (min-width: 576px){.next-episode-date[_ngcontent-%COMP%]{margin-top:.5rem}}"]}),n})();var I=o(1521);let A=(()=>{class n{constructor(e){this.ref=e,this.element=e.nativeElement}}return n.\u0275fac=function(e){return new(e||n)(t.Y36(t.SBq))},n.\u0275dir=t.lG2({type:n,selectors:[["","appTransitionGroupItem",""]]}),n})();var J=o(7579),H=o(4968),k=o(8372),u=o(2722);let y=(()=>{class n{constructor(){this.destroy$=new J.x,this.moveClass="move"}ngOnInit(){(0,H.R)(window,"scroll").pipe((0,k.b)(10),(0,u.R)(this.destroy$)).subscribe(()=>this.refreshPosition("previousPosition"))}ngAfterViewInit(){requestAnimationFrame(()=>this.refreshPosition("previousPosition")),this.items?.changes.pipe((0,u.R)(this.destroy$)).subscribe(e=>{e.forEach(r=>r.previousPosition=r.newPosition||r.previousPosition),e.forEach(r=>r.onMove?.()),this.refreshPosition("newPosition"),e.forEach(r=>r.previousPosition=r.previousPosition||r.newPosition);const i=()=>{e.forEach(this.applyTranslation),this._forceReflow=document.body.offsetHeight,this.items?.forEach(this.runTransition.bind(this))};e.some(r=>!(!r.previousPosition||!r.newPosition)&&(!!(r.previousPosition.left-r.newPosition.left)||!!(r.previousPosition.top-r.newPosition.top)))?i():requestAnimationFrame(()=>{this.refreshPosition("newPosition"),i()})})}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}runTransition(e){!e.moved||(e.element.classList.add(this.moveClass),e.element.style.transform=e.element.style.transitionDuration="",e.element.addEventListener("transitionend",e.onMove=i=>{(!i||/transform$/.test(i.propertyName))&&(e.element.removeEventListener("transitionend",e.onMove),e.onMove=null,e.element.classList.remove(this.moveClass))}))}refreshPosition(e){this.items?.forEach(i=>{i[e]=i.element.getBoundingClientRect()})}applyTranslation(e){if(e.moved=!1,!e.previousPosition||!e.newPosition)return;const i=e.previousPosition.left-e.newPosition.left,d=e.previousPosition.top-e.newPosition.top;(i||d)&&(e.moved=!0,e.element.style.transform="translate("+i+"px,"+d+"px)",e.element.style.transitionDuration="0s")}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275dir=t.lG2({type:n,selectors:[["","appTransitionGroup",""]],contentQueries:function(e,i,d){if(1&e&&t.Suo(d,A,4),2&e){let r;t.iGM(r=t.CRH())&&(i.items=r)}}}),n})();function m(n,c){if(1&n){const e=t.EpF();t.TgZ(0,"a",5)(1,"mat-list-item")(2,"app-show-item",6),t.NdJ("addFavorite",function(d){t.CHM(e);const r=t.oxw(3);return t.KtG(r.addFavorite.emit(d))})("removeFavorite",function(d){t.CHM(e);const r=t.oxw(3);return t.KtG(r.removeFavorite.emit(d))})("addShow",function(d){t.CHM(e);const r=t.oxw(3);return t.KtG(r.addShow.emit(d))})("removeShow",function(d){t.CHM(e);const r=t.oxw(3);return t.KtG(r.removeShow.emit(d))})("manageLists",function(d){t.CHM(e);const r=t.oxw(3);return t.KtG(r.manageLists.emit(d))}),t.qZA()()()}if(2&n){const e=c.$implicit,i=t.oxw(3);t.Q6J("routerLink",e.show&&"/series/s/"+e.show.ids.slug+(i.withLinkToEpisode&&e.nextEpisode?"/season/"+e.nextEpisode.season+"/episode/"+e.nextEpisode.number:"")),t.xp6(2),t.Q6J("show",e.show)("showWatched",e.showWatched)("progress",e.showProgress)("imgPrefix",i.tmdbConfig?i.tmdbConfig.images.secure_base_url+i.tmdbConfig.images.poster_sizes[1]:void 0)("tmdbShow",e.tmdbShow)("tmdbSeason",e.tmdbSeason)("episode",e.nextEpisode)("isFavorite",e.isFavorite)("isWatchlist",!!e.isWatchlist)("withYear",i.withYear)("withEpisode",i.withEpisode)("withAddButtons",i.withAddButtons)("withEpisodesCount",i.withEpisodesCount)("withProgressbar",i.withProgressbar)("withRelativeDate",i.withRelativeDate)("menu",i.menu)}}function l(n,c){if(1&n&&(t.TgZ(0,"mat-list",3),t.YNc(1,m,3,17,"a",4),t.qZA()),2&n){const e=t.oxw(2);t.xp6(1),t.Q6J("ngForOf",e.showsInfos)("ngForTrackBy",e.showId)}}function p(n,c){if(1&n&&(t.ynx(0),t.YNc(1,l,2,2,"mat-list",2),t.BQk()),2&n){const e=t.oxw(),i=t.MAs(2);t.xp6(1),t.Q6J("ngIf",e.showsInfos.length)("ngIfElse",i)}}function w(n,c){1&n&&(t.TgZ(0,"h2",7),t._uU(1,"No shows added or in the filter."),t.qZA(),t.TgZ(2,"p")(3,"a",8),t._uU(4,"Add"),t.qZA(),t._uU(5," one to the watchlist."),t.qZA())}let O=(()=>{class n{constructor(){this.addFavorite=new t.vpe,this.removeFavorite=new t.vpe,this.addShow=new t.vpe,this.removeShow=new t.vpe,this.manageLists=new t.vpe}showId(e,i){return i.show?.ids.trakt}ngOnChanges(e){console.debug("ShowsComponent (shared) changes",e)}}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-shows"]],inputs:{showsInfos:"showsInfos",tmdbConfig:"tmdbConfig",withYear:"withYear",withEpisode:"withEpisode",withAddButtons:"withAddButtons",withLinkToEpisode:"withLinkToEpisode",withEpisodesCount:"withEpisodesCount",withProgressbar:"withProgressbar",withRelativeDate:"withRelativeDate",menu:"menu"},outputs:{addFavorite:"addFavorite",removeFavorite:"removeFavorite",addShow:"addShow",removeShow:"removeShow",manageLists:"manageLists"},features:[t.TTD],decls:3,vars:1,consts:[[4,"ngIf"],["noShows",""],["class","shows","appTransitionGroup","",4,"ngIf","ngIfElse"],["appTransitionGroup","",1,"shows"],["class","show link","appTransitionGroupItem","","matRipple","","appHideRippleOnScroll","",3,"routerLink",4,"ngFor","ngForOf","ngForTrackBy"],["appTransitionGroupItem","","matRipple","","appHideRippleOnScroll","",1,"show","link",3,"routerLink"],[3,"show","showWatched","progress","imgPrefix","tmdbShow","tmdbSeason","episode","isFavorite","isWatchlist","withYear","withEpisode","withAddButtons","withEpisodesCount","withProgressbar","withRelativeDate","menu","addFavorite","removeFavorite","addShow","removeShow","manageLists"],[1,"mat-subheading-1"],["routerLink","/series/add-series"]],template:function(e,i){1&e&&(t.YNc(0,p,2,2,"ng-container",0),t.YNc(1,w,6,0,"ng-template",null,1,t.W1O)),2&e&&t.Q6J("ngIf",i.showsInfos)},dependencies:[g.sg,g.O5,T.i$,T.Tg,L.yS,f.wG,x,I.g,A,y],styles:[".shows[_ngcontent-%COMP%]{margin-top:-1rem}.shows[_ngcontent-%COMP%]   .show.move[_ngcontent-%COMP%]{transition:transform .3s}mat-list-item.show[_ngcontent-%COMP%]{padding:.5rem 0}.loading-item[_ngcontent-%COMP%]{display:flex;justify-content:center;align-items:center}.loading-title[_ngcontent-%COMP%]{margin-bottom:0}"]}),n})()},1521:(F,S,o)=>{o.d(S,{g:()=>C});var t=o(5861),g=o(7579),T=o(5698),L=o(2722),f=o(4650),R=o(3238);let C=(()=>{class P{constructor(a,h,b){this.el=a,this.matRipple=h,this.ngZone=b,this.destroy$=new g.x,this.touchTapDelay=100,this.isClick=new g.x,this.isNearThreshold=10,this.pointerDownEvents=["mousedown","touchstart"],this.pointerUpEvents=["mouseup","mouseleave","touchend","touchcancel","dragstart"],this.pointerMoveEvents=["pointermove","touchmove"],this.pointerUpEventsRegistered=!1,this.pointerMoveEventsRegistered=!1,this.isPointerDown=!1,this.isTouch=!1,this.matRipple.disabled=!0}ngOnDestroy(){this.removeEvents(),clearTimeout(this.timeoutId),this.destroy$.next(),this.destroy$.complete()}onPointerDown(a){0===a.button&&(this.isTouch="touch"===a.pointerType,this.isPointerDown=!0,this.downPosition={x:a.clientX,y:a.clientY},this.currentPosition={x:a.clientX,y:a.clientY},this.isClick.pipe((0,T.q)(1),(0,L.R)(this.destroy$)).subscribe(()=>{this.matRipple.launch(a.x,a.y,{persistent:!0}),clearTimeout(this.timeoutId)}),this.pointerUpEventsRegistered||(this.registerEvents(this.pointerUpEvents),this.pointerUpEventsRegistered=!0),this.isTouch?(clearTimeout(this.timeoutId),this.timeoutId=setTimeout(()=>{this.isNear(this.currentPosition,this.downPosition)&&this.isClick.next(void 0)},this.touchTapDelay),this.pointerMoveEventsRegistered||(this.registerEvents(this.pointerMoveEvents),this.pointerMoveEventsRegistered=!0)):this.isClick.next(void 0))}registerEvents(a){this.ngZone.runOutsideAngular(()=>{a.forEach(h=>{this.el.nativeElement.addEventListener(h,this,{passive:!0})})})}removeEvents(){this.el&&(this.pointerDownEvents.forEach(a=>{this.el.nativeElement.removeEventListener(a,this,{passive:!0})}),this.pointerUpEventsRegistered&&this.pointerUpEvents.forEach(a=>{this.el.nativeElement.removeEventListener(a,this,{passive:!0})}),this.pointerMoveEventsRegistered&&this.pointerMoveEvents.forEach(a=>{this.el.nativeElement.removeEventListener(a,this,{passive:!0})}))}handleEvent(a){var h=this;return(0,t.Z)(function*(){"pointermove"===a.type?h.onPointerMove(a):"touchmove"===a.type?h.onTouchMove(a):yield h.onPointerUp()})()}onPointerMove(a){this.currentPosition={x:a.clientX,y:a.clientY}}onTouchMove(a){this.currentPosition={x:a.touches[0].clientX,y:a.touches[0].clientY}}onPointerUp(){!this.isPointerDown||(this.isPointerDown=!1,this.isNear(this.currentPosition,this.downPosition)&&(this.isClick.next(void 0),clearTimeout(this.timeoutId)),this.matRipple.fadeOutAll())}isNear(a,h){return!(!a||!h)&&Math.abs(a.x-h.x)<this.isNearThreshold&&Math.abs(a.y-h.y)<this.isNearThreshold}}return P.\u0275fac=function(a){return new(a||P)(f.Y36(f.SBq),f.Y36(R.wG),f.Y36(f.R0b))},P.\u0275dir=f.lG2({type:P,selectors:[["","appHideRippleOnScroll",""]],hostBindings:function(a,h){1&a&&f.NdJ("pointerdown",function(s){return h.onPointerDown(s)})}}),P})()},1800:(F,S,o)=>{o.d(S,{H:()=>R});var t=o(975),g=o(7579),T=o(1135),L=o(2722),f=o(4650);let R=(()=>{class C{constructor(E){this.el=E,this.destroy$=new g.x,this.state=new T.X(t.Gu.LOADING)}ngOnInit(){this.state?.pipe((0,L.R)(this.destroy$)).subscribe(E=>{E===t.Gu.ERROR&&this.appImageFallback&&(this.el.nativeElement.src=this.appImageFallback)})}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}onLoad(){this.state?.next(t.Gu.SUCCESS)}onError(){this.state?.next(t.Gu.ERROR)}}return C.\u0275fac=function(E){return new(E||C)(f.Y36(f.SBq))},C.\u0275dir=f.lG2({type:C,selectors:[["","appImageFallback",""]],hostBindings:function(E,a){1&E&&f.NdJ("load",function(){return a.onLoad()})("error",function(){return a.onError()})},inputs:{appImageFallback:"appImageFallback"}}),C})()},6124:(F,S,o)=>{function t(g=0){return new Promise(T=>{setTimeout(()=>{T()},g)})}o.d(S,{D:()=>t})}}]);