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
        return this;
    }

    orderBy( fieldName:string, ascending:boolean ) : DroiQuery {
        return this;
    }

    limit( limitSize:number ) : DroiQuery {
        return this;
    }

    offset( position:number ) : DroiQuery {
        return this;
    }

    add( field:string, amount:number ) : DroiQuery {
        return this;
    }

    set( field:string, value:number ) : DroiQuery {
        return this;
    }
}

export { DroiQuery }