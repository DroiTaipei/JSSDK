
import * as DroiBaaS from '../index';
DroiBaaS.DroiCore.initializeCore( "2308402384", "234234" );
let test = DroiBaaS.DroiObject.createObject("TEST");
let test1 = DroiBaaS.DroiObject.createObject("TEST1");
test.setValue( "test", "test value" );
test.setValue( "T", "T value" );
test.setValue( "NUM", 12345 );
test.setValue( "array", [8, 2, 3, 4]);
test.setValue( "dict", { "12":12, "24":24, "T":test1 });
test.setValue( "test1", test1 );
test.setValue( "currentTime", new Date() );

console.log("before save" );
// test.save().then( (error) => console.log('sldkfs') ).catch( (error) => console.log('error') );
// test.atomicAdd( "1234", 123 ).then( (error) => console.log('sldkfs') ).catch( (error) => console.log('error') );
console.log("end save");

let user = DroiBaaS.DroiUser.createUser();
user.Email = "12@1.2.2";
user.UserId = "123344";
let s = user.toJSON();
let res = DroiBaaS.DroiObject.fromJson( s );
console.log( res.toJSON() );
