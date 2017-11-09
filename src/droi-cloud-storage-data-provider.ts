import { DroiError } from "./droi-error";
import { DroiUser } from "./droi-user";
import { DroiObject } from "./droi-object";
import { MultimapEntry, Multimap } from "./droi-multimap"
import { DroiCallback, DroiSingleCallback } from "./droi-callback";
import { DroiDataProvider } from "./droi-data-provider";
import { DroiConstant } from "./droi-const"
import { RestObject, RestCRUD } from "./rest/object"
import { RestUser } from "./rest/user"
import { DroiCondition } from "./droi-condition"


export class CloudStorageDataProvider implements DroiDataProvider {

    async upsert( commands: Multimap<string, any> ): Promise<DroiError> {

        let error = new DroiError(DroiError.OK);
        let obj = commands.getElement(DroiConstant.DroiQuery_INSERT, 0)[0] as DroiObject;

        // Travel all reference objects
        // !!NOTE!! do not do async/await in travelDroiObject callback. 
        let referenceObjs: Array<DroiObject> = [];
        DroiObject.travelDroiObject(obj, (dobj) => {
            if ( obj == dobj )
                return;
            referenceObjs.push(dobj);
        });

        for (let dobj of referenceObjs) {
            if (dobj.isDirty)
                await dobj.save();
        }

        // Not dirty, return OK directly
        if (!obj.isDirty()) {
            return Promise.resolve(error);
        }

        let tableName = commands.getElement(DroiConstant.DroiQuery_TABLE_NAME, 0);
        let restHandler: RestCRUD = (tableName === RestUser.TABLE_NAME) ? RestUser.instance() : RestObject.instance();

        return restHandler.upsert(obj.toJson(), obj.objectId(), tableName).then( 
            (isOk) => {
                return new DroiError(DroiError.OK);
            });
    }
    
    query( commands: Multimap<string, any> ): Promise<Array<DroiObject>> {
        let tableName: string = null;

        let res: Array<DroiObject> = [];
        if (commands.containsKey(DroiConstant.DroiQuery_SELECT)) {
            let list = commands.get(DroiConstant.DroiQuery_SELECT);
            if (list == null || list.length != 1)
                throw new DroiError(DroiError.INVALID_PARAMETER, "No table name in query.");
            tableName = list[0];
        }

        let restHandler: RestCRUD = (tableName === RestUser.TABLE_NAME) ? RestUser.instance() : RestObject.instance();

        let where = this.generateWhere(commands);
        let order = this.generateOrder(commands);
        let offset = NaN;
        let limit = NaN;

        if (commands.containsKey(DroiConstant.DroiQuery_OFFSET))
            offset = commands.get(DroiConstant.DroiQuery_OFFSET)[0];
        if (commands.containsKey(DroiConstant.DroiQuery_LIMIT))
            limit = commands.get(DroiConstant.DroiQuery_LIMIT)[0]; 

        return restHandler.query(tableName, where, offset, limit, order).then(
            (jResult) => {
                let result: Array<DroiObject> = [];
                for (let jobj of jResult) {
                    let dobj = DroiObject.fromJson(jobj);
                    if (dobj == null)
                        throw new DroiError(DroiError.ERROR, `form droiobject fail. ${JSON.stringify(jobj)}`)
                    result.push(dobj);
                }
                return result;
            });
    }

    updateData( commands: Multimap<string, any> ): Promise<DroiError> {
        let error = new DroiError(DroiError.OK);
        let isAtomic = commands.containsKey(DroiConstant.DroiQuery_ATOMIC);
        let tableName = commands.getElement(DroiConstant.DroiQuery_TABLE_NAME, 0);

        let restHandler: RestCRUD = (tableName === RestUser.TABLE_NAME) ? RestUser.instance() : RestObject.instance();

        if (isAtomic) {
            let obj = commands.getElement(DroiConstant.DroiQuery_ATOMIC, 0) as DroiObject;
            let list = commands.getElement(DroiConstant.DroiQuery_ADD, 0);
            let data = {};
            data[list[0]] = list[1];
            return RestObject.instance().atomicAdd(tableName, obj.objectId(), data)
                .then( (_) => {
                    return new DroiError(DroiError.OK);
                });
        } else {
            let listAdd = commands.get(DroiConstant.DroiQuery_ADD);
            let listSet = commands.get(DroiConstant.DroiQuery_SET);
            let jcmd: {[key: string]: any} = {};

            if (listAdd != null) {
                for (let list of listAdd) {
                    jcmd[list[0]] = {"__op": "Increment", "amount": list[1]};
                }
            } else if (listSet != null) {
                for (let list of listSet) {
                    jcmd[list[0]] = list[1];
                }
            }

            if (Object.keys(jcmd).length == 0) {
                throw new DroiError(DroiError.INVALID_PARAMETER, "No set / add in updating");
            }

            let where = this.generateWhere(commands);
            let order = this.generateOrder(commands);
            let offset = NaN;
            let limit = NaN;
    
            if (commands.containsKey(DroiConstant.DroiQuery_OFFSET))
                offset = commands.get(DroiConstant.DroiQuery_OFFSET)[0];
            if (commands.containsKey(DroiConstant.DroiQuery_LIMIT))
                limit = commands.get(DroiConstant.DroiQuery_LIMIT)[0];     

            return restHandler.updateData(tableName, JSON.stringify(jcmd), where, offset, limit, order)
                .then( (_) => {
                    return new DroiError(DroiError.OK);
                });
        }
    }
    
