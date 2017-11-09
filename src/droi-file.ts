import { DroiObject } from "./droi-object"
import { DroiError } from "./droi-error"
import { DroiCore } from "./droi-core"
import { Md5 } from 'ts-md5/dist/md5'
import { RestFile } from './rest/file'

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

        this.setValue( DroiFile.DROI_KEY_FILE_NAME, name );
        this.setValue( DroiFile.DROI_KEY_FILE_FID, 0 );

        if ( buffer != null ) {
            let md5 = new Md5().start().appendByteArray( buffer ).end();
            this.setValue( DroiFile.DROI_KEY_FILE_MD5, md5 );
            this.setValue( DroiFile.DROI_KEY_FILE_SIZE, buffer.length );
        } else {
            this.setValue( DroiFile.DROI_KEY_FILE_MD5, 0 );
            this.setValue( DroiFile.DROI_KEY_FILE_SIZE, buffer.length );
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
        return RestFile.instance().getUri( this.objectId );
    }

    update( buffer: Uint8Array, progress: (currentSize: number, totalSize: number) => void = null, mimeType: string = "application/octet-stream"): Promise< boolean > {
        // TODO:
        return;
    }

    save(progress: (currentSize: number, totalSize: number) => void = null): Promise<DroiError> {
        // TODO
        return;
    }

    delete():Promise<DroiError> {
        return RestFile.instance().delete( this.objectId );
    }        

    isContentDirty(): boolean {
        return this.contentDirty
    }

    private contentDirty: boolean = true;
}


export { DroiFile };