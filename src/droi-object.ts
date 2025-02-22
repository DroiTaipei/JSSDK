import { RestObject } from './rest/object';
import { DroiConstant } from './droi-const';
import { DroiPermission } from './droi-permission';
import { DroiError } from "./droi-error";
import { DroiQueryInternal as DroiQuery } from "./droi-query-internal";
import { DroiCondition } from './droi-condition';


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

enum DirtyFlag {
    DIRTY_FLAG_BODY = 1,
    DIRTY_FLAG_REFERENCE = 2
};

class BulkList {
    objs: Array<any> = [];
    dataSize: number = 0;

    addDroiObject(obj: DroiObject) {
        let jsonStr = obj.toJson();
        this.objs.push(JSON.parse(jsonStr));
        this.dataSize += encodeURIComponent(jsonStr).replace(/%[A-F\d]{2}/g, 'U').length;
    }

    addObjectId(objId: string) {
        this.objs.push(objId);
        this.dataSize += encodeURIComponent(objId).replace(/%[A-F\d]{2}/g, 'U').length + 3;
    }
}

/**
 * 
 */
class DroiObject {

    static TIME_SHIFT: number = 0;
    static INTERNAL_KEYS = [ DroiConstant.DROI_KEY_JSON_OBJECTID, DroiConstant.DROI_KEY_JSON_CREATION_TIME, DroiConstant.DROI_KEY_JSON_MODIFIED_TIME, DroiConstant.DROI_KEY_JSON_CLASSNAME ];

    /**
     * Create DroiObject instance by specific table name
     * @param className Class name of collection
     */
    static createObject( className : string ) : DroiObject {
        if ( DroiObject.factoryies.hasOwnProperty( className ) ) {
            return DroiObject.factoryies[className]();
        }
        return new DroiObject( className );
    }

    protected constructor( tableName : string ) {

        // createdTime, modifiedTime        
        let currentDate = new Date();
        this.mTableName = tableName;
        this.properties[ DroiConstant.DROI_KEY_JSON_CLASSNAME ] = tableName;
        this.properties[ DroiConstant.DROI_KEY_JSON_OBJECTID ] = Guid.newGuid().replace(/-/g, "").substring(8);
        this.properties[ DroiConstant.DROI_KEY_JSON_CREATION_TIME ] = currentDate.toISOString();
        this.properties[ DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ] = currentDate.toISOString();
    }

    /**
     * The object Id of DroiObject
     */
    objectId() : string {
        return this.properties[DroiConstant.DROI_KEY_JSON_OBJECTID];
    }

    protected setObjectId( objectId: string ) {
        this.properties[ DroiConstant.DROI_KEY_JSON_OBJECTID ] = objectId;
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
        return this.mTableName;
    }

    setClassName( className : string ) {
        this.properties[ DroiConstant.DROI_KEY_JSON_CLASSNAME ] =  className;
    }

    setValue( keyName : string, value : any ) {
        if (DroiObject.INTERNAL_KEYS.indexOf(keyName) >= 0)
            return;

        if ( value == null ) {
            // Check whether the data is in properties
            if ( this.properties.hasOwnProperty(keyName) ) {
                delete this.properties[keyName];
                this.dirtyFlags |= DirtyFlag.DIRTY_FLAG_BODY;
            }
            return;
        }

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
        } else if ( typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
            val = value;

        // Return the value
        if ( val != null ) {
            if ( val != this.properties[keyName] )
                this.dirtyFlags |= DirtyFlag.DIRTY_FLAG_BODY;
            this.properties[ keyName ] = val;
        }
    }

    getKeys(): Array<string> {
        return Object.keys(this.properties).filter(v => DroiObject.INTERNAL_KEYS.indexOf(v) == -1);
    }

    getValue( keyName : string ) : any {
        if (DroiObject.INTERNAL_KEYS.indexOf(keyName) >= 0 || this.properties[keyName] == undefined)
            return null;

        return this.properties[keyName];
    }

    static async saveAll( items : Array<DroiObject> ): Promise<DroiError> {
        let groups: {[key: string]: Array<BulkList>} = {};
        for (let obj of items) {
            if (DroiObject.getDepth(obj, 0) > 0) {
                try {
                    await obj.save();
                } catch (error) {
                    return Promise.reject(error);
                }
                continue;
            }

            obj.checkDirtyFlags();
            if (!obj.isDirty)
                continue;

            let tableName = obj.tableName();
            let objs: Array<BulkList> = null;
            if (groups.hasOwnProperty(tableName))
                objs = groups[tableName];
            else {
                objs = [new BulkList()];
                groups[tableName] = objs;
            }

            let bulkList = objs[objs.length-1];
            if (bulkList.dataSize > 409600) {
                bulkList = new BulkList();
                objs.push(bulkList);
            }

            bulkList.addDroiObject(obj);
        }

        let restObject = RestObject.instance();

        for (let tableName in groups) {
            let objs = groups[tableName];
            for (let bulkList of objs) {
                let jobj = {"Objects": bulkList.objs};
                try {
                    await restObject.bulkUpsert(tableName, JSON.stringify(jobj));
                } catch (error) {
                    return Promise.reject(error);
                }
            }
        }

        return Promise.resolve(new DroiError(DroiError.OK));
    }

