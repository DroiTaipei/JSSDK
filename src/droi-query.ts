import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { MultimapEntry, ArrayListMultimap as Multimap } from "./droi-multimap"
import { DroiConstant } from './droi-const';
import { DroiCallback, DroiSingleCallback } from "./droi-callback";

class DroiQuery {
    protected queryCommand: Multimap<string, any>;
    protected queryAction: string;
    
    static create( tableName : string ) : DroiQuery {
        return new DroiQuery( tableName );
    }

    protected constructor( tableName : string ) {
        this.queryCommand = new Multimap<string,any>();
        //
        this.queryCommand.put( DroiConstant.DroiQuery_SELECT, tableName );
    }

    run( callback? : DroiSingleCallback ) : Promise<DroiError> {
        
        return;
    }

    count() : Promise<number> {
        return;
    }

    runQuery() : Promise<Array<DroiObject>> {
        return;
    }

    //
    where( arg1:string, opType:string, arg2:string ) : DroiQuery {
        if ( this.queryCommand.containsKey(DroiConstant.DroiQuery_WHERE)) {
            throw "There is WHERE condition object in command queue.";
        }

       // this.queryCommand.put( DroiConstant.DroiQuery_WHERE, cond );
        return this;
    }

    orderBy( fieldName:string, ascending:boolean ) : DroiQuery {
        this.queryCommand.put( DroiConstant.DroiQuery_ORDERBY, [fieldName, ascending?DroiConstant.DroiQuery_ASC:DroiConstant.DroiQuery_DESC] );
        return this;
    }

    limit( limitSize:number ) : DroiQuery {
        if ( this.queryCommand.containsKey(DroiConstant.DroiQuery_LIMIT)) {
            throw "There is LIMIT condition object in command queue.";
        }

        this.queryCommand.put( DroiConstant.DroiQuery_LIMIT, limitSize );
        return this;
    }

    offset( position:number ) : DroiQuery {
        if ( this.queryCommand.containsKey(DroiConstant.DroiQuery_OFFSET)) {
            throw "There is OFFSET condition object in command queue.";
        }

        this.queryCommand.put( DroiConstant.DroiQuery_OFFSET, position );
        return this;
    }

    add( field:string, amount:number ) : DroiQuery {
        this.queryCommand.put( DroiConstant.DroiQuery_ADD, [field, amount] );
        return this;
    }

    set( field:string, value:number ) : DroiQuery {
        this.queryCommand.put( DroiConstant.DroiQuery_SET, [field, value] );
        return this;
    }
}

export { DroiQuery }