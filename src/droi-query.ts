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
        this.queryCommand.put( DroiConstant.DroiQuery_TABLE_NAME, tableName );
    }

    run() : Promise<DroiError> {
        
        return;
    }

    count() : Promise<number> {
        if ( !this.queryCommand.containsKey( DroiConstant.DroiQuery_SELECT) ) {
            return new Promise( (resolve, reject) => {
                let err = new DroiError( DroiError.INVALID_PARAMETER, "Only support Query command");
                reject( err );
            });
        }

        this.queryCommand.put( DroiConstant.DroiQuery_COUNT, 1 );
        return new Promise( (resolve, reject) => {
            this.runQuery().then( (res) => {
                if ( res.length <= 0 )
                    reject( new DroiError( DroiError.ERROR ) );
                let counter = res[0];
                resolve(counter);
            }).catch( (err) => {
                reject(err);
            })
        });
    }

    runQuery() : Promise<Array<any>> {
        try {
            this.throwIfTheCommandInvalid();
        } catch ( e ) {
            return new Promise<Array<DroiObject>>( (resolve, reject) => {
                let err: DroiError = new DroiError( DroiError.ERROR, e.message );
                reject( err );
            });
        }

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
            
            return new Promise<Array<any>>( (resolve, reject) => callback );
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
        // 
        let tableName = this.queryCommand.getElement( DroiConstant.DroiQuery_TABLE_NAME, 0 );
        return tableName;
    }

    private throwIfTheCommandInvalid() {
        // Check whether the action is correct
        let actionList = [ DroiConstant.DroiQuery_SELECT, DroiConstant.DroiQuery_INSERT, DroiConstant.DroiQuery_DELETE, DroiConstant.DroiQuery_UPDATE, DroiConstant.DroiQuery_UPDATE_DATA ];
        let fs_counter = 0;
        for ( let action in actionList ) {
            if ( this.queryCommand.containsKey(action) ) {
                fs_counter++;
                this.queryAction = action;
            }
        }
        if ( fs_counter > 1 ) {
            throw "Your query needs only one of SELECT, DELETE, INSERT or UPDATE";
        } else if ( fs_counter == 0 ) {
            this.queryCommand.put( DroiConstant.DroiQuery_SELECT, "*" );
            this.queryAction = DroiConstant.DroiQuery_SELECT;
        }

        // Check whether Insertion operation is correct
        if ( this.queryCommand.containsKey( DroiConstant.DroiQuery_INSERT) && 
            (this.queryCommand.containsKey( DroiConstant.DroiQuery_OR) || this.queryCommand.containsKey( DroiConstant.DroiQuery_AND) ||
            this.queryCommand.containsKey( DroiConstant.DroiQuery_WHERE ) || this.queryCommand.containsKey( DroiConstant.DroiQuery_INC ) ||
            this.queryCommand.containsKey( DroiConstant.DroiQuery_DEC) || this.queryCommand.containsKey( DroiConstant.DroiQuery_SET ) ||
            this.queryCommand.containsKey( DroiConstant.DroiQuery_ADD ) ) ) {
                throw "Insert command cannot combine with OR/AND/WHERE command.";
            }

        if ( (this.queryCommand.containsKey( DroiConstant.DroiQuery_OR ) || this.queryCommand.containsKey( DroiConstant.DroiQuery_AND ) ) && !this.queryCommand.containsKey( DroiConstant.DroiQuery_WHERE ) ) {
            throw "Your query should one of WHERE statement for OR/AND statement."
        }

        if ( this.queryCommand.containsKey( DroiConstant.DroiQuery_UPDATE_DATA ) && this.queryCommand.containsKey( DroiConstant.DroiQuery_ADD ) 
            && this.queryCommand.containsKey( DroiConstant.DroiQuery_SET ) ) {
            throw "Your query must one update statement. (add / set)";
        }
    }
}

export { DroiQuery }