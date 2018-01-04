const { assert } = require('chai');
const { describe, it, beforeEach, afterEach, before, after } = require('mocha')
// - 
const DroiBaaS = require('../src')

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
        let count = await query.count();   
        let limit = 200;
        let offset = count - limit;
        if (offset < 0) offset = 0;
        while (count > 0 && offset >= 0) {
            query = DroiBaaS.DroiQuery.create("js_test").offset(0).limit(limit);
            list = await query.runQuery();
            await DroiBaaS.DroiObject.deleteAll(list);
            offset -= list.length;
        }
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

        let count = await DroiBaaS.DroiQuery.create("js_test").count();
        if (count != 10)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `count fail. ${count} != 10`);
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

    it('depth', function() {
        let obj = DroiBaaS.DroiObject.createObject("js_test");
        let obj2 = DroiBaaS.DroiObject.createObject("js_base");
        let obj3 = DroiBaaS.DroiObject.createObject("js_second");
        obj3.setValue("field", "value");
        obj2.setValue("field1", "value1");
        obj2.setValue("ref", obj3);
        obj2.setValue("ref2", [obj3]);
        obj.setValue("name", "name 1");
        obj.setValue("ref", {"key": [obj2]});

        let depth = DroiBaaS.DroiObject.getDepth(obj, 0);
        if (depth != 2)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `depth ${depth} != 2`);
    });

    it('Save all', async function() {
        let list = [];
        for (let i=0; i<2600; ++i) {
            let obj = DroiBaaS.DroiObject.createObject("js_test");
            obj.setValue("name", "Name " + i);
            list.push(obj);
        }

        await DroiBaaS.DroiObject.saveAll(list);

        let query = DroiBaaS.DroiQuery.create("js_test");
        let count = await query.count();
        if (count != 2600)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `add count ${count} != 2600`);

        let limit = 200;
        let offset = count - limit;
        while (offset >= 0) {
            query = DroiBaaS.DroiQuery.create("js_test").offset(0).limit(limit);
            list = await query.runQuery();
            await DroiBaaS.DroiObject.deleteAll(list);
            offset -= list.length;
        }
    
        query = DroiBaaS.DroiQuery.create("js_test");
        count = await query.count();
        if (count != 0)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `remove count ${count} != 0`);

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