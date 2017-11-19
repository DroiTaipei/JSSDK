import * as DroiBaaS from "./index"

function showHello(divName, name) {
    const elt = document.getElementById(divName);
    elt.innerText = DroiBaaS.DroiCore.getVersion();
}

showHello("greeting", "TypeScript");
