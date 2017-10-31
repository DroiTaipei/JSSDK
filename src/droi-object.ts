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

/**
 * 
 */
class DroiObject {

    /**
     * Create DroiObject instance by specific table name
     * @param tableName Table name of collection
     */
    static createObject( tableName : string ) : DroiObject {
        return new DroiObject( tableName );
    }

    private constructor( tableName : string ) {
        // createdTime, modifiedTime
        let currentDate = new Date();
        this.properties[ DroiConstant.DROI_KEY_JSON_CLASSNAME ] = tableName;
        this.properties[ DroiConstant.DROI_KEY_JSON_OBJECTID ] = Guid.newGuid();
        this.properties[ DroiConstant.DROI_KEY_JSON_CREATION_TIME ] = currentDate.toISOString();
        this.properties[ DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ] = currentDate.toISOString();
    }

    /**
     * The object Id of DroiObject
     */
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

    tableName() : string {
        return this.properties[DroiConstant.DROI_KEY_JSON_CLASSNAME];
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

    toJson( withRef : boolean = false ) : string {
        let clone = DroiObject.exportProperties( this.properties, 0, withRef );
        
        // 
        return JSON.stringify( clone );        
    }

    // For JSON.stringify function
    toJSON() : string {
        return this.toJson( true );
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
                let r = DroiObject.fromJson( item ) || item;
                array.push( item );
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
                    let o = DroiObject.fromJson( v ) || v;
                    r.properties[keyName] = o;
                }

                res = r;
            } else {
                // Normal Dictionary structure
                let dict = {};
                for ( let keyName in jobj ) {
                    let v = jobj[keyName];
                    let o = DroiObject.fromJson( v ) || v;
                    dict[keyName] = o;
                }
                res = dict;
            }
        } 

        return res;
    }

    public static travelDroiObject(obj:any, cb: (droiObject:DroiObject)=>void) : void {

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" !== typeof obj) return;

        let dobject = null;
        if ( obj instanceof DroiObject ) {
            dobject = obj;
            obj = obj.properties;
        }

        // 
        if ( obj instanceof Array ) {
            for ( let item of obj )
                DroiObject.travelDroiObject( item, cb );
        } else if ( obj instanceof Object ) {
            for ( let key in obj ) {
                DroiObject.travelDroiObject( obj[key], cb );
            }
        }

        //
        if ( dobject != null )
            cb( dobject );
    }

    //
    private static exportProperties(obj:any, depth:number, withReference:boolean) : any {
        let copy;
    
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" !== typeof obj) return obj;

        if ( obj instanceof DroiObject ) {
            if ( depth == 0 || withReference ) {
                return DroiObject.exportProperties( obj.properties, depth+1, withReference );
            } else {
                // export reference only..
                copy = { };
                copy[ DroiConstant.DROI_KEY_JSON_OBJECTID ] = obj.objectId();
                copy[ DroiConstant.DROI_KEY_JSON_REFERENCE_TYPE ] = DroiConstant.DROI_KEY_JSON_DATA_TYPE;
                copy[ DroiConstant.DROI_KEY_JSON_TABLE_NAME ] = obj.tableName;
                return copy;
            }
            
        }

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy.toISOString();
        }
    
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = DroiObject.exportProperties(obj[i], depth+1, withReference);
            }
            return copy;
        }
    
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = DroiObject.exportProperties(obj[attr], depth+1, withReference);
            }
            return copy;
        }
    
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    //
    private permission : DroiPermission;
    private properties : Dictionary = {};
};

export { DroiObject, Guid };
