import { assert } from 'chai'
import { describe, it, beforeEach, before } from 'mocha'
// - 
import * as DroiBaaS from '../src'
import { RestObject } from '../src/rest/object'

describe('Droi API Objects', () => {

    before( () => {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK");
    });

    it('Upsert', async () => {
        let obj = DroiBaaS.DroiObject.createObject("rest_object");
        obj.setValue("name", "skyer");
        let str = obj.toJson();

        try {
            let isOk = await RestObject.upsert(str, obj.objectId(), "rest_object");
            console.log(`upsert ${isOk}`);
        } catch (e) {
            console.log(`upsert fail. ${e}`);
            assert.equal(true, false);
        }
    });
});