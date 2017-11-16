
// trick for bypass typescript checking
declare var require: any;
declare var global: any;
declare var localStorage: any;
    
export function setupPolyfill() {
    if (!(String.prototype as any).repeat) {
        (String.prototype as any).repeat = function (count) {
            if (this == null) {
                throw new TypeError('can\'t convert ' + this + ' to object');
            }
            let str = '' + this;
            count = +count;
            if (count != count) {
                count = 0;
            }
            if (count < 0) {
                throw new RangeError('repeat count must be non-negative');
            }
            if (count == Infinity) {
                throw new RangeError('repeat count must be less than infinity');
            }
            count = Math.floor(count);
            if (str.length == 0 || count == 0) {
                return '';
            }
            // Ensuring count is a 31-bit integer allows us to heavily optimize the
            // main part. But anyway, most current (August 2014) browsers can't handle
            // strings 1 << 28 chars or longer, so:
            if (str.length * count >= 1 << 28) {
                throw new RangeError('repeat count must not overflow maximum string size');
            }
            let rpt = '';
            for (var i = 0; i < count; i++) {
                rpt += str;
            }
            return rpt;
        }
    }

    if (!(String.prototype as any).padStart) {
        (String.prototype as any).padStart = function padStart(targetLength, padString) {
            targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
            padString = String(padString || ' ');
            if (this.length > targetLength) {
                return String(this);
            }
            else {
                targetLength = targetLength - this.length;
                if (targetLength > padString.length) {
                    padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
                }
                return padString.slice(0, targetLength) + String(this);
            }
        };
    }

    if (typeof localStorage === 'undefined') {
        if (typeof global !== 'undefined') {
            let storage = require('dom-storage');
            global['localStorage'] = new storage('./data.json', {strict: true});
        }
    }
}