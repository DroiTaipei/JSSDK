import { DroiConstant } from './droi-const';


/**
 * 
 */
class DroiPermission {
    public static copyFrom( perm: DroiPermission ): DroiPermission {
        let newInstance = new DroiPermission();
        newInstance.creator = perm.creator;
        newInstance.userPermission = perm.userPermission;
        newInstance.groupPermission = perm.groupPermission;
        newInstance.publicPermission = perm.publicPermission;
        return newInstance;
    }

    public static getDefaultPermission(): DroiPermission {
        return DroiPermission.defaultPermission;
    }

    public static setDefaultPermission( perm: DroiPermission ) {
        DroiPermission.defaultPermission = DroiPermission.copyFrom( perm );
    }

    public setUserReadPermission( id: string, flag: boolean ) {
        this.setPermission( true, id, DroiConstant.DROI_PERMISSION_READ, flag );
    }

    public setUserWritePermission( id: string, flag: boolean ) {
        this.setPermission( true, id, DroiConstant.DROI_PERMISSION_WRITE, flag );
    }

    public setGroupReadPermission( id: string, flag: boolean ) {
        this.setPermission( false, id, DroiConstant.DROI_PERMISSION_READ, flag );
    }

    public setGroupWritePermission( id: string, flag: boolean ) {
        this.setPermission( false, id, DroiConstant.DROI_PERMISSION_WRITE, flag );
    }

    public setPublicReadPermission( flag: boolean ) {
        if ( flag ) {
            this.publicPermission |= DroiConstant.DROI_PERMISSION_READ;
        } else {
            this.publicPermission &= ~DroiConstant.DROI_PERMISSION_READ;
        }        
    }

    public setPublicWritePermission( flag: boolean ) {
        if ( flag ) {
            this.publicPermission |= DroiConstant.DROI_PERMISSION_WRITE;
        } else {
            this.publicPermission &= ~DroiConstant.DROI_PERMISSION_WRITE;
        }        
    }

    private setPermission( isUser: boolean, id: string, mask: number, flag: boolean ): void {
        let obj = isUser?this.userPermission[id]:this.groupPermission[id];
        let permission = obj||0;

        if ( flag ) {
            permission |= mask;
        } else {
            permission &= ~mask;
        }
        if ( isUser ) 
            this.userPermission[id] = permission;
        else 
            this.groupPermission[id] = permission;
    }

    
    public setCreator(id: string) {
        this.creator = id;
    }

    public getCreator(): string {
        return this.creator;
    }

    public toJsonObject() {
        let dict = {};

        // Creator and Public R/W
        if ( this.creator ) 
            dict["creator"] = this.creator;
        if ( this.publicPermission&DroiConstant.DROI_PERMISSION_READ )
            dict["pr"] = true;
        if ( this.publicPermission&DroiConstant.DROI_PERMISSION_WRITE )
            dict["pw"] = true;

        // User Read/Write permission
        let permission = this.extractPermission( this.userPermission );
        if ( permission[0].length > 0 )
            dict["ur"] = permission[0];
        if ( permission[1].length > 0 )
            dict["uw"] = permission[1];

        // Group Read/Write permission
        permission = this.extractPermission( this.groupPermission );
        if ( permission[0].length > 0 )
            dict["gr"] = permission[0];
        if ( permission[1].length > 0 )
            dict["gw"] = permission[1];

        //
        return dict;
    }

    private extractPermission( perms ): [Array<string>, Array<string>] {
        let readPermission = [];
        let writePermission = [];
        for ( let userName in perms ) {
            let perm = perms[userName];
            if ( perm&DroiConstant.DROI_PERMISSION_READ )
                readPermission.push( userName );
            if ( perm&DroiConstant.DROI_PERMISSION_WRITE )
                writePermission.push( userName );
        }
        return [readPermission, writePermission];        
    }

    public static restorePermission( dict ): DroiPermission {
        let newInstance = new DroiPermission();

        // Creator and Public R/W
        if ( dict.hasOwnProperty("creator") ) {
            newInstance.creator = dict["creator"];
        }
        if ( dict.hasOwnProperty("pr") ) {
            newInstance.setPublicReadPermission( dict["pr"] );
        }
        if ( dict.hasOwnProperty("pw") ) {
            newInstance.setPublicWritePermission( dict["pw"] );
        }

        let setPermission = function ( propName:string, dict, callback: (userId, flag) => void ) {
            if ( dict.hasOwnProperty(propName) ) {
                for ( let name of dict[propName] ) {
                    callback( name, true );
                }
            }
        };

        // User Read/Write permission
        setPermission( "ur", dict, (id, flag) => {
            newInstance.setUserReadPermission(id, flag);
        } );

        setPermission( "uw", dict, (id, flag) => {
            newInstance.setUserWritePermission(id, flag);
        } );

        // Group Read/Write permission
        setPermission( "gr", dict, (id, flag) => {
            newInstance.setGroupReadPermission(id, flag);
        } );

        setPermission( "gw", dict, (id, flag) => {
            newInstance.setGroupWritePermission(id, flag);
        } );
        return newInstance;
    }

    private userPermission = {};
    private groupPermission = {};
    private creator: string;
    private publicPermission: number;

    //
    private static defaultPermission: DroiPermission;
};

export { DroiPermission };