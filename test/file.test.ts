import { assert } from 'chai'
import { describe, it, beforeEach, afterEach, before, after } from 'mocha'
// - 
import * as DroiBaaS from '../src'

describe('Droi File', function() {
    this.timeout(60000);
    

    before( async () => {
        DroiBaaS.DroiCore.initializeCore("ggnvmbzhQMYu7bh3w5GNWKiFpOvYXvTWlQBkVR4o", "LkuC11fMUGXsNQM0FU1-DJHgq_RxEl--qL2IIVhgtHqUFFDVg5TuWxBsKxAjyV_t");
        let user = DroiBaaS.DroiUser.getCurrentUser();
        if ( user == null || !user.isLoggedIn() ) {
            await DroiBaaS.DroiUser.loginAnonymous();
        }
    });

    let data = new Uint8Array(1048576);
    for ( let idx =0; idx<data.length; idx++ )
        data[idx] = idx;

    let file = DroiBaaS.DroiFile.createFile( data, "test" );

    after( async () => {
        let err = await file.delete();
        assert( err.isOk );

        let user = DroiBaaS.DroiUser.getCurrentUser();
        if (user != null && user.isLoggedIn())
            await user.logout();
    });


    it( 'Create File', async ()=> {
        let error = await file.save( (curr, total) => {
            console.log(`${curr}/${total}`);
        });
        assert( error.isOk );
        assert( file.Size == data.length );
    });

    it( 'Get URL', async () => {
        let urls = await file.getUris( false );
        assert( urls != null && urls.length > 0 );
        console.log('Get URL by Dmd. value is ' + urls[0]);
    });

    it( 'Get URLs', async () => {
        let urls = await file.getUris( true );
        assert( urls != null && urls.length > 0 );
        console.log('Get URL from cloud. value is ' + urls[0]);
    });

    it( 'Update Data', async () => {
        data = new Uint8Array(51200);
        for ( let idx =0; idx<data.length; idx++ )
            data[idx] = idx;    
        let err = await file.update( data, (curr, total) => {
            console.log(`${curr}/${total}`);
        });
        assert( err.isOk );
        assert( file.Size == data.length );
    });
});