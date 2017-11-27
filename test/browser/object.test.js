describe('Droi objects', function() {
    this.timeout(60000);

    before( async () => {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
        await DroiBaaS.DroiUser.loginAnonymous();
    });

    after( async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn())
            await user.delete();
    });

    afterEach( async () => {
        let query = DroiBaaS.DroiQuery.create("js_base");
        let list = await query.runQuery();
        for (let key in list)
            await list[key].delete();

        query = DroiBaaS.DroiQuery.create("js_test");
        list = await query.runQuery();
        for (let key in list)
            await list[key].delete();
    });

    it('Upsert object', async () => {
        let obj = DroiBaaS.DroiObject.createObject("js_test");
        obj.setValue("name", "skyer");
        obj.setValue("data", 1836449);
        
        let error = await obj.save();
    });

    it('Query objects', async () => {
        for (let i=0; i<10; ++i) {
            let obj = DroiBaaS.DroiObject.createObject("js_test");
            obj.setValue("name", `skyer${i}`);
            obj.setValue("data", i);
            await obj.save();
        }

        // Test 1 - all
        let query = DroiBaaS.DroiQuery.create("js_test");
        let list = await query.runQuery();
        if (list.length != 10)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj query size != 10, size = ${list.length}`);

        // Test 2 - condition
        let cond1 = DroiBaaS.DroiCondition.gt("data", 3);
        let cond2 = DroiBaaS.DroiCondition.startsWith("name", "skyer");

        query = DroiBaaS.DroiQuery.create("js_test").where(cond1.and(cond2));
        list = await query.runQuery();
        if (list.length != 6)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj cond query size != 6, size = ${list.length}`);

        // Test 3 - null
        query = DroiBaaS.DroiQuery.create("js_test").where(DroiBaaS.DroiCondition.isNull("data"));
        list = await query.runQuery();
        if (list.length != 0)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj null query size != 0, size = ${list.length}`);
        
        query = DroiBaaS.DroiQuery.create("js_test").where(DroiBaaS.DroiCondition.isNotNull("data"));
        list = await query.runQuery();
        if (list.length != 10)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj null query size != 10, size = ${list.length}`);
    });

    it('Reference objects', async () => {
        let obj1 = DroiBaaS.DroiObject.createObject("js_base");
        obj1.setValue("field1", "value1");

        let obj2 = DroiBaaS.DroiObject.createObject("js_test");
        obj2.setValue("ref", obj1);
        obj2.setValue("name", "ref");

        await obj2.save();

        let query = DroiBaaS.DroiQuery.create("js_test").where(DroiBaaS.DroiCondition.eq("name", "ref"));
        let list = await query.runQuery();
        if (list.length != 1)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj ref query size != 1, size = ${list.length}`);

        let obj = list[0].getValue("ref");
        if ("value1" !== obj.getValue("field1"))
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj ref wrong value, value = ${obj.getValue("field1")}`);
    });

    it('Partial update', async () => {
        for (let i=0; i<10; ++i) {
            let obj = DroiBaaS.DroiObject.createObject("js_test");
            obj.setValue("name", `skyer${i}`);
            obj.setValue("data", i);
            await obj.save();
        }

        let cond = DroiBaaS.DroiCondition.eq("data", 3).or(DroiBaaS.DroiCondition.eq("data", 5));
        let query = DroiBaaS.DroiQuery.updateData("js_test").set("name", "skyer").where(cond);
        await query.run();

        query = DroiBaaS.DroiQuery.create("js_test").where(DroiBaaS.DroiCondition.eq("name", "skyer"));
        let list = await query.runQuery();
        if (list.length != 2)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj ref query size != 2, size = ${list.length}`);
    });

    it ('Atomic', async () => {
        let obj = DroiBaaS.DroiObject.createObject("js_test");
        obj.setValue("name", "skyer");
        obj.setValue("data", 2);
        await obj.save();

        await obj.atomicAdd("data", 100);

        let query = DroiBaaS.DroiQuery.create("js_test").where(DroiBaaS.DroiCondition.eq("name", "skyer"));
        let list = await query.runQuery();

        if (list.length != 1)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj atom query size != 1, size = ${list.length}`);

        let data = list[0].getValue("data");

        if (data != 102)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `obj atom not match data != 102, data = ${data}`);
    });
});