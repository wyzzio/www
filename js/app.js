/// <reference path="jquery-3.5.1.min.js" />
"use strict";
window.wy = {};
wy.version = "1.3.0";
wy.isCordovaApp = false;
wy.supportedLanguages = ["fr", "en", "ar"];
// wy.fbc = {
//     apiKey: "AIzaSyDb4_05FRvSKNPRKHsdKNaqy_dkQvQ3IbE",
//     authDomain: "wyzz.io",
//     databaseURL: "https://wyzzio.firebaseio.com",
//     projectId: "wyzzio",
//     storageBucket: "wyzzio.appspot.com",
//     messagingSenderId: "407884919403",
//     appId: "1:407884919403:web:2c5e50ff8e8987b14bb72e",
//     measurementId: "G-JD3R5W3X30"
// };
wy.fbc = {
    apiKey: "AIzaSyC1J_qzL6jNrI0EZrHFEUgeUNcF-zgGDV8",
    authDomain: "wyzz-test.firebaseapp.com",
    projectId: "wyzz-test",
    storageBucket: "wyzz-test.appspot.com",
    messagingSenderId: "59139814261",
    appId: "1:59139814261:web:4f156e560923261cb5593c"
};
wy.uic = {
        signInOptions: [
            {
                provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                requireDisplayName: false
            }
        ],
        credentialHelper: firebaseui.auth.CredentialHelper.NONE,
        tosUrl: "terms",
        privacyPolicyUrl: "privacy"
};
//wy.back = "https://api.wyzz.io/v1";
//wy.back = "http://localhost:8081/v1";
wy.back = "https://wyzz-test.ew.r.appspot.com/v1";
wy.imst = "https://storage.googleapis.com/img.wyzz.io/";
wy.emex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
firebase.initializeApp(wy.fbc);
//firebase.analytics();
wy.fs = firebase.firestore();
wy.fs.settings({cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED});
wy.fs.enablePersistence({synchronizeTabs:true}).catch(function(err) {console.log(err)});
wy.db = {
    sto: function(sid){return wy.fs.collection("sto").doc(sid || wy.sid)},
    usr: function(uid){return wy.fs.collection("usr").doc(uid || wy.auth.uid)},
    col: function(c){return wy.fs.collection(c)},
    bat: function(){return wy.fs.batch()},
    it: function(){return wy.fs.collection("sto/"+wy.sid+"/it")},
    mv: function(){return wy.fs.collection("sto/"+wy.sid+"/mv")},
    tr: function(){return wy.fs.collection("sto/"+wy.sid+"/tr")},
    cs: function(){return wy.fs.collection("sto/"+wy.sid+"/cs")},
    dy: function(){return wy.fs.collection("sto/"+wy.sid+"/dy")},
    nt: function(){return wy.fs.collection("usr/"+wy.auth.uid+"/nt")},
    rel: function(){return wy.fs.collection("rel")}
};
wy.usr = {
    data:{},
    re: function(auth) {
        if (auth) {
            wy.auth = auth;
            wy.auth.getIdToken().then(function(t){wy.token = t});
        }
    },
    in: function(auth){
        if(auth){
            wy.auth = auth;
            wy.usr.off();
            $("#ace").val(auth.email);
            $("#acv").val(auth.emailVerified);
            $("#acs").val(auth.metadata.lastSignInTime);
            $("#act").val(auth.metadata.creationTime);
            if(auth.emailVerified) $("#ve").hide(); else $("#ve").show();
            wy.db.usr().get().then(wy.usr.me).catch(wy.error);
        }else wy.usr.fon();
    },
    me: function(doc){
        if(doc.exists){
            wy.usr.data[wy.auth.uid] = doc.data();
            wy.me =  doc.data();
            if (wy.me.lng) localStorage.setItem("lng",wy.me.lng);
            wy.me.stx = wy.me.stx || {};
            let sto = localStorage.getItem(wy.me.uid);
            if(sto && wy.me.stx.hasOwnProperty(sto)) {
                wy.sto.open(sto);
                wy.sto.stx();
            }
            else if(Object.keys(wy.me.stx).length == 0) wy.show("nsx");
            else wy.show("stx");
            wy.db.nt().get().then(wy.nt.listen).catch(wy.error);
            wy.pin.init();
        }else wy.api({s:"cu",lng:'fr'},wy.usr.cu);
    },
    cu: function(){
        wy.db.usr().get().then(wy.usr.me).catch(wy.error);
    },
    fon:function(){
        $("#auth").show();
        wy.fui = new firebaseui.auth.AuthUI(firebase.auth());
        wy.fui.start("#fui",wy.uic);
    },
    off:function(){
        $("#auth").hide();
        $("#fui").html("");
        delete wy.fui;
    },
    out: function(){
        firebase.auth().signOut();
        delete wy.token;
        wy.reload();
    },
    get: function(uid){
        if(wy.usr.data.hasOwnProperty(uid)) wy.usr.set(uid);
        else if(uid) wy.api({s:"gu",uid:uid},function(r){
            wy.usr.data[uid] = r;
            wy.usr.set(uid);
        });
    },
    set: function(uid){
        let n = wy.usr.data[uid].name;
        let e = wy.usr.data[uid].email;
        let d = (n && n != "") ? (n+" ("+e+")") : (e && e != "") ? e : uid;
        $("."+uid).html(d);
    },
    sve: function(){
        firebase.auth().currentUser.sendEmailVerification().then(function() {
            wy.success(i18next.t("usr.email_verification_sent"));
        }).catch(wy.error);
    },
    cpr: function(){
        wy.cfm.start(i18next.t("usr.password_reset_link"),wy.usr.spr);
    },
    spr: function(){
        firebase.auth().sendPasswordResetEmail(wy.auth.email).then(function() {
            wy.success(i18next.t("usr.password_reset_link_sent"));
        }).catch(wy.error);
    }
};
firebase.auth().onAuthStateChanged(wy.usr.in, wy.error);
firebase.auth().onIdTokenChanged(wy.usr.re,wy.error);
wy.dom ={
    cq: $("#cq"),
    cart: $("#cart"),
    foot: $("footer"),
    tiles: $("#tiles"),
}
wy.rol = {
    show: function(){
        wy.rol.get();
    },
    get: function(){
        $("#sms").html("");
        wy.api({s:"gr"},function(r){
            $.each(r,function(i,u){
                if(typeof u != "object") return;
                let t = i == wy.auth.uid ? "me" : "sm";
                $("#sms").append(wy.html(t,{i:i,e:u.email,r:i18next.t("roles."+u.r)}));
            });
        });
        wy.api({s:"gv"},function(r){
            $.each(r,function(i,v){
                if(typeof v != "object") return;
                let h = wy.html("siv",{i:i,e:v.to,r:i18next.t("roles."+v.r)});
                $("#sms").append(h);
            });
        });
    },
    entr:function(e){
        if(e.keyCode == 13) wy.rol.invt();
    },
    invt: function(){
        let e = $("#asm").val().toLowerCase();
        if(wy.emex.test(e)) e = e.toLowerCase();
        else{
            wy.error(i18next.t('rol.invalid_email'));
            return;
        }
        let r = $("#amr").val();
        wy.api({s:"cv",e:e,r:r},function(rs){
            wy.success(i18next.t('rol.inv_sent', {email: rs.e}));
            wy.rol.get();
            $("#asm").val("");
            $("#amr").val("s");
            wy.hide("ivm");
        },"#arb");
    },
    acpt: function(id){
        wy.api({s:"av",id:id},function(){
            wy.success(i18next.t('rol.inv_acpt'));
            wy.sto.stx();
        },"#avb");
    },
    rfus: function(id){
        wy.api({s:"dv",id:id},function(){
            wy.success(i18next.t('rol.inv_rfus'));
            wy.sto.stx();
        },"#rvb");
    },
    divt: function(id){
        wy.api({s:"dv",id:id,sid:wy.sid},function(){
            wy.success(i18next.t('rol.inv_del'));
            wy.rol.get();
        },"#dvb");
    },
    drol: function(id){
        wy.rol.id = id;
        wy.cfm.start(i18next.t('rol.cfm_access_del'),wy.rol._drol);
    },
    _drol: function(){
        wy.api({s:"dr",uid:wy.rol.id},function(){
            wy.success(i18next.t('rol.role_deleted'));
            wy.rol.get();
        },"#drb");
    }
};
wy.sto = {
    foot: $("footer"),
    sn:"",cr:"",ct:{},
    stores: {},
    uns: function(){},
    open: function(sid){
        wy.sid = sid;
        wy.sto.reset();
        wy.sto.paintDrafts();
        wy.sto.role = wy.me.stx[sid];
        let mcl = ["#mbmm","#mbab","#mbst"];
        let scl = ["#mbts","#mbad","#mbct","#mbcs","#mbst","#mbmm","#mbab","#axl","#vtb"];
        if(wy.sto.role == "s") scl.forEach(function(s){$(s).hide()});
        if(wy.sto.role == "m") mcl.forEach(function(s){$(s).hide()});
        wy.db.sto().get().then(function(doc) {
            if(doc.exists){
                $("#dashboard").show();
                let s = doc.data();
                wy.sto.sn = s.n;
                wy.sto.cr = s.cr;
                wy.sto.st = s.t;
                wy.sto.ct = s.ct;
                wy.sto.cl = s.cl;
                wy.hex("scl",s.cl);
                wy.ct.update();
                wy.update("brand",wy.sto.sn);
                wy.update("cur",wy.sto.cr);
                $(".hdr").css("background-color",wy.sto.cl);
                wy.sto.listen();
                wy.mv.listen();
            }else{
                localStorage.removeItem(wy.me.uid);
                wy.show("stx");
            }
        });
    },
    listen: function(){
        wy.sto.uns();
        wy.sto.uns = wy.db.it().onSnapshot(function(snapshot) {
            let ad = 0;
            snapshot.docChanges().forEach(function(change) {
                let it = change.doc.data();
                it.i = change.doc.id;
                if(change.type === "removed"){
                    wy.it.rem(it);
                    return;
                }else if(change.type === "added") ad++;
                it.q = it.qi+it.qa+it.qt-it.qo;
                it.v = it.q*it.ac;
                it.cn = wy.sto.ct[it.ct];
                it.pa = it.n+" "+it.bc+" "+it.cn;
                it.lt = it.n.substr(0,1).toLowerCase();
                it.cr = wy.sto.cr;
                it.cl = it.cl || wy.rcl();
                it.img = it.hasOwnProperty("img") ? wy.imst+it.img : "/img/1x1.png";
                wy.sto.it[it.i] = it;
                wy.sto.ix[it.n] = it.i;
                it.bc = it.bc || [];
                it.bc.forEach(bc => wy.sto.ix[bc] = it.i);
                wy.ti.update(it);
                if(ad == 0) wy.it.update(it);
            });
            if(ad>0) wy.it.paint();
        });
    },
    reset: function(){
        wy.sto.it = {};
        wy.sto.ix = {};
        wy.sto.ct = {};
        wy.tr.reset();
        wy.mv.reset();
    },
    get: function(){
        $("#sn").val( wy.sto.sn);
        $("#sc").val( wy.sto.cr);
        $("#st").val(wy.std( wy.sto.st));
        wy.api({s:"gs"},function(s){
            s.q = s.qi-s.qo+s.qa+s.qt;
            s.v = 0;
            Object.values(wy.sto.it).forEach(it => s.v += it.v);
            $("#sv").html(wy.fx(s.v));
            $("#sq").html(s.q);
            $("#sp").html(wy.fx(s.m));
            $("#sqi").html(s.qi);
            $("#svi").html(wy.fx(s.vi));
            $("#sqo").html(s.qo);
            $("#svo").html(wy.fx(s.vo));
            $("#sqa").html(s.qa);
            $("#sva").html(wy.fx(s.va));
            $("#sqt").html(s.qt);
            $("#svt").html(wy.fx(s.vt));
            let sl = s.lib == wy.sid ?  wy.sto.sn : s.lin;
            $("#sl").val(sl);
        });
    },
    save: function(){
        let n = $("#sn").val();
        let cr = $("#sc").val();
        let cl = $("#scl").val().replace(/[^0-9A-F]/gi,"").substring(0,6);
        wy.api({s:"us",n:n,cr:cr,cl:cl},function(){
            wy.success(i18next.t('cfg.saved_settings'));
            wy.sto.sn = n;
            wy.sto.cr = cr;
            wy.sto.cl = "#"+cl;
            wy.update("brand",wy.sto.sn);
            wy.update("cur",wy.sto.cr);
            $(".hdr").css("background-color",wy.sto.cl);
        },"#ssb",function(e){
            wy.error(e);
            $("#sn").trigger("focus");
        });
    },
    stx: function(){
        $("#sss").html("");
        //TODO do we need to read usr or can do with wy.me
        wy.db.col("usr").doc(wy.auth.uid).get().then(function(snap) {
            let map = snap.get("stx");
            for(const sto in map){
                if(!map.hasOwnProperty(sto)) continue;
                let r = i18next.t("roles."+map[sto]);
                wy.db.sto(sto).get().then(function(s){
                    if(!s.exists) return;
                    let store = s.data();
                    let se = {i:s.id,n:store.n,r:r,cl:store.cl};
                    wy.sto.stores[s.id] = se;
                    se.y = s.id == wy.sid ? "ses" : "";
                    $("#sss").prepend(wy.html("se",se));
                }).catch(wy.error);
            }
        }).catch(wy.error);
        wy.db.col("ivt").where("to", "==", wy.auth.email).get().then(function(snap) {
            snap.forEach(function(iv) {
                let data = iv.data();
                let r = i18next.t(`roles.${data.r}`);
                let h = wy.html("inv",{i:iv.id, inv_msg: i18next.t("rx.inv_msg", {n:data.sn,r:r}), inv_acpt: i18next.t("rx.inv_acpt"), inv_rfus: i18next.t("rx.inv_rfus")});
                $("#sss").append(h);
            });
        }).catch(wy.error);
    },
    select: function(sid){
        if(wy.sid == sid) return;
        $("#dashboard").hide();
        localStorage.setItem(wy.me.uid,sid);
        wy.reload();
    },
    create: function(e){
        let n = $("#nsn").val();
        if(n.length < 2) return;
        let cr = $("#nscr").val();
        let lib = $("#nsl").val();
        wy.api({s:"cs",n:n,cr:cr,lib:lib,cl:"#FFFFFF"},function(r){
            $("#nsn").val("");
            $("#nscr").val("");
            let h = wy.html("se",{i:r.sid,n:r.n,c:"",y:"",r:"owner"});
            $("#sss").append(h);
            wy.sto.select(r.sid);
            wy.hide("nsx");
        });
    },
    nsx: function(){
        $("#nsn").trigger("focus");
        let nsl = $("#nsl");
        let nscr = $("#nscr");
        let nscrb = $("#nscrb");
        let libs = {};
        wy.db.col("lib").where("o", "==", wy.me.uid).get().then(function(snap){
            nsl.html(`<option value='_new_'>${i18next.t('sx.new-catalog')}</option>`);
            snap.forEach(function(doc) {
                libs[doc.id] = doc.data();
                nsl.append("<option value='"+doc.id+"'>"+doc.data().n+"</option>");
            });
        })
        .catch(wy.error)
        .finally(function(){
            nsl.off("change").on("change",function(){
                let val = $(this).val();
                if(val == "_new_") {
                    nscr.prop("disabled",false).val("").trigger("focus");
                    nscrb.show();
                }
                else{
                    let lib = libs[val];
                    nsl.val(val);
                    if (lib?.cr) {
                        nscr.val(lib.cr).prop("disabled",true);
                        nscrb.hide();
                    } else {
                        nscr.prop("disabled",false).val("").trigger("focus");
                        nscrb.show();
                    }
                }
            });
        });
    },
    delete: function(){
        if(wy.sto.sn != $("#ds").val()) return false;
        wy.sto.uns();
        wy.api({s:"ds"},function(r){
            localStorage.removeItem(wy.me.uid);
            wy.reload();
        });
    },
    paintDrafts: function(){
        let draft = localStorage.getItem("drafts_"+wy.sid+"_wyzz");
        if (draft) {
            let lt = JSON.parse(draft);
            if(lt.hasOwnProperty("i") && lt.i.length > 0) {
                for(let i=0;i<lt.i.length;i++) wy.in.cast(lt.i[i]);
            }
            if(lt.hasOwnProperty("o") && lt.o.length > 0) {
                for(let i=0;i<lt.o.length;i++) wy.ou.cast(lt.o[i]);
            }
            if(lt.hasOwnProperty("t") && lt.t.length > 0) {
                for(let i=0;i<lt.t.length;i++) wy.ts.cast(lt.t[i]);
            }
            if(lt.hasOwnProperty("a") && lt.a.length > 0) {
                for(let i=0;i<lt.a.length;i++) wy.ad.cast(lt.a[i]);
            };
        }
    },
};
wy.ct = {
    get: function(){
        wy.db.sto().get().then(function(doc) {
            wy.sto.ct = doc.data().ct;
            wy.ct.update();
        });
    },
    add: function(){
        $("#cta").show();
        $("#nct").trigger("focus");
    },
    create: function(){
        let ct = $("#nct").val();
        //TODO check ct length and char types
        if(wy.sto.ct.hasOwnProperty(ct)) return;
        wy.api({s:"cc",ct:ct},function(){
            $("#nct").val("");
            $("#cta").hide();
            wy.ct.get();
        });
    },
    delete: function(ct){
        wy.api({s:"dc",ct:ct},function(){
            wy.ct.get();
        });
    },
    update: function(){
        wy.ct.keys = Object.keys(wy.sto.ct);
        wy.ct.keys.sort(function (a,b) {
            return (wy.sto.ct[a] < wy.sto.ct[b]) ? -1 : 1 ;
        });
        wy.ct.set("ctb","ctl");
        wy.ct.set("ctr","cts");
        wy.ct.set("opt","ict","<option value='' selected>---</option>");
        wy.ct.set("opt","nict","<option value='' selected>---</option>");
    },
    set: function(s,d,e){
        let dest = $("#"+d);
        dest.html(e || "");
        for(let key in wy.ct.keys){
            const v =  wy.ct.keys[key];
            const n = wy.sto.ct[v];
            const o = {v,n};
            if (s == "ctr") Object.assign(o,{del_n:i18next.t("delete_n", {n}), yes: i18next.t("yes"), no: i18next.t("no")});
            dest.append(wy.html(s,o));
        }
    },
    toggle: function(i){
        $("#ct"+i).toggle();
    },
    sct: function(i){
        if(wy.sto.ctt == "ti") wy.ti.sct(i);
        else if(wy.sto.ctt == "it") wy.it.sct(i);
    }
}
wy.ti = {
    q: "",
    rx: /.*/i,
    clear: function(){
        $("#tichi").val("");
        wy.ti.query();
    },
    query: function(v){
        if(v) $("#tichi").val(v);
        let q = $("#tichi").val();
        if(wy.ti.q == q) return;
        wy.ti.q = q;
        wy.ti.rx = q.length > 1 ? new RegExp(q, "i") : /.*/i;
        //wy.ti.paint();
        let ar = [];
        $.each(wy.sto.it,function(i,o){ar.push(o)});
        ar.sort(function (a,b) {
            return (a.n < b.n) ? -1 : (a.n > b.n) ? 1 : 0;
        }).forEach(it => wy.ti.update(it));
    },
    sct: function(i){
        let ct = wy.sto.ct[i];
        wy.ti.query(ct);
        wy.ti.sch();
    },
    paint: function(){
        let ar = [];
        $.each(wy.sto.it,function(i,o){ar.push(o)});
        ar.sort(function (a,b) {
            return (a.n < b.n) ? -1 : (a.n > b.n) ? 1 : 0;
        }).forEach(it => wy.ti.update(it));
    },
    update: function(it){
        let ti = $("#ti"+it.i);
        let sc = it.e && wy.ti.rx.test(it.pa) ? "tif" : "tic";
        let lt = /[a-z]/.test(it.lt) ? it.lt : "0";
        if(ti.length) ti.replaceWith(wy.html(sc,it));
        else{
            $("#tc"+lt).before(wy.html(sc,it));
            $("#tx"+lt).show();
        }
    },
    open: function(y){
        wy.ti.y = y;
        let cq = y == "a" ? wy.ty[y].cnt : wy.ty[y].mv.q;
        wy.dom.cq.html(cq);
        wy.show("tix");
    },
    tch: function(i){
        if(wy.ti.y == 'o') wy.ou.tch(i);
        else if(wy.ti.y == 'i') wy.in.tch(i);
        else if(wy.ti.y == 't') wy.ts.tch(i);
        else if(wy.ti.y == 'a') wy.ad.tch(i);
    }
};
wy.it = {
    i: "",
    q: "",
    sk: "n",
    so: 1,
    c: false,
    rx: /.*/i,
    fi: function(it){
        return it.e;
    },
    filter: function(el){
        $(".ifi").removeClass("mdi-radiobox-marked").removeClass("text-primary");
        let e = $(el);
        e.find("i").addClass("mdi-radiobox-marked").addClass("text-primary");
        $("#tbf").text(e.text());
        let f = e.attr("data-filter");
        if(f == "is")wy.it.fi = function(it){return it.q > 0};
        else if(f == "os") wy.it.fi = function(it){return it.q <= 0};
        else if(f == "ac") wy.it.fi = function(it){return it.e};
        else if(f == "ic") wy.it.fi = function(it){return !it.e};
        else wy.it.fi = function(it){return true};
        wy.it.paint();
    },
    query: function(v){
        if(v) $("#itchi").val(v);
        let q = $("#itchi").val();
        if(wy.it.q == q) return;
        wy.it.q = q;
        wy.it.rx = q.length > 1 ? new RegExp(q, "i") : /.*/i;
        wy.it.paint();
    },
    paint: function(){
        $("#tbc").html("");
        let ar = [];
        $.each(wy.sto.it,function(i,o){ar.push(o)});
        let k = wy.it.sk;
        let o = wy.it.so;
        ar.sort(function (a,b) {
            let r = (a[k] < b[k]) ? -1 : (a[k] > b[k]) ? 1 : 0;
            return r * o;
        }).forEach(it => wy.it.update(it));
        if(wy.sto.role=='s') $(".hide-s").hide();
    },
    update: function(it){
        let rw = $("#rw"+it.i);
        let sc = wy.it.fi(it) && wy.it.rx.test(it.pa) ? "rwf" : "rwc";
        let ob = {i:it.i,e:it.e,n:it.n,c:it.bc[0]||'',q:it.q,p:wy.fx(it.p)};
        if(rw.length) rw.replaceWith(wy.html(sc,ob));
        else $("#tbc").append(wy.html(sc,ob));
        if(wy.sto.role=='s') $("#tbc .hide-s").hide();
    },
    sort: function(e){
        let k = $(e).attr("data-key");
        if(wy.it.sk == k) wy.it.so = wy.it.so * -1;
        else{
            wy.it.sk = k;
            wy.it.so = 1;
        }
        $("#itb").find(".arrow").remove();
        let up = wy.it.so == 1 ? "" : " up";
        $(e).append("<span class='arrow"+up+"'></span>");
        wy.it.paint();
    },
    selectall:function(isa){
        $("#tbc").find(".isl").each(function(){this.checked = isa.checked});
    },
    enable:function(){
        let ids = "";
        $("#tbc").find(".isl:checked").each(function(){
            ids += this.getAttribute("data-row")+";";
        });
        if(ids=="") return;
        wy.api({s:"ei",ids:ids},function(){wy.success(i18next.t("item.enabled"))});
    },
    disable:function(){
        let ids = "";
        $("#tbc").find(".isl:checked").each(function(){
            ids += this.getAttribute("data-row")+";";
        });
        if(ids=="") return;
        wy.api({s:"si",ids:ids},function(){wy.success(i18next.t("item.disabled"))});
    },
    transfer: function(){
        wy.show("tsx");
        $("#tbc").find(".isl:checked").each(function(){
            let id = this.getAttribute("data-row");
            let it = wy.sto.it[id];
            wy.ts.select(null,it);
            wy.ts.add();
        });
    },
    adjust: function(){
        wy.show("adx");
        $("#tbc").find(".isl:checked").each(function(){
            let id = this.getAttribute("data-row");
            if(id in wy.ad.mv) return;
            let it = wy.sto.it[id];
            wy.ad.select(null,it);
            wy.ad.mvq.val(it.q);
            wy.ad.add();
        });
       
    },
    get: function(i){
        wy.it.c = false;
        wy.it.i = i;
        let it = wy.sto.it[i];
        if(typeof it == "undefined") return;
        $("#in").val(it.n);
        $("#ic").val(wy.fx(it.c));
        $("#ip").val(wy.fx(it.p));
        $("#ie").prop("checked",it.e || false);
        $("#ibc").val("").off("keydown").on("keydown", function(e){if (e.keyCode === 13) wy.it.abc()});
        $("#bcs").html(it.bc.map(bc => wy.html("bci", {bc, msg: i18next.t("delete-barcode", {bc}), yes: i18next.t("yes"), no: i18next.t("no")})).join(''));
        $("#ict").val(it.ct || "");
        $("#it").html(it.n);
        $("#iq").html(it.q);
        $("#iv").html(wy.fx(it.v));
        $("#im").html(wy.fx(it.m));
        $("#iqi").html(it.qi);
        $("#ivi").html(wy.fx(it.vi));
        $("#iqo").html(-it.qo);
        $("#ivo").html(wy.fx(it.vo));
        $("#iqt").html(it.qt);
        $("#ivt").html(wy.fx(it.vt));
        $("#iqa").html(it.qa);
        $("#iva").html(wy.fx(it.va));
        $("#iib").html(it.lt);
        $("#iit").css("background-color",it.cl).attr("data-color",it.cl);
        wy.it.bc = Object.assign([],it.bc);
        wy.it.iel(document.querySelector("#ie"));
        wy.it.img(it.img);
        if (wy.sto.role == 's') {
            $(".hide-s").hide(); // TODO: Remove object from DOM
            // $(".hide-s").empty();
        }
        wy.show("itx");
    },
    img: function(src){
        let iim = document.getElementById('iim');
        iim.setAttribute("data-src",src);
        iim.retries = 0;
        iim.src = src;
        let d = (src == "/img/1x1.png");
        $("#iii").toggle(d);
        $("#iid").toggle(!d);
    },
    iel: function(e){
        $('label[for="'+e.id+'"]').text(e.checked ? i18next.t("e.true") : i18next.t("e.false")).toggleClass("text-secondary",!e.checked);
    },
    code: function(){
        wy.it.c = true;
        wy.it.bc = [];
        let keys = Object.keys(wy.sto.it);
        keys.sort(function(a,b){return +a-b});
        let nx = +keys.pop()+1;
        $("#nii").val(nx);
        $("#nin").trigger("focus");
        $("#nibc").off("keydown").on("keydown", function(e){if (e.keyCode === 13) wy.it.abc()});
        $("#nbcs").html("");
    },
    his: function(i){
        wy.it.i = i || wy.it.i;
        $("#pht").html(wy.sto.it[wy.it.i].n);
        $("#his").html("");
        wy.db.mv().where("i", "==", wy.it.i).orderBy("t","desc").limit(25).get().then(function(snap){
            snap.forEach(function(doc){
                let mv = doc.data();
                if(!mv.f) return;
                //TODO: show nonprocessed separately?
                mv.t = wy.std(mv.t);
                mv.n = wy.trn(mv);
                if(mv.y == "o") mv.q = -mv.q;
                mv.sg = mv.q < 0 ? "-" : "+";
                if(mv.q < 0) mv.q = -mv.q;
                $("#his").append(wy.html("hit",mv));
            });
        }).catch(wy.error);
    },
    add: function(){
        wy.it.abc();
        let it = {
            s: "ci",
            n: $("#nin").val().trim(),
            e: document.querySelector('#nie').checked,
            c: +$("#nic").val(),
            p: +$("#nip").val(),
            ct: $("#nict").val(),
            cl: wy.rcl(),
            bc: wy.it.bc.join(",")
        };
        if(+it.i <=0 || it.n == null || it.n.length == 0 || it.c < 0 || it.p < 0){
            wy.error(i18next.t("item.invalid_information"));
        }else{
            wy.api(it,function(r){
                wy.success(i18next.t("item.created"));
                let q = +$("#niq").val();
                if(q > 0){
                    let v = it.c * q;
                    let t = firebase.firestore.Timestamp.now();
                    let doc = wy.db.tr().doc();
                    let bat = wy.db.bat();
                    bat.set(doc,{t:t,y:"i",cm:""});
                    bat.set(wy.db.mv().doc(),{v:v,q:q,tr:doc.id,t:t,f:false,i:r.i,n:it.n,y:"i",bc:it.bc});
                    bat.commit().then(function(){
                        wy.hs.tr = {id:doc.id,y:"i"};
                        wy.hs.val();
                    }).catch(wy.error);
                }
                wy.it.clear();
                wy.hide("nix");
            },"#nib");
        }
        return false;
    },
    clear: function(){
        $("#nii").val("");
        $("#nin").val("");
        $("#nic").val("");
        $("#nip").val("");
        $("#niq").val("");
        $("#nibc").val("");
        $("#nict").val("");
    },
    save: function(){
        wy.it.abc();
        let it = {
            s: "ui",
            i: wy.it.i,
            e: document.querySelector('#ie').checked,
            n: $("#in").val().trim(),
            c: +$("#ic").val(),
            p: +$("#ip").val(),
            ct: $("#ict").val(),
            cl: $("#iit").attr("data-color"),
            bc: wy.it.bc.join(",")
        };
        if(it.n == null || it.n.length == 0 || it.c < 0 || it.p < 0){
            wy.error(i18next.t("item.invalid_information"));
        }else{
            wy.api(it,function(){
                wy.success(i18next.t("item.saved"));
            },"#sib");
        }
    },
    rem: function(it){
        $("#rw"+it.i).remove();
        $("#ti"+it.i).remove();
        delete wy.sto.it[it.i];
        delete wy.sto.ix[it.n];
    },
    delete: function(){
        wy.cfm.start(i18next.t("item.cfm_del"),wy.it._delete);
    },
    _delete: function() {
        let it = wy.sto.it[wy.it.i];
        if(typeof it == "undefined") return;
        if(it.q == 0){
            wy.api({s:"di",i:wy.it.i},function(){
                wy.success(i18next.t("item.deleted"));
                wy.hide("itx");
            },"#dib");
        }else{
            wy.error(i18next.t("item.qtty_zero_to_del"));
        }
    },
    abc: function(){
        const iid = wy.it.c ? "#nibc" : "#ibc";
        const cid = wy.it.c ? "#nbcs" : "#bcs";
        const bc = $(iid).val().trim();
        if (!bc || wy.it.bc.includes(bc)) return;

        if (wy.sto.ix.hasOwnProperty(bc)) {
            const n = wy.sto.it[wy.sto.ix[bc]].n;
            wy.error(i18next.t('item.barcode_used', {n}));
            return;
        }
        wy.it.bc.push(bc);
        $(cid).prepend(wy.html("bci",{bc, msg: i18next.t("delete-barcode", {bc}), yes: i18next.t("yes"), no: i18next.t("no")}));
        $(iid).val("").trigger("focus");
    },
    tbc: function(bc){
        $("#bc"+bc).toggle();
    },
    dbc: function(bc){
        $("#bci"+bc).remove();
        wy.it.bc = wy.it.bc.filter(c => c != bc);
    },
    hide: function(){
        let iid = wy.it.c ? "#nibc" : "#ibc";
        let it = wy.sto.it[wy.it.i];
        if($("#in").val() == it.n && $("#ict").val() == it.ct && $("#ic").val() == it.c && $("#ip").val() == it.p && $("#ie").prop("checked") == it.e && wy.it.bc.length == it.bc.length && wy.it.bc.filter(bc => !it.bc.includes(bc)).length == 0 && $(iid).val().length == 0) wy.hide("itx");
        else wy.cfm.start(i18next.t('item.cfm_exit_without_saving'), ()=>{wy.hide("itx")});
    }
};
wy.mv = {
    data: {},
    uns: function(){},
    listen: function(){
        wy.mv.since = moment();
        wy.mv.uns();
        wy.mv.uns = wy.db.mv().where("t", ">", wy.mv.since.toDate()).orderBy("t", "asc").onSnapshot({includeMetadataChanges: true},function(snapshot){
            snapshot.docChanges().forEach(function(change) {
                let doc = change.doc;
                let mv = doc.data();
                mv.id = doc.id;
                if (change.type === "removed"){
                    delete wy.mv.data[mv.id];
                    $("."+mv.id).remove();
                    if($(".c-"+mv.tr).children().length == 0) $("."+mv.tr).remove();
                    return;
                }
                mv.pw = doc.metadata.hasPendingWrites;
                mv.ic = wy.icon(mv);
                mv.t = wy.std(mv.t);
                wy.mv.data[mv.id] = mv;

                wy.tr.read(mv.tr, function(tr){
                    if(tr.mv == undefined) tr.mv = [];
                    if(tr.mv.indexOf(mv.id) < 0) tr.mv.push(mv.id);
                    tr.f = mv.f;
                    tr.n = wy.trn(tr);
                    wy.tr.data[mv.tr] = tr;

                    let trs = $("#trs"+mv.y);
                    wy.mv.update(trs,mv);

                    let y = wy.hs.y == "_" ? "_" : mv.y;
                    if(wy.hs.init && wy.hs.y == y && wy.hs.to.isAfter(wy.mv.since)) wy.mv.update(wy.hs.trs,mv);
                    wy.tr.sum(tr);
                });
            });
        });
    },
    update: function(ct,mv){
        if(ct.find("."+mv.id).length > 0) ct.find("."+mv.id).remove();
        else if(ct.find("."+mv.tr).length == 0){
            ct.prepend(wy.html("tp",{id:mv.tr}));
            ct.find("."+mv.tr).prepend(wy.html("tc",wy.tr.data[mv.tr]));
        } 
        ct.find(".c-"+mv.tr).append(wy.html("mc",mv));
    },
    reset: function(){
        wy.mv.data = {};
    }
};
wy.tr = {
    data:{},
    get: function(tr){
        if (wy.tr.data.hasOwnProperty(tr.id)) return Promise.resolve(wy.tr.data[tr.id]);
        return wy.db.mv().where("tr", "==", tr.id).get().then(function(mvs) {
            tr.mv = [];
            mvs.forEach(function(doc) {
                let mv = doc.data();
                mv.id = doc.id;
                mv.pw = doc.metadata.hasPendingWrites;
                mv.ic = wy.icon(mv);
                mv.t = wy.std(mv.t);
                wy.mv.data[mv.id] = mv;
                if(tr.mv.indexOf(mv.id) < 0) tr.mv.push(mv.id);
            });
            wy.tr.data[tr.id] = tr;
            return tr;
        });
    },
    set: function(tr){
        if(tr.mv.length == 0){
            $("."+tr.id).html("");
            return;
        }
        $("."+tr.id).html(wy.html("tc",tr));
        Object.values(tr.mv).forEach(v =>{
            let mv = wy.mv.data[v];
            $(".c-"+tr.id).append(wy.html("mc",mv));
        });
        wy.tr.sum(tr);
    },
    sum: function(tr){
        tr.q = 0;
        tr.v = 0;
        $.each(tr.mv,function(i,v){
            let mv = wy.mv.data[v];
            if(mv && typeof mv.q == "number") tr.q += mv.q;
            if(mv && typeof mv.v == "number") tr.v += mv.v;
        });
        $("."+tr.id+"-q").html(tr.q);
        $("."+tr.id+"-v").html(wy.fx(tr.v));
    },
    read: function(tid, cb=null){
        if(!wy.tr.data.hasOwnProperty(tid)) wy.tr.data[tid] = {};
        wy.db.tr().doc(tid).get().then(function(doc) {
            let o = doc.data();
            delete o.ph;
            o.t = wy.std(o.t);
            o.cm = wy.trc(o);
            o.id = tid;
            Object.assign(wy.tr.data[tid],o);
            if(cb) cb(o);
        });
    },
    reset: function(){
        wy.tr.data = {};
    },
    from: function(doc){
        let tr = doc.data();
        tr.id = doc.id;
        tr.t = wy.std(tr.t);
        tr.n = wy.trn(tr);
        tr.cm = wy.trc(tr);
        return tr;
    }
};
wy.hs = {
    y: "_",
    to: moment().endOf("day"),
    ps: 25,
    top: 0,
    hsw: $("#hsw"),
    trs: $("#trs"),
    init: false,
    all: false,
    get: function(){
        wy.hs.trs.html("");
        wy.hs.last = null;
        wy.hs.end = false;
        if(wy.sto.role == 's') {
            wy.hs.y = 'o';
            $("#mvy").hide();
        }
        wy.hs.next();
        $("#hdl").html(wy.hs.to.format("ll"));
        wy.hs.init = true;
    },
    next: function(){
        if(wy.hs.end) return;
        let o = wy.disable("mvy");
        let q =  wy.db.tr().where("t", "<=", wy.hs.to.toDate());
        if(wy.hs.y != "_") q = q.where("y","==",wy.hs.y);
        q = q.orderBy("t", "desc").limit(wy.hs.ps);
        if(wy.hs.last != null) q = q.startAfter(wy.hs.last);
        q.get().then(function(trs) {
            wy.enable(o);
            wy.hs.end = trs.docs.length < wy.hs.ps;
            trs.forEach(function(doc) {
                wy.hs.last = doc;
                let tr = wy.tr.from(doc);
                wy.hs.trs.append(wy.html("tp",{id:tr.id}));
                wy.tr.get(tr).then(function(tr){
                    wy.tr.set(tr);
                });
            });
        });
    },
    scroll: function(){
        let top = wy.hs.hsw.scrollTop();
        let up = top < wy.hs.top;
        wy.hs.top = top;
        if(up) return;
        let d = new Date();
        if (wy.hs.timer > 0 && (d.getTime() - wy.hs.timer) < 2000) return;
        else wy.hs.timer = 0;
        if ((wy.hs.hsw.height() + top + 350) > wy.hs.trs.height()) {
            wy.hs.next();
            wy.hs.timer = d.getTime();
        }  
    },
    open: function(id){
        let tr = wy.tr.data[id];
        if(typeof tr != 'object') return;
        if(tr.f) wy.hs.openhs(tr);
        else wy.hs.openvl(tr);
        wy.hs.tr = tr;
    },
    openhs: function(tr){
        wy.hs.sel = {};
        wy.hs.all = false;
        $("#hs").html("");
        $("#hsl").html("");
        $("#hsi").html(tr.id);
        $("#hst").html(tr.t);
        $("#hsq").html(tr.q);
        $("#hsv").html(wy.fx(tr.v));
        $("#hsy").html(i18next.t("trt."+tr.y));
        $("#hsr").prop("disabled",true);
        $("#hsh").removeClass().addClass("y"+tr.y);
        $("#hsb").html("<i class='mdi mdi-checkbox-blank-outline text-muted'></i>");
        let cm = (tr.cm && tr.cm.length > 0) ? wy.html("comm",{cm:tr.cm}) : "";
        let nr = tr.y == 't' || tr.y == 'a';
        $("#hsb").prop("disabled",nr);
        $("#hsn").html(cm);
        if(tr.y == "t") wy.sx.hs(tr);
        $("#hssd").toggle(tr.y == "t");
        $.each(tr.mv,function(i,v){
            let mv = wy.mv.data[v];
            if(typeof mv != "object") return;
            mv.sb =  nr || mv.r ? "d-none" : "";
            if(mv.l){
                mv.l.split(";").forEach(function(l){
                    if(wy.mv.data.hasOwnProperty(l)) $("#hsl").append(wy.html("lkd",wy.mv.data[l]));
                });
            }
            $("#hs").append(wy.html("mh",mv));
        });
        $("#hsu").html(wy.html("usr",{u:tr.u || ""}));
        wy.usr.get(tr.u);
        wy.show("htx");
    },
    openvl: function(tr){
        $("#vl").html("");
        $("#vli").html(tr.id);
        $("#vlt").html(tr.t);
        $("#vlq").html(tr.q);
        $("#vlv").html(wy.fx(tr.v));
        $("#vly").html(i18next.t("trt."+tr.y));
        $("#vlh").removeClass().addClass("y"+tr.y);
        let cm = (tr.cm && tr.cm.length > 0) ? wy.html("comm",{cm:tr.cm}) : "";
        $("#vln").html(cm);
        if(tr.y == "t") wy.sx.hs(tr);
        $("#vlsd").toggle(tr.y == "t");
        $.each(tr.mv,function(i,v){
            let mv = wy.mv.data[v];
            if(typeof mv != "object") return;
            mv.sb =  "d-none";
            $("#vl").append(wy.html("mh",mv));
        });
        $("#vlu").html(wy.html("usr",{u:tr.u || ""}));
        wy.usr.get(tr.u);
        wy.show("vlx");
    },
    select: function(id){
        if(id in wy.hs.sel){
            delete wy.hs.sel[id];
            $("#hs").find("#b"+id).html("<i class='mdi mdi-checkbox-blank-outline text-muted'></i>");
        }else if(wy.mv.data[id].r){
        }else{
            wy.hs.sel[id] = wy.mv.data[id];
            $("#hs").find("#b"+id).html("<i class='mdi mdi-checkbox-marked-outline text-primary'></i>");
        }
        wy.hs.hsr();
    },
    selectall: function(){
        wy.hs.sel = {};
        if(wy.hs.all){
            wy.hs.all = false;
            $("#hs").find(".sb").html("<i class='mdi mdi-checkbox-blank-outline text-muted'></i>");
            $("#hsb").html("<i class='mdi mdi-checkbox-blank-outline text-muted'></i>");
        }else{
            $.each(wy.hs.tr.mv,function(i,v){
                let mv = wy.mv.data[v];
                if(typeof mv != "object" || mv.r) return;
                wy.hs.sel[v] = mv;
                $("#hs").find("#b"+v).html("<i class='mdi mdi-checkbox-marked-outline text-primary'></i>");                
            });
            wy.hs.all =  !$.isEmptyObject(wy.hs.sel);
            if(wy.hs.all)
                $("#hsb").html('<i class="mdi mdi-checkbox-marked-outline text-primary"></i>');
        }
        wy.hs.hsr();
    },
    hsr: function(){
        let r = true;
        for(let id in wy.hs.sel)
            if(wy.hs.sel.hasOwnProperty(id)) r = false;
        $("#hsr").prop("disabled",r);
        // $("#hsr").prop("disabled",$.isEmptyObject(wy.hs.sel));
    },
    return: function(){
        for (let id in wy.hs.sel) {
            if(wy.hs.sel.hasOwnProperty(id) && typeof wy.hs.sel[id] == "object"){
                let rt = wy.hs.sel[id];
                let mv = {id:id,i:rt.i,r:true,l:rt.id,n:rt.n,bc:rt.bc};
                mv.q = wy.hs.req(rt);
                mv.v = wy.hs.rev(rt);
                if(wy.hs.tr.y == "o") wy.ou.cast(mv);
                else if(wy.hs.tr.y == "i") wy.in.cast(mv);
                else if(wy.hs.tr.y == "t") wy.ts.cast(mv);
            }
        }
        wy.hide("hsx");
        let x = wy.hs.tr.y == "i" ? "inx" : "oux";
        wy.show(x);
        $("#"+ wy.hs.tr.y+"cart").scrollTop(0);
    },
    req:function(rt){
        let rq = rt.rq || 0;
        return wy.neg(rt.q - rq);
    },
    rev:function(rt){
        let rv = rt.rv || 0;
        return wy.neg(rt.v - rv);
    },
    type: function(y){
        if(wy.hs.y == y) return;
        wy.hs.sety(y);
        wy.hs.get();
    },
    sety: function(y){
        wy.hs.y = y;
        $("#mvyl").html(wy.trn(y));
    },
    val: function(){
        let s = "t"+wy.hs.tr.y;
        wy.api({s:s,tr:wy.hs.tr.id},function(){
            wy.hide("vlx");
            wy.success(i18next.t('hs.validated'));
        },"#vtb");
    },
    delete: function(){
        wy.cfm.start(i18next.t("hs.cfm_del"),wy.hs.dt);
    },
    dm: function(id){
        wy.api({s:"dm",mv:id},function(){
            $("#vl").find("#"+id).remove();
        });
    },
    dt: function(){
        wy.api({s:"dt",tr:wy.hs.tr.id},function(){
            wy.hide("vlx");
            wy.success(i18next.t("hs.deleted"));
            $("."+wy.hs.tr.id).remove();
        },"#dtb");
    }
};
wy.nt = {
    container: $("#nts"),
    modal: $("#nt"),
    nb: $("#nb-nt"),
    ntf: $("#ntf"),
    ntfl: $("#ntfl"),
    data: {},
    uns: function(){},
    listen: function(){
        wy.nt.uns();
        wy.nt.uns = wy.db.nt().orderBy("t", "asc").onSnapshot(function (snapshot) {
            snapshot.docChanges().forEach(function(change) {
                let nt = change.doc.data();
                nt.id = change.doc.id;
                if (change.type == "removed"){
                    delete wy.nt.data[nt.id];
                } else {
                    wy.nt.data[nt.id] = nt;
                    nt.dm = !nt.ds ? "d-none" : "";
                }
                let nb = Object.values(wy.nt.data).length;
                if (nb > 0) {
                    wy.nt.nb.text(nb > 9 ? '+9' : nb).show();
                } else { 
                    wy.nt.nb.hide();
                }
            });
        });

        wy.nt.modal.on("show.bs.modal", function(){
            wy.nt.paint(wy.nt.fn(wy.nt.ntfl.attr("data-sid")));
        });
    },
    paint: function(notifications){
        wy.nt.ntf.html("");
        wy.nt.container.html("");
        let stores = wy.sto.stores;
        stores = stores ? Object.keys(stores)
            .filter(sid => wy.me.stx[sid] === "o")
            .reduce((obj, key) => { obj[key] = stores[key]; return obj; }, {}) : {};
        stores["_"] = {i: "_", n: i18next.t("all-stores"), selected: true};
        
        wy.nt.ntf.append(wy.html("ntfs",{...stores["_"]}));
        Object.values(stores).forEach(function(store){
            if (store.i !== "_") {
                wy.nt.ntf.append(wy.html("ntfs",{...store, selected: false}));
            }
        });
        $.each(notifications, function(i, nt){
            if (!nt.y || !nt.t || !nt.m || !nt.sid) {
                console.error("Invalid notification: ", nt);
                return;
            }
            nt.at = wy.std(nt.t);
            nt.store = stores[nt.sid]?.n || ""
            let msg = i18next.t(`nt.${nt.m}`);
            if (nt.y == "t" || nt.y == "a" || nt.y == "i" || nt.y == "o") {
                nt.msg = msg.replace('{{y}}', `<span class="fw-bolder">${i18next.t(`trt.${nt.y}`)}</span>`);
            } else if (nt.y == "it") {
                nt.msg = msg.replace('{{n}}', `<span class="fw-bolder">${nt.n}</span>`);
            } else if (nt.y == "cs") {
                let cr = wy.sto.cr;
                nt.msg = msg.replace('{{v}}', `<span class="fw-bolder">${nt.v} ${cr}</span>`);
            } else if (nt.y == "iv") {
                nt.msg = msg.replace('{{n}}', `<span class="fw-bolder">${nt.n}</span>`);
            }
            let card = wy.html("snt", nt);
            wy.nt.container.append(card);
        });
    },
    go: function(id){
        let nt = wy.nt.data[id];
        if(typeof nt == "undefined") {
            wy.error(i18next.t("nt.not_found"));
            return;
        };
        if (nt.y == "iv") {
            wy.hide("nt");
            wy.show("stx");
            return;
        }
        let currentStore = wy.sid;
        if (currentStore != wy.nt.data[id].sid) {
            localStorage.setItem("go-notification", id);
            wy.sto.select(wy.nt.data[id].sid);
        }
        if (nt.y == "t" || nt.y == "a" || nt.y == "i" || nt.y == "o") {
            if (wy.tr.data.hasOwnProperty(id)) {
                let tmp = wy.tr.data[id];
                if(tmp.f) wy.nt.dismiss(id);
                else wy.hs.open(id);
                
            } else {
                wy.db.tr().doc(id).get().then(function(doc) {
                    let o = doc.data();
                    if (o) {
                        delete o.ph;
                        o.t = wy.std(o.t);
                        o.n = wy.trn(o);
                        o.id = id;
                        wy.tr.get(o).then(function(tr){
                            wy.hs.open(tr.id);
                        });
                    } else {
                        wy.nt.dismiss(id);
                    }
                })
            }
        } else if (nt.y == "it") {
            wy.it.get(id);
        } else if (nt.y == "cs") {
            wy.show("csx");
        }
        wy.hide("nt");
    },
    dismiss: function(id, event = null){
        if (event) event.stopPropagation();
        wy.api(
            {s: "dm", nid: id}, 
            function() {
                wy.success(i18next.t(`nt.dismiss-success`));
                delete wy.nt.data[id];
                wy.nt.paint(wy.nt.data);
            }, 
            "#dnb-"+id, 
            function () {
                wy.error(i18next.t(`nt.dismiss-error`));
            }
        );
    },
    filter: function(sid){
        wy.nt.ntfl.html(sid == "_" ? i18next.t("all-stores") : wy.sto.stores[sid].n).attr("data-sid", sid);
        wy.nt.paint(wy.nt.fn(sid));
    },
    fn: function(sid){
        if (sid == "_" || !sid) return wy.nt.data;
        return Object.keys(wy.nt.data)
            .filter(id => wy.nt.data[id].sid === sid)
            .reduce((acc, id) => { acc[id] = wy.nt.data[id]; return acc;}, {});
    }
};
wy.upd = {
    check: function() {
        $("#current-version").text(wy.version);
        if(!wy.isCordovaApp) {
            wy.db.rel().doc("latest").get().then(function(doc){
                if(doc.exists){
                    const r = doc.data();
                    if (r.v != wy.version) location.href = r.url;
                }
            }).catch(function(error){ console.error("Error checking for updates: ", error) });
        } else {
            wy.db.rel().doc(wy.version).get().then(function(doc){
                if(doc.exists){
                    const r = doc.data();
                    if (r.action != "none") {
                        if (r.action == "force") $("#updn").hide();
                        wy.show("upd")
                    }
                }
            }).catch(function(error){ console.error("Error checking for updates: ", error) });
        }
    },
    update: function() {
        if (wy.isCordovaApp) {
            cordova.getAppVersion.getAppName().then(function(appName) {
                cordova.getAppVersion.getPackageName().then(function(packageName) {
                    let platform = device.platform;
                    let appId = platform == "iOS" ? appName : packageName;
                    cordova.plugins.market.open(appId);
                });
            });
        } else {
            window.location.reload(true);
        }
    }
}
wy.lng = {
    selected: "en",
    elements: {
        lngc: null,
        lngs: null
    },
    init: function(){
        this.selected = wy.me.lng || "en";
        this.elements.lngc = $("#lngc");
        this.elements.lngs = $("#lngs");
        this.elements.lngc.prop("disabled", true);
        this.elements.lngs.find("#"+this.selected).addClass("ses");
        this.selected = localStorage.getItem("lng") || "en";
    },
    select: function(l){
        this.selected = l;
        this.elements.lngc.prop("disabled", false);
        this.elements.lngs.find(".se").removeClass("ses");
        this.elements.lngs.find("#"+l).addClass("ses");
    },
    save: function(){
        const lng = this.selected;
        wy.api({s:"uu", lng}, function(){
            localStorage.setItem("lng", lng);
            wy.me.lng = lng;
            wy.changeLanguage(lng);
            wy.success(i18next.t("cfg.lng_changed", {l: i18next.t("lng."+lng)}), 3000);
            wy.hide("lng");
        }, "#lngc");
    }
};
wy.sec = {
    elements: {
        loxs: null,
        loxd: null
    },
    init: function(){
        const c = wy.me.loxd != 0;
        this.elements.loxs = $("#loxs");
        this.elements.loxd = $("#loxd");
        this.elements.loxs.prop("checked", c);
        this.toggle({checked: c, d: wy.me.loxd});
    },
    toggle: function(e){
        const c = e.checked;
        this.elements.loxd.prop("disabled", !c);
        $('#sec label[for="loxs"]').text(c ? i18next.t("sec.lock_enabled") : i18next.t("sec.lock_disabled")).toggleClass("text-secondary",!e.checked);
        if (c) {
            this.elements.loxd.val(e.d || 300000).trigger("focus");
            this.elements.loxd.find("option[value='0']").attr("disabled", true);
        } else this.elements.loxd.val(0);
    },
    save: function(){
        const loxd = this.elements.loxd.val() || 0;
        wy.api({s:"uu", loxd}, function(){
            wy.me.loxd = loxd;
            wy.success(i18next.t("sec.changed"));
            wy.hide("sec");
            wy.pin.init();
        }, "#secb");
    }
};
class Transaction {
    constructor(y) {
        this.y = y;
        this.it = null;
        this.last = null;
        this.mv = {q:0,v:0};
        this.mvv = $("#mvv"+y);
        this.mvq = $("#mvq"+y);
        this.mvn = $("#mvn"+y);
        this.bs = $("#bs"+y);
        this.bsv = $("#bsv"+y);
        this.bsq = $("#bsq"+y);
        this.bss = $("#bss"+y);
        this.bsc = $("#bsc"+y);
        this.trs = $("#trs"+y);
        this.com = $("#com"+y);
        this.ix = [];
        this.max = 1000;
        this.cnt = 0;
    }
    more(l){
        let q =  wy.db.tr().where("t", "<", wy.mv.since.toDate()).where("y","==",this.y).orderBy("t", "desc").limit(l);
        if(this.last != null) q = q.startAfter(this.last);
        q.get().then(function(trs) {
            if(trs.size < 10) $("#trm"+this.y).hide();
            trs.forEach(function(doc) {
                this.last = doc;
                let tr = wy.tr.from(doc);
                this.trs.append(wy.html("tp",tr));
                wy.tr.get(tr).then(function(tr){
                    wy.tr.set(tr);
                });
            }.bind(this));
        }.bind(this));
    }
    add(q, v){
        if(this.cnt >= this.max){
            wy.error(i18next.t("trs.max_product_limit", {max: this.max}));
            return;
        }
        if(this.it == null){
            wy.error(i18next.t("product_not_found"));
            return;
        }
        let mv = {i:this.it.i,id:this.it.i,n:this.it.n,bc:this.it.b,q,v,oq:q,vu:(this.y == "o" ? this.it.p : this.it.c)};
        if(mv.q <= 0 && this.y != "a"){
            wy.error(i18next.t("quantity_invalid"));
            return;
        }
        this.cast(mv);
        this.saveDraft(mv);
    }
    cast(mv){
        this.write(this.push(mv));
        this.clear();
    }
    push(mv){
        if(mv.id in this.mv && mv.id != mv.i){
            //return
        }else if(mv.id in this.mv){
            if(this.y == "a"){
                this.mv[mv.id].v = mv.v;
                this.mv[mv.id].q = mv.q;
            }else{
                this.mv[mv.id].v += mv.v;
                this.mv[mv.id].q += mv.q;
            }
            mv = this.mv[mv.id];
        }else{
            if (this.y == "a") mv.msg = i18next.t("stock-quantity_q", {q: mv.q});
            this.mv[mv.id] = mv;
            this.ix.push(mv.id);
        }
        this.sum();
        return mv;
    }
    sum(){
        this.mv.q = 0;
        this.mv.v = 0;
        this.mv.l = 0;
        this.cnt = 0;
        $.each(this.mv, function(i,mv) {
            if(typeof mv == "object") this.mv.l++; else return;
            if(typeof mv.q == "number") this.mv.q += mv.q;
            if(typeof mv.v == "number") this.mv.v += mv.v || 0;
            this.cnt++;
        }.bind(this));
        this.bsq.html(this.mv.q);
        this.bsv.html(wy.fx(this.mv.v));
        this.able(this.mv.l != 0);
        let cq = this.y == "a" ? this.cnt : this.mv.q;
        wy.dom.cq.html(cq);
    }
    write(o){
        let mv = Object.assign({},o);
        mv.v = wy.fx(mv.v);
        let h = wy.html("mv"+this.y,mv);
        let sc = this.bs.find("#"+mv.id);
        if(sc.length) sc.replaceWith(h);
        else this.bs.append(h);
        this.able(true);
        let w = (wy.sto.role == "o" && this.it && this.it.q < mv.q) ? wy.html("mvw", {msg: i18next.t("low-stock")}) : "";
        this.bs.find("#w"+mv.id).html(w);
    }
    select(e,it){
        if(it){
            this.it = it;
            this.it.b = it.bc[0] || "";
            this.selected();
        }else if (e.which === 13) {
            let v = $(e.target).val();
            let i = wy.sto.ix[v];
            if(typeof i === "string"){
                this.it = wy.sto.it[i];
                this.it.b = v;
                this.selected();
            }
        }
    }
    selected(){
        this.mvn.typeahead("val", this.it.n || "");
        let q = this.y == "a" ? this.it.q : +this.mvq.val() > 1 ? +this.mvq.val() : 1;
        let p = this.y == "o" ? this.it.p : this.it.c;
        let v = q * p;
        if (this.y == "a") {
            v = 0;
        }
        q = isNaN(q) ? 1 : q;
        this.add(q, v);
    }
    clsv(){
        this.clear();
        this.save();
    }
    save(){
        let t = firebase.firestore.Timestamp.now();
        let tref = wy.db.tr().doc();
        let tr = {t:t,f:false,y:this.y,u:wy.auth.uid,mv:[],id:tref.id};
        tr.cm = this.com.val();
        let mvs = [];
        let bat = wy.db.bat();
        $.each(this.mv,function(i,mv){
            if(typeof mv != "object" || !this.mv.hasOwnProperty(i)) return;
            mv.tr = tref.id;
            mv.t = tr.t;
            mv.f = false;
            mv.u = tr.u;
            mv.y = tr.y;
            mv.ps = this.ix.indexOf(i);
            delete mv.vu;
            let _mv = this._mv(mv);
            if(_mv.q == 0) return;
            let ref = wy.db.mv().doc();
            tr.mv.push(ref.id);
            delete _mv.id;
            mvs.push(_mv);
            bat.set(ref,_mv);
        }.bind(this));
        if(tr.mv.length == 0){
            wy.error(i18next.t("trs.no_changes"));
            return;
        }
        this.tr = this._tr(tr);
        bat.set(tref,this.tr);
        bat.commit().catch(wy.error);
        setTimeout(this.finish,800);
        this.reset();

        tr.n = wy.trn(tr);
        tr.ph = true;
        tr.t = wy.std(tr.t);
        wy.tr.data[tr.id] = tr;

        this.clearDraft();
    }
    _mv(mv){
        return mv;
    }
    _tr(tr){
        return tr;
    }
    finish(){}
    rem(id){
        this.bs.find("#"+id).remove();
        delete this.mv[id];
        let ix = this.ix.indexOf(id);
        if (ix !== -1) this.ix.splice(ix, 1);
        this.sum();
        this.removeDraft(id);
    }
    reset(){
        this.mv = {q:0,v:0};
        this.ix = [];
        this.bs.html("");
        this.bsv.html("0");
        this.bsq.html("0");
        this.com.val("");
        this.cnt = 0;
        this.clear();
        this.able(false);
        wy.dom.cq.html("0");
        this.clearDraft();
    }
    empty(){
        if(this.bs.children().length) wy.cfm.start(i18next.t("trs.cfm_empty_basket"),this.reset.bind(this));
    }
    clear(){
        this.mvq.val("");
        this.mvv.val("0.00");
        this.mvn.trigger("focus").typeahead("val", "");
        this.it = null;
    }
    able(b){
        this.bss.prop('disabled', !b);
        this.bsc.prop('disabled', !b);
    }
    setq(e){
        let id = e.target.id.substr(1);
        let mv = this.mv[id];
        wy.qtty(e);
        let q = +e.target.value;
        if(mv.r && q > 0) q = -q;
        e.target.value = q;
        if (this.y == "a") {
            mv.v = (q - mv.oq) * mv.vu;
        } else {
            mv.v = (isNaN(mv.v) || mv.v == 0) ? mv.vu*q : (mv.v/mv.q)*q;
        }
        mv.q = q;
        this.bs.find("#v"+id).val(wy.fx(mv.v));
        this.sum();
        let w = wy.sto.it[mv.i].q < mv.q ? wy.html("mvw", {msg: i18next.t("low-stock")}) : "";
        this.bs.find("#w"+mv.id).html(w);
        if ((isNaN(e.target.value) || e.target.value <= 0 && this.y != "a")) {
            this.bsc.prop('disabled', true);
        }
    }
    setv(e){
        wy.price(e);
        let v = +e.target.value;
        let id = e.target.id.substr(1);
        let mv = this.mv[id];
        if(mv.r && v > 0) v = -v;
        mv.v = v;
        if (this.y == "a") {
            mv.vu = (mv.q - mv.oq) == 0 ? mv.vu : mv.v/(mv.q - mv.oq);
        } else {
            mv.vu = mv.v/mv.q;
        }
        this.sum();
    }
    incq(i){
        let iq = this.bs.find("#q"+i)
        iq.val(+iq.val() + 1);
        this.setq({target: {id: "q"+i, value: iq.val()}});
    }
    decq(i){
        let iq = this.bs.find("#q"+i)
        let mnq = this.y == "a" ? 0 : 1;
        if (iq.val() <= mnq) return;
        iq.val(+iq.val() - 1);
        this.setq({target: {id: "q"+i, value: iq.val()}});
    }
    key(e){
        let s = 0;
        if(e.key === 'ArrowUp' || e.keyCode === 38) s = -1;
        else if(e.key === 'ArrowDown' || e.keyCode === 40) s = 1;
        else return false;
        e.preventDefault();
        let ip = $("input");
        let ix = ip.index(e.target);
        ip[ix+s].dispatchEvent(new Event('focus'));
    }
    show(){
        this.mvn.trigger("select");
        this.init();
    }
    init(){}
    tch(i){
        let it = wy.sto.it[i];
        if(typeof it == "undefined"){
            wy.error(i18next.t("product_not_found"));
            return;
        }
        this.it = it;
        let o = {id:i,i:i,n:it.n};
        o.bc = it.bc[0] || "";
        o.q = this.y == "a" ? it.q : 1;
        o.v = this.y == "o" ? it.p : it.c;
        this.cast(o);
        let tile = $("#ti"+i);
        let y = tile.offset().top;
        let x = tile.offset().left;
        let h = tile.height();
        let w = tile.width();
        let clone = tile.clone();
        clone.offset({top:y,left:x}).css({
            "opacity": "0.8",
            "position": "absolute",
            "height": h,
            "width": w,
            "z-index": "1"
        }).appendTo("#tlc").animate({
            "top": wy.dom.cart.offset().top + (wy.dom.cart.height()/2),
            "left": wy.dom.cart.offset().left + (wy.dom.cart.width()/2),
            "width": 20,
            "height": 20
        }, function(){clone.remove()});
    }
    saveDraft(mv){
        let drafts = localStorage.getItem("drafts_"+wy.sid+"_wyzz");
        if(drafts == null) drafts = {};
        else drafts = JSON.parse(drafts);

        if(!drafts.hasOwnProperty(this.y)) drafts[this.y] = [];
        drafts[this.y].push(mv);
        localStorage.setItem("drafts_"+wy.sid+"_wyzz", JSON.stringify(drafts));
    }
    clearDraft(){
        let drafts = localStorage.getItem("drafts_"+wy.sid+"_wyzz");
        if(drafts == null) drafts = {};
        else drafts = JSON.parse(drafts);
        if(drafts.hasOwnProperty(this.y) && drafts[this.y].length > 0) {
            drafts[this.y] = [];
            localStorage.setItem("drafts_"+wy.sid+"_wyzz", JSON.stringify(drafts));
        };
    }
    removeDraft(id){
        let drafts = localStorage.getItem("drafts_"+wy.sid+"_wyzz");
        if(drafts == null) drafts = {};
        else drafts = JSON.parse(drafts);
        if(drafts.hasOwnProperty(this.y) && drafts[this.y].length > 0) {
            drafts[this.y] = drafts[this.y].filter(function(mv){
                return mv.id != id;
            });
            localStorage.setItem("drafts_"+wy.sid+"_wyzz", JSON.stringify(drafts));
        };
    }
};
wy.ad = new Transaction("a");
wy.ts = new Transaction("t");
wy.in = new Transaction("i");
wy.ou = new Transaction("o");
wy.ty = {a: wy.ad, t: wy.ts, i: wy.in, o: wy.ou};
wy.ts.init = function(){
    this.max = 60;
    wy.sx.get();
}
wy.ts._tr = function(tr){
    tr.dst = $("#dst").val();
    return tr;
}
wy.ts._mv = function(mv){
    let it = wy.sto.it[mv.i] || {ac:0};
    mv.q = -mv.q;
    mv.v = mv.q * it.ac;
    return mv;
}
wy.ad._mv = function(mv){
    let nq = $("#adx").find("#q"+mv.i).val();
    let it = wy.sto.it[mv.i] || {q:nq};
    mv.q = nq-it.q;
    return mv;
}
wy.ad.finish = function(){
    if(wy.sto.role == "o") wy.hs.open(wy.ad.tr.id);
}
wy.in.finish = function(){
    if(wy.sto.role == "o") wy.hs.open(wy.in.tr.id);
}
wy.ts.finish = function(){
    if(wy.sto.role == "o") wy.hs.open(wy.ts.tr.id);
}
wy.ss = {
    format: "DD MMM",
    from: moment().startOf("week"),
    to: moment().endOf("week"),
    init: false,
    get: function(){
        wy.ss.reset();
        let ss = wy.ss.from.format("ll");
        let es = wy.ss.to.format("ll");
        wy.ss.label = ss == es ? ss : (ss+" - " +es);
        $("#sdl").html(wy.ss.label);
        let sd = ""+Math.floor(wy.ss.from.toDate()/8.64e7);
        let ed = ""+Math.floor(wy.ss.to.toDate()/8.64e7);
        if(typeof wy.ss.uns === "function") wy.ss.uns();
        wy.ss.uns = wy.db.dy().where("__name__", ">", sd).where("__name__", "<=", ed).get().then(function(snap) {
            snap.forEach(function(doc) {
                let dl = moment(new Date(parseInt(doc.id)*8.64e7)).format(wy.ss.format);
                wy.ss.data[dl] = wy.ss.norm(doc.data());
            });
            wy.ss.draw();
        });
        wy.ss.init = true;
    },
    draw: function(){
        wy.ss.dl.forEach(function(dl){
            let o = wy.ss.data[dl];
            wy.ss.qi.push(o.qi);
            wy.ss.qo.push(o.qo);
            wy.ss.qt.push(o.qt);
            wy.ss.qa.push(o.qa);
            wy.ss.vi.push(o.vi);
            wy.ss.vo.push(o.vo);
            wy.ss.vt.push(o.vt);
            wy.ss.va.push(o.va);
            wy.ss.m.push(o.m);
        });
        let ocf = wy.ss.config();
        ocf.data.datasets = [{
            label: i18next.t("sales"),
            data: wy.ss.vo,
            borderColor: "#1982c4",
            backgroundColor: "rgba(25,130,196,0.1)",
            fill: "start"
        },
        {
            label: i18next.t("profits"),
            data: wy.ss.m,
            borderColor:"#50b432"
        }];
        if(wy.ss.och) wy.ss.och.destroy();
        wy.ss.och = new Chart(document.getElementById('och'),ocf);

        let icf = wy.ss.config("Arrivages",wy.ss.vi);
        icf.data.datasets = [{
            label: i18next.t("restocks"),
            data: wy.ss.vi,
            borderColor: "#1982c4",
            backgroundColor: "rgba(25,130,196,0.1)",
            fill: "start"
        }];
        if(wy.ss.ich) wy.ss.ich.destroy();
        wy.ss.ich = new Chart(document.getElementById('ich'),icf);

        $("#ssqi").html(wy.ss.sum.qi);
        $("#ssqo").html(wy.ss.sum.qo);
        $("#ssqt").html(wy.ss.sum.qt);
        $("#ssqa").html(wy.ss.sum.qa);
        $("#ssm").html(wy.fx(wy.ss.sum.m));
        $("#ssvi").html(wy.fx(wy.ss.sum.vi));
        $("#ssvo").html(wy.fx(wy.ss.sum.vo));
        $("#ssvt").html(wy.fx(wy.ss.sum.vt));
        $("#ssva").html(wy.fx(wy.ss.sum.va));
    },
    config: function(){
        return {
            type: 'line',
            data: {
                labels: wy.ss.dl
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        usePointStyle: true,
                        backgroundColor: '#fff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        borderColor: '#ccc',
                        borderWidth: 1
                    },
                    legend: {
                      display: false,
                    }
                }
            }
          };
    },
    reset: function(){
        wy.ss.m = [];
        wy.ss.dl = [];
        wy.ss.qi = [];
        wy.ss.qo = [];
        wy.ss.qt = [];
        wy.ss.qa = [];
        wy.ss.vi = [];
        wy.ss.vo = [];
        wy.ss.vt = [];
        wy.ss.va = [];
        wy.ss.data = {};
        wy.ss.sum = {m:0,qi:0,qo:0,qt:0,qa:0,vi:0,vo:0,vt:0,va:0};
        let day = wy.ss.from.clone();
        for(let c=0;c<90;c++){
            let dl = day.format(wy.ss.format);
            wy.ss.data[dl] = {m:0,qi:0,qo:0,qt:0,qa:0,vi:0,vo:0,vt:0,va:0};
            wy.ss.dl.push(dl);
            if(wy.ss.to.isSame(day,'day')) break;
            day.add(1, 'd');
        }
    },
    norm: function(dy){
        dy.m = isNaN(dy.m) ? 0 : dy.m;
        dy.qi = isNaN(dy.qi) ? 0 : dy.qi;
        dy.qo = isNaN(dy.qo) ? 0 : dy.qo;
        dy.qt = isNaN(dy.qt) ? 0 : dy.qt;
        dy.qa = isNaN(dy.qa) ? 0 : dy.qa;
        dy.vi = isNaN(dy.vi) ? 0 : dy.vi;
        dy.vo = isNaN(dy.vo) ? 0 : dy.vo;
        dy.vt = isNaN(dy.vt) ? 0 : dy.vt;
        dy.va = isNaN(dy.va) ? 0 : dy.va;
        wy.ss.sum.m += dy.m;
        wy.ss.sum.qi += dy.qi;
        wy.ss.sum.qo += dy.qo;
        wy.ss.sum.qt += dy.qt;
        wy.ss.sum.qa += dy.qa;
        wy.ss.sum.vi += dy.vi;
        wy.ss.sum.vo += dy.vo;
        wy.ss.sum.vt += dy.vt;
        wy.ss.sum.va += dy.va;
        return dy;
    }
};
wy.cs = {
    indexData: new Map(),
    end: false,
    last: null,
    ps: 5,
    sk: "t",
    so: 1,
    format: "DD MMM",
    t: moment().endOf("day"),
    css: $("#css"),
    m: false,
    get: function(){
        wy.cs.updateDp();
        wy.cs.end = false;
        wy.cs.next();
        wy.db.mv().where("f", "==", false).where("y","==","o").limit(1).get().then(function(mvs) {
            let b = mvs.size > 0;
            $("#csm").toggle(b);
            $("#crb").prop("disabled",b);
        });
    },
    next: function(){
        if(wy.cs.end) return;
        let p = {s:"gc",ps:wy.cs.ps,t:wy.cs.t.format("YYYY-MM-DD hh:mm:ss")};
        if(wy.cs.last != null) p.last = wy.cs.last.id;
        wy.api(p,function(rs){
            try {
                let s = rs.sto;
                let rv = s.rv || 0;
                let v = s.vo - rv;
                let t = wy.std(s.rd || s.t);
                $("#cst").html(t);
                $("#csv").val(wy.fx(v));
                wy.cs.end = rs?.docs?.length < wy.cs.ps;
                if(!(rs.docs || rs.docs.length > 0)) return;
                for (const doc of rs.docs) {
                    wy.cs.indexData.set(doc.id, doc);
                    wy.cs.last = doc;
                }
                wy.cs.paint();
            } catch (e) {
                console.error(e);
            }
        });
    },
    mv: function(cs){
        wy.show("cmm");
        $("#cmc").html("");
        wy.db.mv().where("cs", "==", cs).orderBy("t","desc").get().then(function(snap) {
            snap.forEach(function(doc) {
                let mv = doc.data();
                mv.id = doc.id;
                mv.t = wy.std(mv.t);
                $("#cmc").append(wy.html("cmv",mv));
            });
        }).catch(wy.error);
    },
    reset: function(){
        let th = +$("#csv").val();
        let rl = +$("#csrl").val();
        if(isNaN(rl) || rl < 0) return;
        wy.api({s:"rc",th:th,rl:rl},function(r){
            if (!wy.cs.css.is(":visible")) wy.cs.css.show();
            wy.cs.update(r);
            $("#cst").html(wy.std(r.t));
            $("#csv").val("0");
            $("#csrl").val("0");
            wy.tr.reset();
            wy.hs.get();
        },"#crb");
    },
    edit: function(i, e){
        if (e) e.stopPropagation();
        let doc = wy.cs.indexData.get(i);
        if (!doc) {
            wy.error(i18next.t("csx.not_found"));
            return;
        }
        $("#csuid").val(doc.id);
        $("#csurd").html(wy.std(doc.rd));
        $("#csut").html(wy.std(doc.t));
        $("#csucv").val(wy.fx(doc.cv));
        $("#csudf").val(wy.fx(doc.df)).removeClass("text-success text-danger").addClass("text-"+doc.ec);
        $("#csurl").val(wy.fx(doc.rl)).trigger("focus").on("input", function(){
            const rl = +$(this).val();
            if(isNaN(rl) || rl < 0) return;
            const df = rl - doc.cv
            $("#csudf").val(wy.fx(df)).removeClass("text-success text-danger").addClass(df == 0 ? "" : (df > 0 ? "text-success" : "text-danger"));
        });
        wy.show("csu");
    },
    save: function(){
        const id = $("#csuid").val();
        const rl = +$("#csurl").val();
        if(isNaN(rl) || rl < 0) return;
        wy.api({s:"ec",id,rl},function(r){
            let cs = wy.cs.indexData.get(id);
            cs = {...cs,rl,df:rl-cs.cv}
            wy.cs.indexData.set(id,cs)
            wy.cs.update(cs);
            wy.success(i18next.t("csx.change_saved"));
            wy.hide("csu");
        },"#csus", function(){
            wy.error(i18next.t("csx.error_on_save"));
        });
    },
    sort: function(e){
        let k = $(e).attr("data-key");
        if(k == wy.cs.sk) wy.cs.so = -wy.cs.so;
        else {
            wy.cs.sk = k;
            wy.cs.so = 1;
        }
        $("#cstb").find(".arrow").remove();
        const up = wy.cs.so == 1 ? "" : "up";
        $(e).append("<span class='arrow "+up+"'></span>");
        wy.cs.paint();
    },
    sortData: function(k, o){
        const idx = wy.cs.indexData;
        const sortedIndexes = [...idx.keys()].sort((a, b) => {
            const aVal = idx.get(a)[k];
            const bVal = idx.get(b)[k];
            return (aVal < bVal ? -1 : (aVal > bVal ? 1 : 0)) * o;
        });
        return sortedIndexes.map(i => idx.get(i));
    },
    paint: function(){
        let data = Array.from(wy.cs.indexData.values());
        if (data.length == 0) $("#cstbt").empty();
        else {
            data = wy.cs.sortData(wy.cs.sk, wy.cs.so);
            wy.cs.css.show();
            for (const doc of data) wy.cs.update(doc);
            if (!wy.cs.end) wy.cs.observer();
            if (wy.cs.m) {
                const scrollContainer = $("#csw");
                scrollContainer.animate({
                    scrollTop: scrollContainer.scrollTop() + 100
                }, 500);
            }
        }
    },
    update: function(cs){
        cs.ec = cs.df === 0 ? "" : (cs.df > 0 ? "success" : "danger");
        let rw = $("#"+cs.id);
        let csrow = wy.html("cs",{...cs,t:wy.std(cs.t),rd:wy.std(cs.rd),cv:wy.fx(cs.cv),rl:wy.fx(cs.rl),df:wy.fx(cs.df)});
        if(rw.length) rw.replaceWith(csrow);
        else $("#cstbt").prepend(csrow);
    },
    updateDp: function(){
        wy.cs.label = wy.cs.t.format("ll");
        $("#csdp").html(wy.cs.label);
    },
    more: function(){
        wy.cs.m = true;
        if (!wy.cs.end) {
            wy.cs.next();
        }
    },
    observer: function(){
        let visibilityTimeout;
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    visibilityTimeout = setTimeout(() => {
                        wy.cs.more();
                        observer.unobserve(entry.target);
                    }, 500);
                } else {
                    clearTimeout(visibilityTimeout);
                }
            });
        }, { root: null, rootMargin: '0px', threshold: 1.0 });
        const ltr = document.querySelector('#csb');
        if (ltr) observer.observe(ltr);
    }
};
wy.sx = {
    data:null,
    get:function(b){
        if(b) this.data = null;
        if(this.data != null) wy.sx.dst();
        else wy.api({s:"sx"},function(r){
            wy.sx.data = r.sx;
            wy.sx.dst();
        });
    },
    dst:function(){
        $("#dst").html("");
        for(let s in wy.sx.data){
            if(s != wy.sid) $("#dst").append(wy.html("opt",{v:s,n:wy.sx.data[s]}));
        }
    },
    hs:function(tr){
        if(this.data != null) wy.sx._hs(tr);
        else wy.api({s:"sx"},function(r){
            wy.sx.data = r.sx;
            wy.sx._hs(tr);
        });
    },
    _hs:function(tr){
        let o = wy.sx.sd(tr);
        if(tr.f){
            $("#hss").val(o.s);
            $("#hsd").val(o.d);
        }else{
            $("#vls").val(o.s);
            $("#vld").val(o.d);
        }
    },
    sd:function(tr){
        let o = {s:"--",d:"--"};
        if(tr.hasOwnProperty("sst")){
            o.s = wy.sx.data[tr.sst];
            o.d = wy.sto.sn;
        }else if(tr.hasOwnProperty("dst")){
            o.s = wy.sto.sn;
            o.d = wy.sx.data[tr.dst];
        }
        return o;
    }
}
wy.xls = {
    i: 0,
    read: function(e) {
        let files = e.target.files;
        let reader = new FileReader();
        reader.onload = function(e) {
            let data = new Uint8Array(e.target.result);
            let w = XLSX.read(data, {type: 'array'});
            let sheet = w.Sheets[w.SheetNames[0]];
            let ref = sheet["!ref"];
            let x = ref.indexOf(":");
            let size = +ref.substr(x+1).replace(/[^0-9]/g, '');
            let row = wy.xls.row(sheet,1);
            if(isNaN(+row.c) || isNaN(+row.p) || isNaN(+row.q));
            else $("#xlr").append(wy.html("iir",row));
            for(let i=2;i<=size;i++){
                row  = wy.xls.row(sheet,i);
                $("#xlr").append(wy.html("iir",row));
            }
        };
        reader.readAsArrayBuffer(files[0]);
        wy.enable("#ixb");
    },
    row: function(sheet,i){
        let row  = {r:wy.xls.i++};
        row.n = sheet["A"+i] ? sheet["A"+i].v : "";
        row.t = sheet["B"+i] ? sheet["B"+i].v : "";
        row.c = sheet["C"+i] ? sheet["C"+i].v : "";
        row.p = sheet["D"+i] ? sheet["D"+i].v : "";
        row.q = sheet["E"+i] ? sheet["E"+i].v : "";
        row.b = sheet["F"+i] ? sheet["F"+i].v : "";
        return row;
    },
    add: function(){
        $("#xlr").append(wy.html("iir",{r:wy.xls.i++,n:"",t:"",c:"",p:"",q:"",b:""}));
        let xlt = $("#xlt");
        xlt.scrollTop(xlt.prop("scrollHeight"));
        wy.enable("#ixb");
    },
    rem: function(r){
        $("#xlr").find("#R"+r).remove();
    },
    reset: function(){
        $("#xlr").html("");
        wy.xls.i = 0;
        let xlf = document.getElementById('xlf');
        xlf.value= null;
        xlf.type = "text";
        xlf.type = "file";
        wy.disable("#ixb");
    },
    clear: function(){
        if($("#xlr").find("tr").length)
            wy.cfm.start(i18next.t("xlx.cfm_del_table_contents"),wy.xls.reset);
    },
    save: function(){
        let rows = [];
        $("#xlr").find("tr").each(function(x){
            let r = $(this).attr("data-row");
            let row = {
                n: $("#A"+r).val(),
                t: $("#B"+r).val(),
                c: $("#C"+r).val(),
                p: $("#D"+r).val(),
                q: $("#E"+r).val(),
                b: $("#F"+r).val()
            };
            rows.push(row);
        });
        wy.api({s:"ii", data:JSON.stringify(rows)},function(rs){
            wy.success(i18next.t("xlx.import_success"));
            wy.xls.reset();
            wy.hide("xlx");
            wy.ct.get();
            setTimeout(function(){
                wy.hs.open(rs.tr);
            },1500);
        },"#ixb");
    }
};
wy.pin = {
    d: 600000, 
    ps: [],
    pin: [],
    lock: false,
    chmod: false,
    loxtimer: null,
    pintimer: null,
    elements: {
        header: null,
        cancel: null,
        forgot: null,
        loxerr: null,
        title: null,
        icon: null
    },
    init: function() {
        this.elements.header = $("#lox-header");
        this.elements.cancel = $("#lox-cancel");
        this.elements.forgot = $("#lox-forgot");
        this.elements.loxerr = $("#loxerr");
        this.elements.icon = $("#lox-icon");
        this.elements.title = $("#pit");
        this.cl();

        if (wy.me?.loxd == 0) {
            $("#lox-btn").hide();
            return;
        }
        this.d = wy.me?.loxd || (wy.sto.role === "s" ? 600000 : 60000);
        this.se();

        if(localStorage.getItem("lox") == "true") this.sh(true);
        else this.hi();
    },
    se: function() {
        this.rt();
        document.onmousemove = this.rt.bind(this);
        document.onkeydown = this.rt.bind(this);
    },
    rt: function() {
        clearTimeout(this.loxtimer);
        this.loxtimer = setTimeout(()=>wy.pin.sh(true), this.d);
    },
    sh: function(lock=false) {
        this.lock = lock;
        this.elements.header.html(lock ? i18next.t('lox.lock') : i18next.t('lox.title'));
        this.modDoc(lock);
        this.flip(lock);
        if (lock) {
            this.tt(i18next.t('lox.enter'));
            localStorage.setItem("lox", "true");
        } else {
            clearTimeout(this.pintimer);
            this.pintimer = setTimeout(() => {
                this.cc();
                wy.error(i18next.t('lox.timeout'));
            }, this.d/2);
        }
        wy.show("lox")
        $(document).off("keyup").on("keyup", (e) => {
            if (e.key >= 0 && e.key <= 9) this.di(e.key);
            else if (e.key === "Backspace") this.bk();
            else if (e.key === "Delete") this.cl();
        });
    },
    hi: function() {
        if (this.lock) this.modDoc(false);
        clearTimeout(this.pintimer);
        $(document).off("keyup");
        wy.hide("lox");
        this.cl();
    },
    tt: function(text) {
        this.elements.title.html(text);
    },
    st: function(d,s,b,e) {
        this.ps.push({d:d,s:s,b:b,e:e});
        if(this.wyt) {
            this.go();
        } else {
            this.tt(i18next.t('lox.action-requires'));
            this.elements.forgot.show();
            this.sh();
        }
    },
    gt: function(pin) {
        wy._api({s: "gt", pin: pin}, (r) => {
            this.wyt = r.token;
            setTimeout(() => { delete this.wyt; }, 300000);
            localStorage.setItem("lox", "false");
            this.go();
            this.init();
        }, ".numpad", () => {
            this.cl();
            this.elements.loxerr.html(i18next.t('lox.invalid')).show();
        });
    },
    go: function() {
        let p = this.ps.pop();
        while(p != null) {
            p.d.wyt = this.wyt;
            wy._api(p.d,p.s,p.b,p.e);
            p = this.ps.pop();
        }
        this.cc();
    },
    cc: function() {
        this.ps = [];
        this.chmod = false;
        delete this.chpin;
        this.cl();
        if (this.lock) return;
        this.hi();
    },
    di: function(d) {
        this.pin.push(d);
        $("#pin-" + this.pin.length).removeClass("mdi-circle-outline").addClass("mdi-circle");
        if (this.pin.length === 4) {
            let pin = this.pin.join("");
            if (this.chmod) this.dc(pin);
            else this.gt(pin);
        }
    },
    bk: function() {
        $("#pin-" + this.pin.length).removeClass("mdi-circle").addClass("mdi-circle-outline");
        this.pin.pop();
    },
    cl: function() {
        this.pin = [];
        $('[id^="pin-"]').removeClass('mdi-circle').addClass('mdi-circle-outline');
        this.elements.loxerr.empty();
    },
    cg: function() {
        this.tt(i18next.t('lox.enter-pin'));
        this.elements.forgot.hide();
        this.chmod = true;
        this.sh();
    },
    dc: function(pin) {
        if(!wy.pin.hasOwnProperty("chpin")) {
            this.chpin = pin;
            this.tt(i18next.t('lox.re-enter-pin'));
            this.cl();
        } else if(pin === this.chpin) {
            this.ps = [];
            this.cl();
            this.chmod = false;
            delete this.chpin;
            wy.api({s: "pi", pin: pin}, () => {
                wy.success("PIN sauvegardé");
                delete this.wyt;
                this.cc();
            });
        } else {
            wy.error(i18next.t('lox.mismatch'));
            this.cc();
        }
    },
    flip: function(lock) {
        this.elements.cancel.toggle(!lock);
        this.elements.forgot.toggle(lock);
        this.elements.icon.toggle(lock);
    },
    modDoc: function(lock) {
        document.oncontextmenu = () => !lock;
        window.onpopstate = lock ? () => {void 0;} : function(){
            history.pushState(null, document.title, location.href);
            if(wy.mo.length > 0) wy.hide(wy.mo[0].id);
        };
    },
    forgot: function() {
        wy.cfm.start(i18next.t('lox.cfm_sent_pin'), () => wy.api({s: "sp"}, () => wy.success(i18next.t('lox.pin_sent'))));
    }
};
wy.cfm = {
    start: function(txt,cfm,ccl){
        $("#cfmtxt").html(txt);
        wy.cfm.cfm = cfm;
        wy.cfm.ccl = ccl;
        wy.show("cfm");
    },
    confirm: function(){
        if(typeof wy.cfm.cfm == "function") wy.cfm.cfm();
    },
    cancel: function(){
        if(typeof wy.cfm.ccl == "function") wy.cfm.ccl();
    }
};
//___________________________________________________________________________________________________________________________________________________
wy.acl = ['ii','ui','di','dc','ds','dr','us','pi','cv','ti','ta','tt','rc','ec'];
wy.api = function (d,s,b,e) {
    if(wy.acl.includes(d.s)) wy.pin.st(d,s,b,e);
    else wy._api(d,s,b,e);
};
wy._api = function(d,s,b,e){
    d.sid = wy.sid;
    d.jwt = wy.token;
    let o = wy.disable(b);
    jQuery.ajax({
        url: wy.back,
        data: d,
        dataType: "JSON",
        type: "POST",
        crossDomain: true,
        xhrFields: {withCredentials: true},
        beforeSend: wy.pss.show
    }).done(function(r,t,x) {
        //data, textStatus, jqXHR
        if(r && r.status == "success"){
            if( typeof s == "function") s(r);
        }else if (r && r.message) wy.error(r.message);
        else wy.success(t);
    }).fail(function(x,t,r) {
        // jqXHR, textStatus, errorThrown
        if(typeof e == "function") e();
        if (x.status == 200){if( typeof s == "function") s(r);}
        else if (x.status == 0)  wy.error(wy.labels.no_connection);
        else if (x.status == 401)  wy.usr.in();
        else if (x.responseJSON)  wy.error(x.responseJSON.message);
        else wy.error(x.responseText);
    }).always(function(){
        wy.enable(o);
        wy.pss.hide();
    });
}
wy.pss = {
    show: function () {
        $("#loader").show();
        wy.pss.to = setTimeout(wy.pss.hide,5000);
    },
    hide: function () {
        clearTimeout(wy.pss.to);
        if(jQuery.active == 0) $("#loader").hide();
        else wy.pss.to = setTimeout(wy.pss.hide,1000);
    }
};
wy.error = function (m) {
    wy.msg(m,"danger");
}
wy.success = function(m){
    wy.msg(m,"success");
}
wy.warning = function(m){
    wy.msg(m,"warning");
}
wy.info = function(m){
    wy.msg(m,"info");
}
wy.msg = function (m,t) {
    let i = ""+new Date().getTime();
    $("#msg").append(wy.html("alert",{i:i,t:t,m,m}));
    setTimeout(function(){$("#"+i).remove();},15000);
}
wy.std = function(t){
    let d;
    if(t){
        if(t.hasOwnProperty("seconds")){
            d = new Date(0);
            d.setUTCSeconds(t.seconds);
        }else d = new Date(t);
    }else d = new Date();
    return ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + (""+d.getFullYear()).slice(-2) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}
