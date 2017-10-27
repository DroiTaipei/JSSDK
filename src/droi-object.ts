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
            keyName == DroiConstant.DROI_KEY_JSON_TABLE_NAME )
            return;
    }

    getValue( keyName : string ) : any {
        if ( keyName == DroiConstant.DROI_KEY_JSON_OBJECTID ||
            keyName == DroiConstant.DROI_KEY_JSON_CREATION_TIME ||
            keyName == DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ||
            keyName == DroiConstant.DROI_KEY_JSON_TABLE_NAME )
            return null;

    }

    toJson() : string {
        let clone = DroiObject.deepCopy( this.properties );

        // 
        return JSON.stringify( clone );
    }

    //
    private static deepCopy(obj) : any {
        var copy;
    
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;
    
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
    
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = DroiObject.deepCopy(obj[i]);
            }
            return copy;
        }
    
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = DroiObject.deepCopy(obj[attr]);
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

export { DroiObject };
