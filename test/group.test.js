const { describe, it, beforeEach, afterEach, before, after } = require('mocha')
const DroiBaaS = require('../src')

describe('Group', function() {
    this.timeout(60000);

    before( async () => {
        DroiBaaS.DroiCore.initializeCore("rnitmbzhCkr4YpyljuoQpvufVr6_mpHwlQDOWywR", "ie9e4K9aVni7-Kh06qdJd5PgvMtNmswApFIMPoV1xpfWtTFHSqU0GMeIilBqEIlG");
    });

    beforeEach( function(done) {
        let user = DroiBaaS.DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn())
            user.logout().then( (_) => {
                done();
            })
        else
            done();
    });

    afterEach( async function() {
        let user = DroiBaaS.DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn())
            await user.logout();
        
        try {
            user = await DroiBaaS.DroiUser.login("test_group", "123456");
            await user.delete();
        } catch (_) {

        }

        user = await DroiBaaS.DroiUser.loginAnonymous();

        try {
            let query = DroiBaaS.DroiQuery.create("MyTable");
            let list = await query.runQuery();
            for (let item of list)
                item.delete();
        } catch (_) {

        }

        let group = DroiBaaS.DroiGroup.createGroup("group1");
        await group.fetchRelation();
        await group.delete();

        await user.delete();
    });

    it('CRUD', async function() {
        let user = await DroiBaaS.DroiUser.loginAnonymous();
        let group = DroiBaaS.DroiGroup.createGroup("group1");
        group.addUser(user.objectId());
        await group.save();

        group = DroiBaaS.DroiGroup.createGroup("group1");
        await group.fetchRelation();
    });

    it('ACL', async function() {
        let user = await DroiBaaS.DroiUser.loginAnonymous();
        let g1 = DroiBaaS.DroiGroup.createGroup("group1");
        g1.addUser(user.objectId());
        await g1.save();

        let perm = new DroiBaaS.DroiPermission();
        perm.setGroupReadPermission(g1.objectId(), true);
        perm.setGroupWritePermission(g1.objectId(), true);

        let table = DroiBaaS.DroiObject.createObject("MyTable");
        table.setValue("name", "group test");
        table.setValue("intValue", 999);
        table.permission = perm;
        await table.save();

        let query = DroiBaaS.DroiQuery.create("MyTable").where(DroiBaaS.DroiCondition.eq("intValue", 999));
        let list = await query.runQuery();
        if (list.length != 1)
            throw "list size != 1";
        
        await user.logout();

        user = DroiBaaS.DroiUser.createUser();
        user.UserId = "test_group";
        user.Password = "123456";
        await user.signup();

        query = DroiBaaS.DroiQuery.create("MyTable").where(DroiBaaS.DroiCondition.eq("intValue", 999));
        list = await query.runQuery();
        if (list.length != 0)
            throw "list size != 0";
    });

    it('Query', async function() {
        let user = await DroiBaaS.DroiUser.loginAnonymous();
        let group = DroiBaaS.DroiGroup.createGroup("group1");
        group.addUser(user.objectId());
        await group.save();

        let query = DroiBaaS.DroiQuery.create("_Group").where(DroiBaaS.DroiCondition.eq("Name", "group1"));
        let list = await query.runQuery();
        if (list.length != 1)
            throw "list size != 1";
    });

    it('Parent', async function() {
        let user = await DroiBaaS.DroiUser.loginAnonymous();
        let group = DroiBaaS.DroiGroup.createGroup("group1");
        group.addUser(user.objectId());
        await group.save();

        let list = await DroiBaaS.DroiGroup.getGroupIdsByUserObjectId(user.objectId());
        if (list.length != 1)
            throw "list size != 1";
        
        let query = DroiBaaS.DroiQuery.create("_Group").where(DroiBaaS.DroiCondition.eq("_Id", list[0]));
        let list2 = await query.runQuery();

        if (list2.length != 1)
            throw "list2 size != 1";
    });
});