wy.modal = function(id){
    return bootstrap.Modal.getInstance(document.getElementById(id)) || new bootstrap.Modal(document.getElementById(id));
}
wy.toggle = function(id){
    wy.modal(id).toggle();
}
wy.show = function(id){
    wy.modal(id).show();
}
wy.hide = function(id){
    wy.modal(id).hide();
}
wy.html = function(i,o){
    let h = $("#"+i).html();
    for (let p in o) {
        if (!o.hasOwnProperty(p)) continue;
        let v = o[p];
        if(p == "v" && typeof v == "number") v = wy.fx(v);
        h = h.replace(new RegExp("%"+p+"%","g"),v);
    }
    return h;
}
wy.matcher = function(){
    return function findMatches(q, cb) {
        let matches = [];
        let regex = new RegExp(q, "i");
        $.each(wy.sto.it, function(id, it) {
            if (regex.test(it.pa)) matches.push(it);
        });
        cb(matches);
    };
};
wy.price = function(e) {
    let v = +e.target.value.replace(/\D/g, '')/100;
    e.target.value = v.toFixed(2);
}
wy.qtty = function(e){
    e.target.value = e.target.value.replace(/[^0-9\-]/g, '');
};
wy.digit = function(e){
    e.target.value = e.target.value.replace(/[^0-9,]/g, '');
};
wy.disable = function(i){
    let o = {};
    if(i){
        $(i).attr("disabled", true);
        o.i = i;
        o.c = setTimeout(function(){wy.enable(o)}, 9000);
    }
    return o;
}
wy.enable = function(o){
    if(o && o.i) $(o.i).removeAttr("disabled");
    else if(typeof o == "string" ) $(o).removeAttr("disabled");
    if(o && o.c) clearTimeout(o.c);
}
wy.abs = function(v){
    return Math.abs(v);
}
wy.neg = function(v){
    return isNaN(v) ? 0 : (v < 0) ? v : -v;
}
wy.fx = function(n){
    return isNaN(n) ? "-" : Number(n).toFixed(2);
}
wy.icon = function(mv){
    return mv.pw ? "alarm-check" : mv.r ? "undo text-primary" : mv.cc ? "check-all text-primary" : mv.f ? "check text-primary" : "progress-check";
}
wy.reload = function(){
    window.location.reload(true);
}
wy.rcl = function(){
    //hsl(rand,25%,90%)
    const h = Math.floor(Math.random()*360);
    const s = 0.25;
    const l = 0.9;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
wy.up = {
    url: wy.back+"/upload",
    data: null,
    cfg:{
        name: "pim",
        limit: 1,
        expect: "json",
        maxFileSize: 10500000,
        start: function(file){
            $("#upro").css("width","0");
            wy.show("upb");
            $("#upro").html(file.name).css("width","1%");
        },
        progress: function(progress){
            wy.up.progress(progress);
        },
        success: function(data){
            wy.up.success(data);
        },
        error: function(error){
            wy.hide("upb");
            if(error && error.xhr) wy.error(error.xhr);
            else if(error && error.message) wy.error(error.message);
            else wy.error("Upload Error");
        },
        xhrFields: {withCredentials: true}
    },
    progress:function(progress){
        if(isNaN(progress)) return;
        if(progress > 100) progress = 100;
        $("#upro").css("width",progress+"%");
    },
    success:function(data){
        wy.up.progress(100);
        wy.it.img(wy.imst+data.img);
        wy.hide("upb");
    },
    delete:function(){
        wy.api({s:"dp",it:wy.it.i},function(r){
            wy.it.img("/img/1x1.png");
        });
    },
    choose:function(){
        if (wy.isCordovaApp) wy.show("up");
        else $("#pim").trigger("click");
    },
    take: function() {
        if (wy.isCordovaApp && typeof navigator.camera !== 'undefined')
            navigator.camera.getPicture(wy.up.onSuccessUpload, wy.up.onFailUpload, {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA
            });
        else wy.up.onFailUpload(i18next.t('up.camera_unavailable'));
    },
    select: function() {
        if (wy.isCordovaApp && typeof navigator.camera !== 'undefined')
            navigator.camera.getPicture(wy.up.onSuccessUpload, wy.up.onFailUpload, {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY
            });
        else wy.up.onFailUpload(i18next.t('up.gallery_unavailable'));
    },
    onSuccessUpload: function(imageData) {
        const pim = $("#pim");
        const byteArray = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const file = new File([blob], `${wy.it.i}.jpg`, { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        pim[0].files = dataTransfer.files;
        pim.trigger('change');
        wy.hide("up");
    },
    onFailUpload: function(message) {
        wy.hide("up");
        wy.error(message);
    },
    confirm: function(){
        if (wy.up.cropper) {
            const canvas = wy.up.cropper.getCroppedCanvas({
                width: 300,
                height: 300
            });
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const iim = $('#iim');
                iim.attr('src', url);
                iim.css('width', '300px');
                iim.css('height', '300px');
                wy.up.cancel();

                const pim = $("#pim");
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([blob], `${wy.it.i}.jpg`, { type: 'image/jpeg' }));
                pim[0].files = dataTransfer.files;
                wy.up.cfg.data = {s:"up",sid:wy.sid,jwt:wy.token,it:wy.it.i};
                pim.simpleUpload(wy.up.url, wy.up.cfg);
            });
        }
    },
    cancel: function(){
        if (wy.up.cropper) {
            wy.up.cropper.destroy();
            wy.up.cropper = null;
        }
        $("#pim").val("");
        wy.hide("crop");
    }
}
wy.rim = function(img){
    img.retries = img.retries || 0;
    if(img.retries > 5) return;
    setTimeout(function(){
        this.src = this.getAttribute("data-src");
        this.retries += 1;
    }.bind(img), 2500);
}

