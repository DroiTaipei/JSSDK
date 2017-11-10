import { describe, before, after, it, beforeEach, afterEach} from "mocha"
import * as DroiBaaS from "../src"

const NORMAL_USER_NAME = "skyer";
const NORMAL_USER_PASSWORD = "123456";
const NORMAL_USER_EMAIL = "skyer.tai@droi.com.tw";
const NORMAL_USER_PHONE = "886937011180";

async function clearAnonymousUser(): Promise<boolean> {
    let user = DroiBaaS.DroiUser.getCurrentUser();
    if (user != null && user.isLoggedIn())
        await user.logout();

    user = await DroiBaaS.DroiUser.loginAnonymous();
    return user.delete().then( (_) => {
        return true;
    });
}

async function clearNormalUser(): Promise<boolean> {
    let user = DroiBaaS.DroiUser.getCurrentUser();
    if (user != null && user.isLoggedIn())
        await user.logout();

    user = await DroiBaaS.DroiUser.login(NORMAL_USER_NAME, NORMAL_USER_PASSWORD);
    return user.delete().then( (_) => {
        return true;
    });
}

describe('Droi User API', function() {
    this.timeout(20000);

    before( () => {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
    });

    let endActions: Array<()=>Promise<boolean>> = [];

    beforeEach( () => {
        endActions = [];
    });

    afterEach( async () => {
        for (let action of endActions) {
            await action();
        }
    });

    describe.only('Auto', function() {
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

    describe('Manually', function() {

    });
});