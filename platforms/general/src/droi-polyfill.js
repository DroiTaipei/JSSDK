function setupPolyfill() {
    let __global = this;
    if (typeof global !== 'undefined')
        __global = global;
    else if (typeof window !== 'undefined')
        __global = window;

    if (!String.prototype.repeat) {
        String.prototype.repeat = function (count) {
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

    if (!String.prototype.padStart) {
        String.prototype.padStart = function padStart(targetLength, padString) {
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
            global["localStorage"] = new storage("data.json", { strict: true });
        }
    }

    if (typeof Buffer === 'undefined') {
        __global["Buffer"] = require('buffer');
    }

    if (typeof atob === 'undefined') {
        __global['atob'] = function(str) {
            return new Buffer(str, 'base64').toString('binary');
        };
    }

    if (typeof btoa === 'undefined') {
        __global['btoa'] = function(str) {
            let buffer;
            if (str instanceof Buffer) {
                buffer = str;
            } else {
                buffer = new Buffer(str.toString(), 'binary');
            }
            return buffer.toString('base64');
        }
    }
}

setupPolyfill();