wy.mo = [];
wy.clock = function(){
    $('.live-clock').html(moment().format('MM-DD-YY HH:mm'));
}
wy.select = function(e){
    $(e.target).trigger("select");
};
wy.hot = {
    ix: true,
    keys: ["0","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"],
    main: function(e) {
        let id = (e.keyCode > 64 && e.keyCode < 91) ? ("tx"+e.key).toLowerCase() : (e.keyCode > 47 && e.keyCode < 58) ? "tx0" : "";
        let el = document.getElementById(id);
        if(el) el.scrollIntoView();
    },
    inx: function(e) {
        if (e.ctrlKey && e.key === 's') {
            wy.in.save();
            return false;
        }
    },
    oux: function(e) {
        if (e.ctrlKey && e.key === 's') {
            wy.ou.save();
            return false;
        }
    },
    tsx: function(e) {
        if (e.ctrlKey && e.key === 's') {
            wy.ts.save();
            return false;
        }
    },
    adx: function(e) {
        if (e.ctrlKey && e.key === 's') {
            wy.ad.save();
            return false;
        }
    }
}

wy.update = function(n,v){
    $("[data-i18n='"+n+"']").text(v);
    $("[data-i18n-value='"+n+"']").val(v);
    $("[data-i18n-placeholder='"+n+"']").attr("placeholder",v);
}
wy.val = function(i,v){
    $("#"+i).val(v);
}
wy.hex = function(i,v){
    let e = $("#"+i);
    let c = v || e.val();
    c = "#"+c.replace(/[^0-9A-F]/gi,"").substring(0,6);
    e.css("background-color",c).val(c).attr("data-color",c);
}
wy.translate = function(lng="fr"){
    if (wy.supportedLanguages.indexOf(lng) === -1) lng = "fr";
    i18next
        .use(i18nextChainedBackend)
        .init({
            lng: lng,
            fallbackLng: 'en',
            pluralSeparator: '_',
            load: 'languageOnly',
            backend: {
                backends: [
                    i18nextLocalStorageBackend,
                    i18nextHttpBackend
                ],
                backednOptions: [{
                    loadPath: '/locales/{{lng}}/{{ns}}.json'
                }]
            },
            detection: {
                order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
                caches: ['localStorage', 'cookie']
            },
        }, function(err, t) {
            wy.updateContent();
        });
}
wy.trn = function(tr){
    return typeof tr == 'string' ? i18next.t(`trt.${tr}`) : typeof tr == 'object' ? i18next.t(`trt.${tr.y}`) : i18next.t(`trt._`);
}
wy.trc = function(tr){
    return tr.hasOwnProperty("cm") ? tr.cm : tr.hasOwnProperty("nt") ? tr.nt : "";
}
wy.updateContent = function() {
    $('[data-i18n]').each(function(i,e) { 
        const data = e.getAttribute("data-i18n");
        const optionsAttr = e.getAttribute('data-i18n-options');
        const options = optionsAttr ? JSON.parse(optionsAttr) : {};
        if (data.startsWith("!")) e.innerHTML = i18next.t(data.substring(1), options);
        else e.textContent = i18next.t(data, options);
    });
    $('[data-i18n-placeholder]').each(function(i,e) { e.setAttribute("placeholder", i18next.t(e.getAttribute("data-i18n-placeholder"))); });
    $('[data-i18n-value]').each(function(i,e) { e.value = i18next.t(e.getAttribute("data-i18n-value")); });

    wy.update("brand",wy.sto.sn);
    wy.update("cur",wy.sto.cr);    
}
wy.changeLanguage = function(lng) {
    i18next.changeLanguage(lng, () => {
        wy.updateContent();
    });
}
//___________________________________________________________________________________________________________________________________________________

