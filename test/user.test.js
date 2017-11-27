const { describe, before, after, it, beforeEach, afterEach} = require("mocha")
const DroiBaaS = require("../src")
const { OtpType } = require("../src/rest/user");

const NORMAL_USER_NAME = "skyer";
const NORMAL_USER_PASSWORD = "123456";
const NORMAL_USER_EMAIL = "skyer.tai@droi.com.tw";
const NORMAL_USER_PHONE = "886937011180";

async function clearAnonymousUser() {
    let user = DroiBaaS.DroiUser.getCurrentUser();
    if (user != null && user.isLoggedIn())
        await user.logout();

    user = await DroiBaaS.DroiUser.loginAnonymous();
    return user.delete().then( (_) => {
        return true;
    });
}

async function clearNormalUser() {
    let user = DroiBaaS.DroiUser.getCurrentUser();
    if (user != null && user.isLoggedIn())
        await user.logout();

    user = await DroiBaaS.DroiUser.login(NORMAL_USER_NAME, NORMAL_USER_PASSWORD);
    return user.delete().then( (_) => {
        return true;
    });
}

async function clearOtpUser() {
    let user = DroiBaaS.DroiUser.getCurrentUser();
    return user.delete().then ( (_) => {
        return true;
    });
}

describe('Droi User API', function() {
    this.timeout(20000);

    before( () => {
        // Production
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
        // Alpha
        // DroiBaaS.DroiCore.initializeCore("u47umbzhT74eZkJuuvaSi2fvlob8rpCKlQBAN38f", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
    });

    let endActions = [];

    beforeEach( () => {
        endActions = [];
    });

    afterEach( async () => {
        for (let action of endActions) {
            await action();
        }
    });

    describe('Auto', function() {
        it('Anonymous login', async () => {
            endActions.push(clearAnonymousUser);
            await DroiBaaS.DroiUser.loginAnonymous();
        });
    
        it('Normal user', async () => {
            endActions.push(clearNormalUser);
    
            let user = DroiBaaS.DroiUser.createUser();
            user.UserId = NORMAL_USER_NAME
            user.Password = NORMAL_USER_PASSWORD;
            user.Email = NORMAL_USER_EMAIL;
            user.PhoneNum = NORMAL_USER_PHONE;
            await user.signup();
    
            await user.logout();
    
            user = await DroiBaaS.DroiUser.login(NORMAL_USER_NAME, NORMAL_USER_PASSWORD);
        });    
    });

    // describe('Manually', function() {
    //     it('RequestOTP mail', async function() {
    //         await DroiBaaS.DroiUser.requestOTP(NORMAL_USER_EMAIL, OtpType.EMAIL);
    //     })

    //     it('LoginOTP mail', async function() {
    //         endActions.push(clearOtpUser);
    //         let user = await DroiBaaS.DroiUser.loginOTP(NORMAL_USER_EMAIL, OtpType.EMAIL, "");
    //     });
    // });
});