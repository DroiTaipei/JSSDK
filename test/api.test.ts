import { assert } from 'chai'
import { describe, it, beforeEach, before, after } from 'mocha'
// - 
import * as DroiBaaS from '../src'
import { RestObject } from '../src/rest/object'
import { RestUser } from '../src/rest/user'

describe('Droi User API', () => {
    before( () => {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
    });

    after( () => {

    });

    it('Anonymous login', async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();

        try {
            if (user != null && user.isLoggedIn()) {
                await user.logout();
            }

            user = await DroiBaaS.DroiUser.loginAnonymous();
        } catch (error) {
            // Error handling
            throw error;
        }
    });

    it('Normal signup', async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();

        try {
            if (user != null && user.isLoggedIn())
                await user.logout();

            user = DroiBaaS.DroiUser.createUser();
            user.UserId = "skyer";
            user.Password = "123456";
            user.Email = "skyer.tai@droi.com.tw";
            user.PhoneNum = "886937011180";
            await user.signup();
        } catch (error) {
            throw error;
        }
    });

    it('Normal login', async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();

        try {
            if (user != null && user.isLoggedIn())
                await user.logout();

            user = await DroiBaaS.DroiUser.login("skyer", "123456")
            console.log(`id: ${user.objectId()}, token: ${user.sessionToken}`);
        } catch (error) {
            throw error;
        }
    });

    it('Validate Email', async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();
        
        try {
            if (user != null && user.isLoggedIn())
                await user.logout();

            user = await DroiBaaS.DroiUser.login("skyer", "123456")
            console.log(`id: ${user.objectId()}, token: ${user.sessionToken}`);

            await user.validateEmail();

        } catch (error) {
            throw error;
        }
    });

    it('Validate Phone', async () => {
        let user = DroiBaaS.DroiUser.getCurrentUser();
        
        try {
            if (user != null && user.isLoggedIn())
                await user.logout();

            user = await DroiBaaS.DroiUser.login("skyer", "123456")
            console.log(`id: ${user.objectId()}, token: ${user.sessionToken}`);

            await user.validatePhoneNum();

        } catch (error) {
            throw error;
        }
    });
});

describe('Droi objects', () => {
    before( () => {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
    });

    after( () => {

    });

    it('Upsert object', async () => {
        try {
            let user = DroiBaaS.DroiUser.getCurrentUser();
            if (user == null || !user.isLoggedIn())
                await DroiBaaS.DroiUser.loginAnonymous();

            let obj = DroiBaaS.DroiObject.createObject("js_test");
            obj.setValue("name", "skyer");
            obj.setValue("data", 1836449);
            
            let error = await obj.save();
        } catch (error) {
            throw error;
        }
    });
});