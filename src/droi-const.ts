
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
    static readonly DROI_KEY_HTTP_TOKEN = "X-Droi-Session-Token";

    // USER
    static readonly DROI_API_USER_NOT_EXISTS = 1040009;
    static readonly DROI_API_RECORD_CONFLICT = 1030305;
    static readonly DROI_API_USER_EXISTS = 1040008;

    //
    static readonly DROI_PERMISSION_READ = 2;
    static readonly DROI_PERMISSION_WRITE = 1;

    // DroiQuery
    static readonly DroiQuery_SELECT = "select";
    static readonly DroiQuery_INSERT = "insert";
    static readonly DroiQuery_DELETE = "delete";
    static readonly DroiQuery_UPDATE = "update";
    static readonly DroiQuery_UPDATE_DATA = "updateData";
    static readonly DroiQuery_TABLE_NAME = "tableName";
    static readonly DroiQuery_COUNT = "count";

    static readonly DroiQuery_WHERE = "where";
    static readonly DroiQuery_COND = "cond";
    static readonly DroiQuery_VALUES = "values";
    static readonly DroiQuery_OR = "$or";
    static readonly DroiQuery_AND = "$and";

    static readonly DroiQuery_INC = "inc";
    static readonly DroiQuery_DEC = "dec";
    static readonly DroiQuery_SET = "set";
    static readonly DroiQuery_ATOMIC = "amotic";
    static readonly DroiQuery_ADD = "add";

    static readonly DroiQuery_ORDERBY = "orderby";
    static readonly DroiQuery_ASC = "ASC";
    static readonly DroiQuery_DESC = "DESC";

    static readonly DroiQuery_LIMIT = "limit";
    static readonly DroiQuery_OFFSET = "offset";    

    static readonly DroiCondition_LT = "$lt";
    static readonly DroiCondition_LT_OR_EQ = "$lte";
    static readonly DroiCondition_EQ = "$eq";
    static readonly DroiCondition_NEQ = "$ne";
    static readonly DroiCondition_GT_OR_EQ = "$gte";
    static readonly DroiCondition_GT = "$gt";
    static readonly DroiCondition_ISNULL = "$exists";
    static readonly DroiCondition_ISNOTNULL = "ISNOTNULL";
    static readonly DroiCondition_CONTAINS = "$contains";
    static readonly DroiCondition_NOTCONTAINS = "$notContains";
    static readonly DroiCondition_STARTSWITH = "$starts";
    static readonly DroiCondition_NOTSTARTSWITH = "$notStarts";
    static readonly DroiCondition_ENDSWITH = "$ends";
    static readonly DroiCondition_NOTENDSWITH = "$notEnds";
    static readonly DroiCondition_IN = "$in";
    static readonly DroiCondition_NOTIN = "$nin";    
}

export { DroiConstant };