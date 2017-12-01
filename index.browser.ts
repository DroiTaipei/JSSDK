import * as DroiBaaS from "./src"

let globalInstance = this;
if (typeof global !== 'undefined')
    globalInstance = global;
else if (typeof window !== 'undefined')
    globalInstance = window;

globalInstance["DroiBaaS"] = DroiBaaS;

if (typeof module !== 'undefined') {
    module.exports = DroiBaaS;
}