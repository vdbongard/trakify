"use strict";(self.webpackChunktrakify=self.webpackChunktrakify||[]).push([[193],{5193:(q,u,i)=>{i.r(u),i.d(u,{ListsModule:()=>W});var g=i(6895),f=i(7392),c=i(3848),v=i(4859),y=i(6709),C=i(5412),r=i(858),p=i(1135),L=i(9841),x=i(4004),I=i(3900),h=i(9646),T=i(2722),Z=i(5492),A=i(5606),m=i(975),S=i(5022),t=i(4650),b=i(1420),M=i(1621),P=i(4373),Y=i(3608),J=i(7009),N=i(1481),w=i(1455),Q=i(8424);const U=function(){return[]},O=function(s){return{slug:s}};function B(s,e){if(1&s&&(t.TgZ(0,"a",10),t._uU(1),t.qZA()),2&s){const n=e.$implicit,o=e.index,a=t.oxw(3);t.Q6J("active",a.activeListIndex===o)("routerLink",t.DdM(4,U))("queryParams",t.VKq(5,O,n.ids.slug)),t.xp6(1),t.hij(" ",n.name," ")}}function j(s,e){if(1&s&&(t.TgZ(0,"nav",8),t.YNc(1,B,2,7,"a",9),t.qZA()),2&s){const n=t.oxw(2),o=t.MAs(3);t.Q6J("tabPanel",o),t.xp6(1),t.Q6J("ngForOf",n.lists)}}function F(s,e){if(1&s&&(t.ynx(0),t.YNc(1,j,2,2,"nav",7),t.BQk()),2&s){const n=t.oxw(),o=t.MAs(7);t.xp6(1),t.Q6J("ngIf",n.lists.length)("ngIfElse",o)}}function G(s,e){if(1&s&&(t.TgZ(0,"t-loading",0),t._UZ(1,"t-shows",11),t.qZA()),2&s){const n=t.oxw();t.Q6J("loadingState",n.listItemsLoadingState),t.xp6(1),t.Q6J("showsInfos",n.showsInfos)}}function z(s,e){if(1&s){const n=t.EpF();t.TgZ(0,"button",12),t.NdJ("click",function(){t.CHM(n);const a=t.oxw();return t.KtG(a.dialogService.manageListItems(null==a.lists?null:a.lists[a.activeListIndex]))}),t.TgZ(1,"mat-icon"),t._uU(2,"add"),t.qZA()()}}function $(s,e){1&s&&(t.TgZ(0,"div",2)(1,"h2",13),t._uU(2,"No list added."),t.qZA()())}let E=(()=>{class s extends Z.H{constructor(n,o,a,l,d,K,V,k){super(),this.showService=n,this.tmdbService=o,this.router=a,this.route=l,this.listService=d,this.dialogService=K,this.snackBar=V,this.title=k,this.pageState=new p.X(m.Gu.LOADING),this.listItemsLoadingState=new p.X(m.Gu.LOADING),this.activeListIndex=0}ngOnInit(){(0,L.a)([this.listService.lists.$,this.route.queryParams]).pipe((0,x.U)(([n,o])=>[n,X.parse(o)]),(0,I.w)(([n,o])=>{if(this.pageState.next(m.Gu.SUCCESS),this.title.setTitle("Lists - Trakify"),this.lists=n,!this.lists||0===this.lists.length)return(0,h.of)([]);const a=o.slug,l=null!==a?this.lists.findIndex(d=>d.ids.slug===a):-1;return this.activeListIndex=l>=0?l:0,this.title.setTitle(`${this.lists[this.activeListIndex].name} - Lists - Trakify`),a&&-1!==l?this.listService.getListItems$(a):(this.router.navigate([],{queryParamsHandling:"merge",queryParams:{slug:this.lists[this.activeListIndex].ids.slug}}),(0,h.of)([]))}),(0,I.w)(n=>{if(this.listItemsLoadingState.next(m.Gu.SUCCESS),!n||0===n.length)return this.showsInfos=[],(0,h.of)([]);const o=n.map(a=>({show:a.show}));return o?.sort((a,l)=>a.show?l.show&&a.show.title>l.show.title?1:-1:1),this.showsInfos=o,(0,L.a)(this.showsInfos.map(a=>this.tmdbService.getTmdbShow$(a.show?.ids,{fetch:!0})))}),(0,x.U)(n=>{0!==n.length&&(this.showsInfos=this.showsInfos?.map((o,a)=>({...o,tmdbShow:n[a]})))}),(0,T.R)(this.destroy$)).subscribe({error:n=>(0,A.q)(n,this.snackBar,this.pageState)})}}return s.\u0275fac=function(n){return new(n||s)(t.Y36(b.X),t.Y36(M.U),t.Y36(r.F0),t.Y36(r.gz),t.Y36(P.X),t.Y36(Y.x),t.Y36(J.ux),t.Y36(N.Dx))},s.\u0275cmp=t.Xpm({type:s,selectors:[["t-lists"]],features:[t.qOj],decls:8,vars:4,consts:[[3,"loadingState"],[4,"ngIf"],[1,"list"],["tabPanel",""],[3,"loadingState",4,"ngIf"],["mat-fab","","color","primary","class","fab","aria-label","Add list items",3,"click",4,"ngIf"],["noList",""],["mat-tab-nav-bar","","color","accent",3,"tabPanel",4,"ngIf","ngIfElse"],["mat-tab-nav-bar","","color","accent",3,"tabPanel"],["mat-tab-link","",3,"active","routerLink","queryParams",4,"ngFor","ngForOf"],["mat-tab-link","",3,"active","routerLink","queryParams"],[3,"showsInfos"],["mat-fab","","color","primary","aria-label","Add list items",1,"fab",3,"click"],[1,"mat-subheading-1"]],template:function(n,o){1&n&&(t.TgZ(0,"t-loading",0),t.YNc(1,F,2,2,"ng-container",1),t.TgZ(2,"mat-tab-nav-panel",2,3),t.YNc(4,G,2,2,"t-loading",4),t.qZA(),t.YNc(5,z,3,0,"button",5),t.qZA(),t.YNc(6,$,3,0,"ng-template",null,6,t.W1O)),2&n&&(t.Q6J("loadingState",o.pageState),t.xp6(1),t.Q6J("ngIf",o.lists),t.xp6(3),t.Q6J("ngIf",null==o.lists?null:o.lists.length),t.xp6(1),t.Q6J("ngIf",void 0!==o.activeListIndex))},dependencies:[g.sg,g.O5,r.yS,w.j,Q.N,f.Hw,c.BU,c.sW,c.Nj,v.lW],styles:[".list[_ngcontent-%COMP%]{display:block;max-width:50rem;margin:0 auto;padding:1rem}.list[_ngcontent-%COMP%]     .mat-list-base{margin-left:-1rem;margin-right:-1rem}"]}),s})();const X=S.z.object({slug:S.z.string().optional()}),D=[{path:"",component:E}];let H=(()=>{class s{}return s.\u0275fac=function(n){return new(n||s)},s.\u0275mod=t.oAB({type:s}),s.\u0275inj=t.cJS({imports:[r.Bz.forChild(D),r.Bz]}),s})();var R=i(4466);let W=(()=>{class s{}return s.\u0275fac=function(n){return new(n||s)},s.\u0275mod=t.oAB({type:s}),s.\u0275inj=t.cJS({imports:[g.ez,H,R.m,f.Ps,c.Nh,v.ot,y.p9,C.Is]}),s})()}}]);