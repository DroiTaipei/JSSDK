describe('RestAPI', function() {
    this.timeout(60000);

    before(function() {
        DroiBaaS.DroiCore.initializeCore("ke8umbzhvkW9Zb6HAjzyw7j8pUJbZSEUlQAAWGoK", "Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S");
    });

    it('Simple add', async function() {
        let jobj = {num1: 100, num2: 200};
        let result = await DroiBaaS.DroiCloud.callRestApi("Sxfqun4fK7zT09jGNu4cklSNS7XL_lOSq4zsTAf1nnewPMp0yS6CAh1eBI0ksg_S", "/api/v2/test_add", DroiBaaS.DroiHttpMethod.POST, JSON.stringify(jobj));
        jobj = JSON.parse(result);
        if (jobj["result"] != 300)
            throw new DroiBaaS.DroiError(DroiBaaS.DroiError.ERROR, `Result != 300, ${jobj["result"]}`);
    })
});