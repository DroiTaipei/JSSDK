import {DroiConstant} from './droi-const';
import {DroiPermission} from './droi-permission';

class Dictionary {
    [keyName: string]: any;
}

// http://stackoverflow.com/questions/26501688/a-typescript-guid-class
class Guid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );
            return v.toString(16);
        });
    }
}

class DroiObject {
    static createObject( tableName : string ) : DroiObject {
        return new DroiObject( tableName );
    }

    private constructor( tableName : string ) {
        this.tableName = tableName;

        // createdTime, modifiedTime
        let currentDate = new Date();
        this.properties[ DroiConstant.DROI_KEY_JSON_CLASSNAME ] = tableName;
        this.properties[ DroiConstant.DROI_KEY_JSON_OBJECTID ] = Guid.newGuid();
        this.properties[ DroiConstant.DROI_KEY_JSON_CREATION_TIME ] = currentDate.toISOString();
        this.properties[ DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ] = currentDate.toISOString();
    }

    objectId() : string {
        return this.properties[DroiConstant.DROI_KEY_JSON_OBJECTID];
    }

    creationTime() : Date {
        var ct : string = this.properties[ DroiConstant.DROI_KEY_JSON_CREATION_TIME ];
        let res = new Date( ct );
        return res;
    }

    modifiedTime() : Date {
        var mt : string = this.properties[ DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ];
        let res = new Date( mt );
        return res;
    }

    getTableName() : string {
        return this.tableName;
    }

    setValue( keyName : string, value : any ) {
        if ( keyName == DroiConstant.DROI_KEY_JSON_OBJECTID ||
            keyName == DroiConstant.DROI_KEY_JSON_CREATION_TIME ||
            keyName == DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ||
            keyName == DroiConstant.DROI_KEY_JSON_CLASSNAME )
            return;

        // TODO: Normally, we should check the datatype of all variables
        let val = null;
        if ( value instanceof Date ) {
            val = value.toISOString();
        } else if (value instanceof DroiObject ) {
            val = value;
        } else if ( value instanceof Array ) {
            var r = [];
            for ( let i of value ) {
                r.push( i );
            }
            val = r;
        } else if ( typeof value === 'object' ) {   // 
            let dict = {};
            for ( let item in value ) {
                dict[item] = value[item];
            }
            val = dict;
        } else if ( typeof value === 'string' || typeof value === 'number' )
            val = value;

        // Return the value
        if ( val != null ) {
            this.properties[ keyName ] = val;
        }
    }

    getValue( keyName : string ) : any {
        if ( keyName == DroiConstant.DROI_KEY_JSON_OBJECTID ||
            keyName == DroiConstant.DROI_KEY_JSON_CREATION_TIME ||
            keyName == DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ||
            keyName == DroiConstant.DROI_KEY_JSON_CLASSNAME ||
            this.properties[keyName] === undefined )
            return null;

        return this.properties[keyName];
    }

    toJson() : string {
        return this.toJSON();
    }

    // For JSON.stringify function
    toJSON() : string {
        let clone = DroiObject.exportProperties( this.properties );
        
        // 
        return JSON.stringify( clone );        
    }

    static fromJson( jobj : any ) : any {
        let res = null;

        // Parse first..
        if ( typeof jobj === 'string' ) {
            try{
                jobj = JSON.parse( jobj );
            } catch (e) {
                return null;
            }
        }

        if ( jobj instanceof Array ) {
            let array = new Array();
            for ( let item of jobj ) {
                let r = DroiObject.fromJson( item );
                if ( r == null ) {
                    if ( typeof item === 'string' || typeof item === 'number' || typeof item === 'object' )
                        array.push( item );
                } else
                    array.push( r );
            }
            res = array;
        } else if ( typeof jobj === 'object' ) {    // Dictionary

            // Check whether this object is DroiObject ??
            if ( jobj[DroiConstant.DROI_KEY_JSON_CLASSNAME] !== undefined &&
                jobj[DroiConstant.DROI_KEY_JSON_OBJECTID] !== undefined &&
                jobj[DroiConstant.DROI_KEY_JSON_CREATION_TIME] !== undefined &&
                jobj[DroiConstant.DROI_KEY_JSON_MODIFIED_TIME] !== undefined ) {
                let tableName = jobj[DroiConstant.DROI_KEY_JSON_CLASSNAME];
                // TODO: Check tableName
                let r = DroiObject.createObject( tableName );

                // Copy the key-Value into object
                for ( let keyName in jobj ) {
                    let v = jobj[keyName];
                    let o = DroiObject.fromJson( v );
                    if ( o != null ) { 
                        r.properties[keyName] = o;
                    } else if ( typeof v === 'string' || typeof v === 'number' || typeof v === 'object' ) {
                        r.properties[keyName] = v;
                    }
                }

                res = r;
            }
        } 

        return res;
    }

    //
    private static exportProperties(obj) : any {
        let copy;
    
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" !== typeof obj) return obj;

        if ( obj instanceof DroiObject )
            return DroiObject.exportProperties( obj.properties );
    
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
    
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = DroiObject.exportProperties(obj[i]);
            }
            return copy;
        }
    
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = DroiObject.exportProperties(obj[attr]);
            }
            return copy;
        }
    
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    //
    private permission : DroiPermission;
    private properties : Dictionary = {};
    private tableName : string;

};

export { DroiObject, Guid };
