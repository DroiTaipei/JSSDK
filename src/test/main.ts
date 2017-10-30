
import * as DroiBaaS from '../index';

let test = DroiBaaS.DroiObject.createObject("TEST");
let test1 = DroiBaaS.DroiObject.createObject("TEST1");
test.setValue( "test", "test value" );
test.setValue( "T", "T value" );
test.setValue( "NUM", 12345 );
test.setValue( "array", [8, 2, 3, 4]);
test.setValue( "dict", { "12":12, "24":24 });
test.setValue( "test1", test1 );
console.log( 'test is ' + test.toJson() );
let s = test.toJson();
console.log("The s is " + s );
let res = DroiBaaS.DroiObject.fromJson( s );
console.log( 'res is ' + res.toJson() ); 