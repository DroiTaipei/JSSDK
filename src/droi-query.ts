import { DroiError } from "./droi-error";
import { DroiObject } from "./droi-object";
import { MultimapEntry, ArrayListMultimap as Multimap } from "./droi-multimap"
import { DroiConstant } from './droi-const';
import { DroiCondition } from './droi-condition';
import { DroiCallback, DroiSingleCallback } from "./droi-callback";
import { CloudStorageDataProvider } from "./droi-cloud-storage-data-provider"

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
        this.throwIfTheCommandInvalid();

        let dp = (this.getTableName() == "_User" || "_Group" )?null:CloudStorageDataProvider.create();
        if ( this.queryAction == DroiConstant.DroiQuery_UPDATE_DATA ) {
            // TODO
        } else {
            this.queryCommand.remove( DroiConstant.DroiQuery_SET );
            this.queryCommand.remove( DroiConstant.DroiQuery_ATOMIC );
            this.queryCommand.remove( DroiConstant.DroiQuery_ADD );
            this.queryCommand.remove( DroiConstant.DroiQuery_UPDATE_DATA );

            //
            let callback = null;

            switch( this.queryAction ) {
                case DroiConstant.DroiQuery_SELECT:
                    callback = (resolve, reject) => {
                        dp.query( this.queryCommand ).then( res => {
                            resolve( res );
                        }).catch( (droiError) => {
                            reject( droiError );
                        });
                    };
                    break;
                case DroiConstant.DroiQuery_INSERT:
                case DroiConstant.DroiQuery_UPDATE:                    
                    callback = (resolve, reject) => {
                            dp.upsert( this.queryCommand ).then( () => {
                                resolve( null );
                            }).catch( (droiError) => {
                                reject( droiError );
                            });
                        };
                        break;
                case DroiConstant.DroiQuery_DELETE:
                    callback =  (resolve, reject) => {
                        dp.delete( this.queryCommand ).then( () => {
                            resolve( null );
                        }).catch( (droiError) => {
                            reject( droiError );
                        });
                    };
                    break;
            }
            
            return new Promise<Array<DroiObject>>( (resolve, reject) => callback );
        }
    }

    //
    where( cond: DroiCondition ) : DroiQuery {
        if ( this.queryCommand.containsKey(DroiConstant.DroiQuery_WHERE)) {
            throw "There is WHERE condition object in command queue.";
        }

        this.queryCommand.put( DroiConstant.DroiQuery_WHERE, cond );
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

    private getTableName(): string {
        // TODO
        return "";
    }

    private throwIfTheCommandInvalid() {
        // TODO
    }
}

export { DroiQuery }