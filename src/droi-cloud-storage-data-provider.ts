import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { DroiUser } from "./droi-user";
import { MultimapEntry, Multimap } from "./droi-multimap"
import { DroiCallback, DroiSingleCallback } from "./droi-callback";
import { DroiDataProvider } from "./droi-data-provider";
import { DroiConstant } from "./droi-const"
import { RestObject, RestCRUD } from "./rest/object"
import { RestUser } from "./rest/user"
import { DroiCondition } from "./droi-condition"


class CloudStorageDataProvider implements DroiDataProvider {

    upsert( commands: Multimap<string, any> ): Promise<DroiError> {
        return null;
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

        let restHandler: RestCRUD;
        let objHandler: typeof DroiObject;

        if (tableName === "_User") {
            restHandler = RestUser.instance();
            objHandler = DroiUser;
        } else { 
            restHandler = RestObject.instance();
            objHandler = DroiObject;
        }
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
                    let dobj = objHandler.fromJson(jobj);
                    if (dobj == null)
                        throw new DroiError(DroiError.ERROR, `form droiobject fail. ${JSON.stringify(jobj)}`)
                    result.push(dobj);
                }
                return result;
            });
    }

    updateData( commands: Multimap<string, any> ): Promise<DroiError> {
        return null;
    }
    
    delete( commands: Multimap<string, any> ): Promise<DroiError> {
        return null;
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
                jcond[arr[1] as string] = arr.get[2];
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


export { CloudStorageDataProvider }