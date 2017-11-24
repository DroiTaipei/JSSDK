describe('Test', function() {
    before( async function() {
        DroiBaaS.DroiCore.initializeCore("rnitmbzhCkr4YpyljuoQpvufVr6_mpHwlQDOWywR", "ie9e4K9aVni7-Kh06qdJd5PgvMtNmswApFIMPoV1xpfWtTFHSqU0GMeIilBqEIlG");
        await DroiBaaS.DroiUser.loginAnonymous();
    });

    after( async function() {
        let user = DroiBaaS.DroiUser.getCurrentUser();
        await user.logout();
    });

    it('Object', async function() {
        let obj = DroiBaaS.DroiObject.createObject("MyTable");
        obj.setValue("name", "skyer");
        await obj.save();
    });
});