wy.init = {
    initMobile: function(){
        cordova.getAppVersion.getVersionNumber().then(function (version) {
            wy.version = version;
            wy.init.initWyzz();
        });
        cordova.plugins.firebase.messaging.requestPermission({forceShow: true}).then(function(){
            cordova.plugins.firebase.messaging.getToken().then(function(token){wy.nt.token = token;});
        });
        cordova.plugins.firebase.messaging.onBackgroundMessage(function(payload){wy.nt.go(payload.id)});
        cordova.plugins.firebase.messaging.onTokenRefresh(function(token){wy.nt.token = token;});
    },
    initWeb: function(){
        wy.init.initWyzz();
    },
    initWyzz: function(){
        const lng = localStorage.getItem("lng") || "fr";
        wy.translate(lng || "fr");
        wy.upd.check();
        wy.cart = $("#cart");
        let today = moment().format("MM/DD/YYYY");
        let hdp = {
            singleDatePicker: true,
            showDropdowns: true,
            autoApply: true,
            minDate: "01/01/2020",
            startDate: today,
            maxDate: today
        };
        $("#hdp").daterangepicker(hdp, function(start, end) {
            wy.hs.to = start.endOf("day");
            wy.hs.get();
        });
        let sdp = {
            showDropdowns: true,
            autoApply: true,
            minDate: "01/01/2020",
            startDate: today,
            endDate: today,
            maxDate: today
        };
        $("#sdp").daterangepicker(sdp, function(start, end) {
            wy.ss.from = start.startOf("day");
            wy.ss.to = end.endOf("day");
            wy.ss.get();
        });
        let csp = {
            singleDatePicker: true,
            showDropdowns: true,
            autoApply: true,
            minDate: "01/01/2020",
            startDate: today,
            endDate: today,
            maxDate: today
        }
        $("#csp").daterangepicker(csp, function(start, end) {
            wy.cs.t = start.startOf("day");
            wy.cs.indexData.clear();
            wy.cs.last = null;
            wy.cs.get();
        });
    
        $('#pim').on("change", function(event) {
            const input = event.target;
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    let data = e.target.result;
                    if (!data.startsWith("data:image")) data = "data:image/jpeg;base64," + data;
                    const img = document.getElementById('crop-img');
                    img.src = data;
                    img.style.width = "300px";
                    img.style.height = "300px";
                    const w = document.body.offsetWidth;
                    const h = document.body.offsetHeight - 200;
                    
                    if (wy.up.cropper) wy.up.cropper.destroy();
                    wy.up.cropper = new Cropper(img, {
                        aspectRatio: 1,
                        viewMode: 1,
                        autoCropArea: 1,
                        responsive: true,
                        center: true,
                        guides: true,
                        highlight: true,
                        background: true,
                        movable: true,
                        zoomable: true,
                        rotatable: true,
                        scalable: true,
                        minCropBoxWidth: 300,
                        minCropBoxHeight: 300,
                        minCanvasHeight: h - 100,
                        minCanvasWidth: w - 100,
                        minContainerWidth: w,
                        minContainerHeight: h
                    });
                    wy.show("crop");
                };
                reader.readAsDataURL(input.files[0]);
            }
        });
     
        const typeaheadOptions = {hint: true,highlight: true,minLength: 1};
        const typeaheadDatasets = {name:"tr",source: wy.matcher(),display: "n",limit: 10,templates: {empty: `<p class="text-center my-2" data-i18n="npfm">${i18next.t('npfm', 'NO PRODUCTS')}</p>`}};
        $("#mvno").on("typeahead:select",wy.ou.select.bind(wy.ou)).on("typeahead:autocomplete",wy.ou.select.bind(wy.ou)).on("keypress",wy.ou.select.bind(wy.ou)).typeahead(typeaheadOptions,typeaheadDatasets);
        $("#mvni").on("typeahead:select",wy.in.select.bind(wy.in)).on("typeahead:autocomplete",wy.in.select.bind(wy.in)).on("keypress",wy.in.select.bind(wy.in)).typeahead(typeaheadOptions,typeaheadDatasets);
        $("#mvnt").on("typeahead:select",wy.ts.select.bind(wy.ts)).on("typeahead:autocomplete",wy.ts.select.bind(wy.ts)).on("keypress",wy.ts.select.bind(wy.ts)).typeahead(typeaheadOptions,typeaheadDatasets);
        $("#mvna").on("typeahead:select",wy.ad.select.bind(wy.ad)).on("typeahead:autocomplete",wy.ad.select.bind(wy.ad)).on("keypress",wy.ad.select.bind(wy.ad)).typeahead(typeaheadOptions,typeaheadDatasets);
        
        $("#itchi").on("input",function(){
            clearTimeout(wy.it.stout);
            wy.it.stout = setTimeout(wy.it.query,800);
        });
        $("#tichi").on("input",function(){
            clearTimeout(wy.ti.stout);
            wy.ti.stout = setTimeout(wy.ti.query,800);
        });
    
        $("#hsw").on("scroll",wy.hs.scroll);
        $(".bsi").on("click", function(){$(this).trigger("select")});
        $("#sx").on("show.bs.modal",wy.sto.get);
        $("#rx").on("show.bs.modal",wy.rol.show);
        $("#stx").on("show.bs.modal",wy.sto.stx);
        $("#nix").on("shown.bs.modal",wy.it.code);
        $("#csx").on("show.bs.modal",wy.cs.get).on("hide.bs.modal",wy.cs.uns);
        $("#hsx").on("show.bs.modal",function(){if(!wy.hs.init) wy.hs.get()});
        $("#ssx").on("show.bs.modal",function(){if(!wy.ss.init) wy.ss.get()});
        $("#nsx").on("shown.bs.modal",wy.sto.nsx);
        $("#main").on("keyup",wy.hot.main).on("scroll",wy.sto.scroll);
        $("#inx").on("shown.bs.modal",function(){wy.in.show()}).on("keydown",wy.hot.inx);
        $("#oux").on("shown.bs.modal",function(){wy.ou.show()}).on("keydown",wy.hot.oux);
        $("#tsx").on("shown.bs.modal",function(){wy.ts.show()}).on("keydown",wy.hot.tsx);
        $("#adx").on("shown.bs.modal",function(){wy.ad.show()}).on("keydown",wy.hot.adx);
        $("#lng").on("show.bs.modal",function(){wy.lng.init()});
        $("#sec").on("show.bs.modal",function(){wy.sec.init()});
    
        var highestZIndex = 1050;
        $("body").on("shown.bs.modal",function(e){
            wy.mo.unshift(e.target);
            highestZIndex += 2;
            $('.modal-backdrop').last().css('z-index', highestZIndex - 1).addClass('modal-stack');
            $(e.target).css("z-index",highestZIndex);
        }).on("hidden.bs.modal",function(e){
            const ix = wy.mo.indexOf(e.target);
            if (ix > -1) wy.mo.splice(ix, 1);
            highestZIndex -= 2;
            if ($('.modal:visible').length > 0) {
                $('.modal-backdrop').last().css('z-index', parseInt($('.modal:visible').last().css('z-index')) - 1);
            } else {
                $('.modal-backdrop').remove();
            }
        });
        history.pushState(null, document.title, location.href);
        window.onpopstate = function(){
            history.pushState(null, document.title, location.href);
            if(wy.mo.length > 0) wy.hide(wy.mo[0].id);
        };
        
        document.getElementById('iim').addEventListener("error", function () {
            if(this.retries > 5) return;
            setTimeout(function(){
                this.src = this.getAttribute("data-src");
                this.retries += 1;
            }.bind(this), 3000);
        });
        let tom = 60000 - (new Date().getTime() % 60000);
        setTimeout(function() {
            setInterval(wy.clock, 60000);
            wy.clock();
        }, tom);
    
        let notification = localStorage.getItem("go-notification");
        if (notification) {
            if (wy.nt.data.length > 0 && wy.nt.data[notification]) {
                wy.nt.go(notification);
    
            } else {
                const observer = new MutationObserver(function(mutations) {
                    let timeout;
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            clearTimeout(timeout);
                            timeout = setTimeout(function() {
                                wy.nt.go(notification);
                                observer.disconnect();
                            }, 200);
                        }
                    });
                });
                observer.observe(wy.nt.nb.get(0), {
                    childList: true,
                    subtree: true
                });
            }
            localStorage.removeItem("go-notification");
        }
    }
}

document.addEventListener("deviceready", function(){
    wy.isCordovaApp = true;
    if (window.cordova.platformId !== "browser") wy.init.initMobile();
    else wy.init.initWeb();
}, false);

$(function(){
    if(!(window.cordova && window.cordova.platformId !== "browser")) wy.init.initWeb();
});