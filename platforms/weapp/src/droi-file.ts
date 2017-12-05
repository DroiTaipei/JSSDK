import { DroiObject } from "./droi-object"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { Md5 } from 'ts-md5/dist/md5'
import { RestFile } from './rest/file'
import { DroiConstant } from "./droi-const";
import { DroiLog } from "./droi-log"

declare var wx: any;

interface WxFileInfo {
    digest: string;
    size: number;
}

function wxGetFileMd5(path: string): Promise<WxFileInfo> {
    return new Promise( ( resolve, reject ) => {
        wx.getFileInfo( {
            filePath: path,
            success: (res) => {
                resolve({digest: res.digest, size: res.size});
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}

class DroiFile extends DroiObject {
    static createEmptyFile(): DroiFile {
        let df = new DroiFile();
        df.newFile = false;

        let name = "DroiFile-".concat(df.objectId());
        df.contentPath = null;
        df.contentDirty = true;

        //
        df.setValue( DroiFile.DROI_KEY_FILE_NAME, name );
        df.setValue( DroiFile.DROI_KEY_FILE_FID, 0 );

        df.setValue( DroiFile.DROI_KEY_FILE_MD5, 0 );
        df.setValue( DroiFile.DROI_KEY_FILE_SIZE, 0 );

        return df;
    }

    static async createFile( path: string = null, name: string = null ): Promise<DroiFile> {
        let df: DroiFile = new DroiFile();

        try {
            await df.init( path, name );
        } catch ( err ) {
            return Promise.reject( err );
        }

        // Reset newFile flag
        if ( path == null && name == null )
            df.newFile = false;
        return df;
    }

    private static readonly DROI_KEY_FILE_NAME = "Name";
    private static readonly DROI_KEY_FILE_MD5 = "MD5";
    private static readonly DROI_KEY_FILE_SIZE = "Size";
    private static readonly DROI_KEY_FILE_FID = "Fid";
    private static readonly DROI_KEY_FILE_EXTRA = "_MongoDmd";


    private constructor() {
        super( "_File" );
    }

    private async init( path: string = null, name: string = null ): Promise<boolean> {
        name = name || "DroiFile-".concat(this.objectId());
        this.contentPath = path;
        this.contentDirty = true;

        //
        this.setValue( DroiFile.DROI_KEY_FILE_NAME, name );
        this.setValue( DroiFile.DROI_KEY_FILE_FID, 0 );

        if ( path != null ) {
            let info = await wxGetFileMd5(path);
            this.setValue( DroiFile.DROI_KEY_FILE_MD5, info.digest );
            this.setValue( DroiFile.DROI_KEY_FILE_SIZE, info.size );
        } else {
            this.setValue( DroiFile.DROI_KEY_FILE_MD5, 0 );
            this.setValue( DroiFile.DROI_KEY_FILE_SIZE, 0 );
        }

        return Promise.resolve(true);
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

    getUris( forceUpdate: boolean ): Promise< Array<string> > {
        // Return value from Dmd extra data set
        if ( !forceUpdate) {
            let Dmd = this.getValue(DroiFile.DROI_KEY_FILE_EXTRA);
            if ( Dmd !== undefined && Dmd !== null ) {
                let uri = Dmd["CDN"];
                if ( uri !== undefined )
                    return Promise.resolve( [uri] );
            }
        }        
        
        return RestFile.instance().getUri( this.objectId() );
    }

    async update( path: string, progress: (currentSize: number, totalSize: number) => void = null, mimeType: string = "application/octet-stream"): Promise< DroiError > {
        if ( path == null || path.length == 0 ) {
            return Promise.reject( new DroiError( DroiError.ERROR, "The file path is empty.") );
        }

        let md5: string = null;
        let size: number = 0;

        try {
            let info = await wxGetFileMd5( path );
            md5 = info.digest;
            size = info.size;
        } catch ( err ) {
            return Promise.reject( err );
        }

        if ( md5 == this.MD5 ) {
            return Promise.resolve( new DroiError( DroiError.OK ) );
        }

        this.contentPath = path;

        this.contentDirty = true;

        //
        this.setValue( DroiFile.DROI_KEY_FILE_MD5, md5 );
        this.setValue( DroiFile.DROI_KEY_FILE_SIZE, size );
        
        return this.save( progress );
    }

    async save(progress: (currentSize: number, totalSize: number) => void = null): Promise<DroiError> {
        // Check whether the parameter is correct..
        if ( this.contentDirty && (this.contentPath == null || this.contentPath.length == 0) ) {
            return Promise.reject( new DroiError( DroiError.ERROR, "The file path is empty.") );
        }

        try {
            let error = await this.saveInternal( this.contentPath, progress );
            if ( error.isOk == false ) {
                return Promise.reject( error );
            }

            this.newFile = false;
            this.contentDirty = false;
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

    private async saveInternal( path: string, progress: (currentSize: number, totalSize: number) => void ): Promise< DroiError > {
        if ( path == null || path.length == 0 ) {
            return Promise.reject( new DroiError( DroiError.ERROR, "File content is empty. (No update)"));
        }

        if ( this.contentDirty == false ) {
            return Promise.resolve( new DroiError( DroiError.OK ) );
        }

        // Get upload token from DroiBaaS
        try {
            let tokenResults = await RestFile.instance().getUploadToken( this.objectId(), this.Name, "application/octet-stream", this.Size, this.MD5, this.newFile );

            //
            let fileToken = tokenResults["Token"];
            let uploadUrl = tokenResults["UploadUrl"];
            let sessionId = tokenResults["SessionId"];
            if ( tokenResults["Id"] !== undefined ) {
                DroiLog.d(DroiFile.LOG_TAG, "Replace by new Id: " + tokenResults["Id"] );
                this.setObjectId( tokenResults["Id"] );
            }
            

            // Upload data to CDN
            DroiLog.d( DroiFile.LOG_TAG, "Upload data to CDN" );
            let response = await RestFile.instance().upload( uploadUrl, fileToken, sessionId, this.objectId(), this.Name, this.contentPath, progress );

            //
            let result = JSON.parse(response.data).Result;
            if ( result["FId"] !== undefined ) {
                this.setValue( DroiFile.DROI_KEY_FILE_FID, result["FId"] );
            }

            if ( result["CDN"] !== undefined ) {
                let Dmd = { "CDN":result["CDN"] };
                this.setValue( DroiFile.DROI_KEY_FILE_EXTRA, Dmd );
                DroiLog.d( DroiFile.LOG_TAG, "The CDN link is " + result["CDN"] );
            }

            this.contentDirty = false;
            return Promise.resolve( new DroiError( DroiError.OK ) );
        } catch( e ) {
            DroiLog.e( DroiFile.LOG_TAG, " There is an error." + e );
            return Promise.reject( e );
        }

    }

    private contentDirty: boolean = true;
    private contentPath: string = null;
    private newFile: boolean = true;
    private static readonly LOG_TAG: string = "DroiFile";
}


export { DroiFile };