    static async deleteAll( items : Array<DroiObject> ): Promise<DroiError> {
        let groups: {[key: string]: Array<BulkList>} = {};
        for (let obj of items) {
            let tableName = obj.tableName();
            let objs: Array<BulkList> = null;
            if (groups.hasOwnProperty(tableName))
                objs = groups[tableName];
            else {
                objs = [new BulkList()];
                groups[tableName] = objs;
            }

            let bulkList = objs[objs.length-1];
            if (bulkList.dataSize > 1024) {
                bulkList = new BulkList();
                objs.push(bulkList);
            }

            bulkList.addObjectId(obj.objectId());
        }

        let restObject = RestObject.instance();

        for (let tableName in groups) {
            let objs = groups[tableName];
            for (let bulkList of objs) {
                let jobj = {"IDs": bulkList.objs};
                try {
                    await restObject.bulkDelete(tableName, JSON.stringify(jobj));
                } catch (error) {
                    return Promise.reject(error);
                }
            }
        }

        return Promise.resolve(new DroiError(DroiError.OK));
    }

    static fetch( tableName: string, objectId: string ): Promise<DroiObject> {
        return DroiQuery.create( tableName ).where( DroiCondition.cond( DroiConstant.DROI_KEY_JSON_OBJECTID, DroiConstant.DroiCondition_EQ, objectId) ).runQuery().then( (res) =>{
            if ( res.length > 0 )
                return res[0];
            return null;
        });
    }

    save():Promise<DroiError> {
        return this.funcTemplate( this.saveToStorage );
    }

    delete():Promise<DroiError> {
        return this.funcTemplate( this.deleteFromStorage);
    }

    atomicAdd( field : string, amount : number ):Promise<DroiError> {
        return this.funcTemplate( async function (self) {
            //
            self.checkDirtyFlags();
            if ( (self.dirtyFlags & DirtyFlag.DIRTY_FLAG_BODY) != 0 )
                return Promise.reject(new DroiError( DroiError.ERROR, "DroiObject content dirty" ));

            let query = DroiQuery.updateData(self.tableName()).atomic(self).add(field, amount);
            let error = await query.run();
            return error;
        } );
    }

    private funcTemplate( func : (self) => Promise<DroiError> ):Promise<DroiError> {
        let _self = this;
        let handler = async (resolve, reject) => {
            // Execute func
            try {
                let error = await func(_self);
                if ( error.isOk ) {
                    resolve( error );
                } else {
                    reject( error );
                }
            } catch( e ) {
                console.log(e);
                let error : DroiError;
                if ( e instanceof DroiError )
                    error = e;
                else {
                    error = new DroiError( DroiError.ERROR );
                }

                reject( error );
            }                
        };

        // Use Promise method
        return new Promise(handler);        
    }

    private saveToStorage(self) : Promise<DroiError> {
        self.checkDirtyFlags();
        // 
        if ( self.dirtyFlags == 0 ) {
            return Promise.resolve(new DroiError( DroiError.OK ));
        }

        let error = new DroiError(DroiError.OK);
        let date = new Date();
        // date = new Date( date.getTime() + TIME_SHIFT );
        self.properties[ DroiConstant.DROI_KEY_JSON_MODIFIED_TIME ] = date.toISOString();
        self.dirtyFlags |= DirtyFlag.DIRTY_FLAG_BODY;
        let query = DroiQuery.upsert( self );
        
        return query.run().then( (droiError) => {
            self.dirtyFlags = 0;
            return droiError;
        });
    }

    private deleteFromStorage(self) : Promise<DroiError> {
        let error = new DroiError(DroiError.OK);
        let query = DroiQuery.delete( self );
        return query.run();
    }

    isDirty() : boolean {
        return (this.dirtyFlags != 0)?true:false;
    }

    get permission(): DroiPermission {
        return this.perm;
    }

    set permission( p: DroiPermission ) {
        this.dirtyFlags |= DirtyFlag.DIRTY_FLAG_BODY;
        this.perm = p;
    }

    private checkDirtyFlags() : void {
        let referenceDirty = false;

        let self = this;
        // Check all children
        DroiObject.travelDroiObject( self, (droiObject) => {
            if ( self == droiObject )
                return;

            droiObject.checkDirtyFlags();
            
            referenceDirty = droiObject.isDirty() || referenceDirty;
        });

        if ( referenceDirty ) {
            self.dirtyFlags |= DirtyFlag.DIRTY_FLAG_REFERENCE;
        }
    }

