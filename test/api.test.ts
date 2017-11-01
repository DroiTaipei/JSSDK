import { assert } from 'chai'
import { describe, it, beforeEach, before } from 'mocha'
// - 
import * as DroiBaaS from '../src'
import { RestObject } from '../src/rest/object'
import { RestUser } from '../src/rest/user'

describe('Droi User API', () => {
    before( () => {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
    });

    it('Anonymous login', async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();

        try {
            if (user != null && user.isLoggedIn()) {
                console.log(`user logged in`);
                await user.logout();
            }

            user = await DroiBaaS.DroiUser.loginAnonymous();
            console.log(`user token: ${user.objectId()}`);

        } catch (error) {
            console.log(`error: ${error}`);
        }
    });
});

// describe('Droi API Objects', () => {
//     before( () => {
//         DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
//     });

//     it('Upsert', async () => {
//         let obj = DroiBaaS.DroiObject.createObject("rest_object");
//         obj.setValue("name", "skyer");
//         let str = obj.toJson();

//         try {
//             let isOk = await RestObject.upsert(str, obj.objectId(), "rest_object");
//             console.log(`upsert ${isOk}`);
//         } catch (e) {
//             console.log(`upsert fail. ${e}`);
//             assert.equal(true, false);
//         }
//     });
// });