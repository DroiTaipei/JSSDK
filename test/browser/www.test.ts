import * as DroiBaaS from "../../src/index";

function showHello(divName, name) {
    const elt = document.getElementById(divName);
    elt.innerText = DroiBaaS.DroiCore.getVersion();
}

showHello("greeting", "TypeScript");

DroiBaaS.DroiCore.initializeCore( "ggnvmbzhQMYu7bh3w5GNWKiFpOvYXvTWlQBkVR4o", "LkuC11fMUGXsNQM0FU1-DJHgq_RxEl--qL2IIVhgtHqUFFDVg5TuWxBsKxAjyV_t" );
showHello("greeting", "TypeScript");

const elt = document.getElementById("greeting");

DroiBaaS.DroiUser.loginAnonymous().then( (res) => {
    var d = DroiBaaS.DroiObject.createObject("Table");
    d.setValue("Test", "TestValue");
    d.save().then( (res) => {
        elt.innerText = "OK";
    }).catch( (e) => {
        elt.innerText = "Failed, " + e;
    
    });
    
    
});

elt.innerText = "22222";