    delete( commands: Multimap<string, any> ): Promise<DroiError> {
        let error = new DroiError(DroiError.OK);
        let obj = commands.getElement(DroiConstant.DroiQuery_DELETE, 0)[0] as DroiObject;

        // Not dirty, return OK directly
        if (!obj.isDirty()) {
            return Promise.resolve(error);
        }

        let tableName = commands.getElement(DroiConstant.DroiQuery_TABLE_NAME, 0);
        let restHandler: RestCRUD = (tableName === RestUser.TABLE_NAME) ? RestUser.instance() : RestObject.instance();

        return restHandler.delete(obj.objectId(), tableName).then( 
            (isOk) => {
                return new DroiError(DroiError.OK);
            });
    }

    private generateWhere(commands: Multimap<string, any>): string {
        if (!commands.containsKey(DroiConstant.DroiQuery_WHERE))
            return null;

        let cond: DroiCondition = commands.get(DroiConstant.DroiQuery_WHERE)[0];
        let jobj: {[key: string]:any} = {};
        if (cond.type === DroiConstant.DroiQuery_COND) {
            let jcond: {[key: string]:any} = {};
            let arr = cond.conditions[0];
            arr = this.convertArgumentsFormat(arr);
            if (arr.length < 3) {
                let type = arr[1] as string;
                if (type === DroiConstant.DroiCondition_ISNULL)
                    jcond[type] = false;
                else if (type === DroiConstant.DroiCondition_ISNOTNULL)
                    jcond[DroiConstant.DroiCondition_ISNULL] = true;
            } else {
                jcond[arr[1] as string] = arr[2];
            }
            jobj[arr[0] as string] = jcond;
        } else {
            jobj = this.travel( cond );
        }
        return JSON.stringify(jobj);
    }

    private generateOrder(commands: Multimap<string, any>): string {
        if (!commands.containsKey(DroiConstant.DroiQuery_ORDERBY))
            return null;

        let list = commands.get(DroiConstant.DroiQuery_ORDERBY);
        let sb = "";

        for (let obj of list) {
            let subList = obj as Array<string>;
            if (subList[1] === DroiConstant.DroiQuery_DESC)
                sb = sb + "-";
            sb = sb + `${subList[0]},`
        }
    
        return sb.substring(0, sb.length-1);
    }

    private travel(cond: DroiCondition): {[key: string]: any} {
        let res: {[key: string]: any} = {};

        let type = cond.type;
        let conditions = cond.conditions;

        if (type === DroiConstant.DroiQuery_COND) {
            let args = conditions[0];
            args = this.convertArgumentsFormat(args);
            let jcond: {[key: string]: any} = {};
            if (args.length < 3) {
                let condtype = args[1] as string;
                if (condtype === DroiConstant.DroiCondition_ISNULL)
                    jcond[condtype] = false;
                else if (condtype === DroiConstant.DroiCondition_ISNOTNULL)
                    jcond[DroiConstant.DroiCondition_ISNULL] = true;
            } else {
                jcond[args[1] as string] = args[2];
            }
            res[args[0] as string] = jcond;
        } else {
            let values = [];
            for (let subItem of conditions) {
                if (subItem instanceof Array)
                    values.push(subItem);
                else
                    values.push(this.travel(subItem as DroiCondition));
            }
            res[type] = values;
        }

        return res;
    }

    private convertArgumentsFormat(arr: Array<any>): Array<any> {
        if (arr.length < 3)
            return arr;
        let arg = arr[2];
        if (arg instanceof Date)
            arr[2] = (arg as Date).toISOString();
        
        return arr;
    }

    private static instance : CloudStorageDataProvider;
    static create() : CloudStorageDataProvider {
        if ( CloudStorageDataProvider.instance == null )
            CloudStorageDataProvider.instance = new CloudStorageDataProvider();

        return CloudStorageDataProvider.instance;
    }
}

