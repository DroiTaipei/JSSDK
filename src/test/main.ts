
import * as DroiBaaS from '../index';
// cocosTest
DroiBaaS.DroiCore.initializeCore( "ggnvmbzhQMYu7bh3w5GNWKiFpOvYXvTWlQBkVR4o", "LkuC11fMUGXsNQM0FU1-DJHgq_RxEl--qL2IIVhgtHqUFFDVg5TuWxBsKxAjyV_t" );

let func = () => {
    let data = new Uint8Array(1048576);
    let data2 = new Uint8Array(1048576/2);
    for ( let idx =0; idx<data.length; idx++ )
        data[idx] = idx;
    for ( let idx =0; idx<data2.length; idx++ )
        data2[idx] = idx+2;
    console.log("Test begin");
    let df = DroiBaaS.DroiFile.createFile( data, "test" );
    
    let cb = (currentSize, totalSize) =>  {
        console.log( `${currentSize}/${totalSize}` );
    };
    
    df.save(  cb ).then( (err) => {
        console.log( "Finish");
        setTimeout( () => {
            df.update( data2 ).then( (res) => {
                console.log( "Finish2");
            }).catch( (error) => {
                console.log( "Failed. 2" + err );
                
            });
        }, 12000);
    } ).catch( (err) => {
        console.log( "Failed. " + err );
    } );    
};

let user = DroiBaaS.DroiUser.getCurrentUser();
if ( user == null || !user.isLoggedIn() ) {
    DroiBaaS.DroiUser.loginAnonymous().then( (res) => {
        func();
    });
} else {
    func();
}
console.log( "main end");