import { DroiObject } from "./droi-object"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { Md5 } from 'ts-md5/dist/md5'
import { RestFile } from './rest/file'
import { DroiConstant } from "./droi-const";

class DroiFile extends DroiObject {
    static createFile(buffer: Uint8Array = null, name: string = null, mimeType: string = "application/octet-stream"): DroiFile {
        let df: DroiFile = new DroiFile( buffer, name, mimeType );
        return df;
    }

    private static readonly DROI_KEY_FILE_NAME = "Name";
    private static readonly DROI_KEY_FILE_MD5 = "MD5";
    private static readonly DROI_KEY_FILE_SIZE = "Size";
    private static readonly DROI_KEY_FILE_FID = "Fid";
    private static readonly DROI_KEY_FILE_EXTRA = "_MongoDmd";


    private constructor( buffer: Uint8Array, name: string = null, mimeType: string = "application/octet-stream" ) {
        super( "_File" );

        name = name || "DroiFile-".concat(this.objectId());
        this.contentBuffer = buffer;
        this.contentDirty = true;
        this.mimeType = mimeType;

        //
        this.setValue( DroiFile.DROI_KEY_FILE_NAME, name );
        this.setValue( DroiFile.DROI_KEY_FILE_FID, 0 );

        if ( buffer != null ) {
            let md5 = new Md5().start().appendByteArray( buffer ).end();
            this.setValue( DroiFile.DROI_KEY_FILE_MD5, md5 );
            this.setValue( DroiFile.DROI_KEY_FILE_SIZE, buffer.length );
        } else {
            this.setValue( DroiFile.DROI_KEY_FILE_MD5, 0 );
            this.setValue( DroiFile.DROI_KEY_FILE_SIZE, 0 );
        }
    }

    get Size(): number {
        let size = this.getValue( DroiFile.DROI_KEY_FILE_SIZE );
        return Number( size );
    }

    get MD5(): string {
        return this.getValue( DroiFile.DROI_KEY_FILE_MD5 );
    }

    get Name(): string {
        return this.getValue( DroiFile.DROI_KEY_FILE_NAME );
    }

    getUris(): Promise< Array<string> > {
        return RestFile.instance().getUri( this.objectId() );
    }

    update( buffer: Uint8Array, progress: (currentSize: number, totalSize: number) => void = null, mimeType: string = "application/octet-stream"): Promise< DroiError > {
        // TODO
        return;
    }

    async save(progress: (currentSize: number, totalSize: number) => void = null): Promise<DroiError> {
        // Check whether the parameter is correct..
        if ( this.contentDirty && (this.contentBuffer == null || this.contentBuffer.length == 0) ) {
            return Promise.reject( new DroiError( DroiError.ERROR, "The size is zero.") );
        }

        try {
            let error = await this.saveInternal( this.contentBuffer, progress );
            if ( error.isOk == false ) {
                return Promise.reject( error );
            }

            return await super.save();
            //
        } catch (e) {
            return Promise.reject( e );
        }
    }

    delete():Promise<DroiError> {
        return RestFile.instance().delete( this.objectId() );
    }        

    isContentDirty(): boolean {
        return this.contentDirty
    }

    private async saveInternal( buffer: Uint8Array, progress: (currentSize: number, totalSize: number) => void ): Promise< DroiError > {
        // TODO:
        if ( buffer == null || buffer.length == 0 ) {
            return Promise.reject( new DroiError( DroiError.ERROR, "File content is empty. (No update)"));
        }

        if ( this.contentDirty == false ) {
            return Promise.resolve( new DroiError( DroiError.OK ) );
        }

        // Get upload token from DroiBaaS
        try {
            let tokenResults = await RestFile.instance().getUploadToken( this.objectId(), this.Name, this.mimeType, this.Size, this.MD5 );

            //
            let fileToken = tokenResults["Token"];
            let uploadUrl = tokenResults["UploadUrl"];
            let sessionId = tokenResults["SessionId"];
            if ( tokenResults["Id"] !== undefined ) {
                console.log("Id: " + tokenResults["Id"] );
                this.setValue( DroiConstant.DROI_KEY_JSON_OBJECTID, tokenResults["Id"] )
            }
            

            // Upload data to CDN
            let response = await RestFile.instance().upload( uploadUrl, fileToken, sessionId, this.objectId(), this.Name, this.mimeType, this.contentBuffer, progress );

            //
            let result = JSON.parse(response.data).Result;
            if ( result["FId"] !== undefined ) {
                this.setValue( DroiFile.DROI_KEY_FILE_FID, result["FId"] );
            }

            if ( result["CDN"] !== undefined ) {
                // _MongoDmd = new HashMap<String, Object>();
                // if ( tmp != null ) {
                //     _MongoDmd.put( "CDN", tmp );
                // }

                let Dmd = { "CDN":result["CDN"] };
                this.setValue( DroiFile.DROI_KEY_FILE_EXTRA, Dmd );
            }

            this.contentDirty = false;
            return Promise.resolve( new DroiError( DroiError.OK ) );
        } catch( e ) {
            console.log(" There is an error." + e );
            return Promise.reject( e );
        }

    }

    private contentDirty: boolean = true;
    private contentBuffer: Uint8Array = null;
    private mimeType: string;
}


export { DroiFile };