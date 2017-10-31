
class DroiConstant {
    static readonly DROI_KEY_JSON_CLASSNAME = "_ClassName";
    static readonly DROI_KEY_JSON_TABLE_NAME = "_TableName";
    static readonly DROI_KEY_JSON_OBJECTID = "_Id";
    static readonly DROI_KEY_JSON_CREATION_TIME = "_CreationTime";
    static readonly DROI_KEY_JSON_MODIFIED_TIME = "_ModifiedTime";
    static readonly DROI_KEY_JSON_DATA_TYPE = "_DataType";
    static readonly DROI_KEY_JSON_FILE_TYPE = "_FileType";
    static readonly DROI_KEY_JSON_KEY = "_DataKey";
    static readonly DROI_KEY_JSON_VALUE = "_DataValue";
    static readonly DROI_KEY_JSON_VALUE_SET = "_ValueSet";
    static readonly DROI_KEY_JSON_BYTE_ARRAY = "_ByteArray";
    static readonly DROI_KEY_JSON_REFERENCE_TYPE = "_ReferenceType";
    static readonly DROI_KEY_JSON_REFERENCE_VALUE = "_Object";
    static readonly DROI_KEY_JSON_REFERENCE_DIRTY_FLAG = "_ReferenceDirtyFlag";
    static readonly DROI_KEY_JSON_PERMISSION = "_ACL";
    static readonly DROI_KEY_JSON_OBJECT_VALUE = "_Value";

    // HTTP
    static readonly DROI_KEY_HTTP_APP_ID = "X-Droi-AppID";
    static readonly DROI_KEY_HTTP_DEVICE_ID = "X-Droi-DeviceID";
    static readonly DROI_KEY_HTTP_API_KEY = "X-Droi-Api-Key";

    // USER
    static readonly DROI_API_USER_NOT_EXISTS = 1040009;

    //
    static readonly DROI_PERMISSION_READ = 2;
    static readonly DROI_PERMISSION_WRITE = 1;
}

export { DroiConstant };