    toJson( withRef : boolean = false ) : string {
        // 
        let clone = DroiObject.exportProperties( this.properties, 0, withRef );
        
        // Permission
        if ( this.permission !== undefined ) {
            clone[DroiConstant.DROI_KEY_JSON_PERMISSION] = this.permission.toJsonObject();
        } else if ( DroiPermission.getDefaultPermission() !== undefined ) {
            let perm = DroiPermission.getDefaultPermission();
            clone[DroiConstant.DROI_KEY_JSON_PERMISSION] = perm.toJsonObject();
        }
        return JSON.stringify( clone );        
    }

    // For JSON.stringify function
    toJSON() : string {
        return this.toJson( true );
    }

    /**
     * Clone DroiObject
     * @param droiObject DroiObject
     */
    cloneFrom(droiObject: DroiObject) {
        this.properties = droiObject.properties;
        this.permission = droiObject.permission;
        this.dirtyFlags = droiObject.dirtyFlags;
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
                let tableName = jobj[DroiConstant.DROI_KEY_JSON_CLASSNAME]; // ????
                // TODO: Check tableName
                // The tableName is set by creation factory..
                let r = DroiObject.createObject( tableName );

                // Copy the key-Value into object
                for ( let keyName in jobj ) {
                    let v = jobj[keyName];
                    let o = DroiObject.fromJson( v ) || v;
                    r.properties[keyName] = o;
                }

                res = r;
            } else {
                // Check whether this is reference data value
                if ( jobj[DroiConstant.DROI_KEY_JSON_DATA_TYPE] !== undefined ) {
                    let dataTypeName = jobj[DroiConstant.DROI_KEY_JSON_DATA_TYPE];
                    let r = null;
                    if ( dataTypeName == DroiConstant.DROI_KEY_JSON_REFERENCE_TYPE ||
                        dataTypeName == DroiConstant.DROI_KEY_JSON_FILE_TYPE ) {
                        let refValue = jobj[DroiConstant.DROI_KEY_JSON_REFERENCE_VALUE];
                        if ( refValue !== undefined ) {
                            // Error -> null
                            r = DroiObject.fromJson( refValue );
                        }
                    }
                    res = r;
                } 
                
                if ( res == null ) {
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
        } 

        // Check whether the permission ??
        if ( jobj[DroiConstant.DROI_KEY_JSON_PERMISSION] !== undefined ) {
            res.permission = DroiPermission.restorePermission( jobj[DroiConstant.DROI_KEY_JSON_PERMISSION] );
        }

        return res;
    }

    public static travelDroiObject(obj:any, cb: (droiObject:DroiObject)=>void, depthLimit: number=3, depth: number=0) : void {

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" !== typeof obj || depthLimit<=depth) return;

        let dobject = null;
        if ( obj instanceof DroiObject ) {
            dobject = obj;
            obj = obj.properties;
        }

        // 
        if ( obj instanceof Array ) {
            for ( let item of obj )
                DroiObject.travelDroiObject( item, cb, depthLimit, depth+1 );
        } else if ( obj instanceof Object ) {
            for ( let key in obj ) {
                DroiObject.travelDroiObject( obj[key], cb, depthLimit, depth+1 );
            }
        }

        //
        if ( dobject != null )
            cb( dobject );
    }

    private static getDepth(obj: any, depth: number): number {
        if (depth > 3)
            return 3;

        if (obj == null || typeof obj !== "object")
            return depth;

        let nowDepth = depth;

        if (obj instanceof Array) {
            for (let item of obj) {
                let newDepth = (item instanceof DroiObject) ? nowDepth + 1 : nowDepth;
                depth = Math.max(depth, DroiObject.getDepth(item, newDepth));
            }
        } else if (obj instanceof Object) {
            let objs = (obj instanceof DroiObject) ? obj.properties : obj;
            for (let key in objs) {
                let subObj = objs[key];
                let newDepth = (subObj instanceof DroiObject) ? nowDepth + 1 : nowDepth;
                depth = Math.max(depth, DroiObject.getDepth(subObj, newDepth));        
            }
        }

        return depth;
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
                copy[ DroiConstant.DROI_KEY_JSON_DATA_TYPE ] = DroiConstant.DROI_KEY_JSON_REFERENCE_TYPE;
                copy[ DroiConstant.DROI_KEY_JSON_TABLE_NAME ] = obj.tableName();
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

    public static registerCreateFactory( className: string, factory: ()=>DroiObject ) {
        DroiObject.factoryies[ className ] = factory;
    }

    //
    protected perm : DroiPermission;
    protected properties : Dictionary = {};
    private mTableName : string;
    private dirtyFlags : number = DirtyFlag.DIRTY_FLAG_BODY;
    private static factoryies : Dictionary = {};
};

export { DroiObject, Guid };
