const { describe, before, after, it, beforeEach, afterEach} = require("mocha")
const DroiBaaS = require("../src")

describe('Droi settings', function() {
    before(function() {
        DroiBaaS.DroiCore.initializeCore("rnitmbzhCkr4YpyljuoQpvufVr6_mpHwlQDOWywR", "ie9e4K9aVni7-Kh06qdJd5PgvMtNmswApFIMPoV1xpfWtTFHSqU0GMeIilBqEIlG");
    });

    it('DroiPreference', function(done) {
        DroiBaaS.DroiPreference.instance().refresh()
            .then( (_) => {
                let value = DroiBaaS.DroiPreference.instance().getValue("key");
                if (value != "value")
                    throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, "value not match.");
                done();
            })
            .catch( (error) => {
                throw error;
            });
    });

    it('DroiCloudCache', async function() {
        try {
            await DroiBaaS.DroiCloudCache.getValue("key")
        } catch ( error ) {
            if (error.code != 1420301)
                throw error;
        }

        await DroiBaaS.DroiCloudCache.setValue("key", "value");
        let value = await DroiBaaS.DroiCloudCache.getValue("key");
        if (value != "value")
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, "value not match");
        await DroiBaaS.DroiCloudCache.removeValue("key");
    });
});