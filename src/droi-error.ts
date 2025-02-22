/**
 * Errors for DroiBaaS JS SDK.
 * 
 * @export
 * @class DroiError
 */
export class DroiError {
    static readonly OK: number = 0;
    static readonly UNKNOWN_ERROR = 1070000;
    static readonly ERROR = 1070001;
    static readonly USER_NOT_EXISTS = 1070002;
    static readonly USER_PASSWORD_INCORRECT = 1070003;
    static readonly USER_ALREADY_EXISTS = 1070004;
    static readonly NETWORK_NOT_AVAILABLE = 1070005;
    static readonly USER_NOT_AUTHORIZED = 1070006;
    static readonly SERVER_NOT_REACHABLE = 1070007;
    static readonly HTTP_SERVER_ERROR = 1070008;
    static readonly SERVICE_NOT_ALLOWED = 1070009;
    static readonly SERVICE_NOT_FOUND = 1070010;
    static readonly INTERNAL_SERVER_ERROR = 1070011;
    static readonly INVALID_PARAMETER = 1070012;
    static readonly NO_PERMISSION = 1070013;
    static readonly USER_DISABLE = 1070014;
    static readonly EXCEED_MAX_SIZE = 1070015;
    static readonly FILE_NOT_READY = 1070016;
    static readonly CORE_NOT_INITIALIZED = 1070017;
    static readonly USER_CANCELED = 1070018;
    static readonly BANDWIDTH_LIMIT_EXCEED = 1070019;
    static readonly APPLICATION_ID_UNCORRECTED = 1070101;
    static readonly NATIVE_LIBRARY_NOT_LOADED = 1070103;
    static readonly DROI_SECURE_NOT_SUPPORT = 1070104;
    static readonly TIME_UNCORRECTED = 1070201;
    static readonly TIMEOUT = 1070202;
    static readonly USER_ALREADY_LOGIN = 1070301;
    static readonly USER_CONTACT_HAD_VERIFIED = 1070302;
    static readonly USER_CONTACT_EMPTY = 1070303;
    static readonly USER_FUNCTION_NOT_ALLOWED = 1070304;
    static readonly FIELD_NOT_FOUND = 1070401;
    static readonly READ_CACHE_FAILED = 1070501;
    static readonly UPLOAD_FAILED = 1070502;
    private static readonly MESSAGES: {[key: number]: string} = DroiError.fillMessages();

    private _code: number;
    private _ticket: string;
    private _appendMessage: string;

    private static fillMessages(): {[key: number]: string} {
        let result: {[key: number]: string} = {};

        result[DroiError.OK] = "OK.";
        result[DroiError.UNKNOWN_ERROR] = "Unknown error.";
        result[DroiError.ERROR] = "Error.";
        result[DroiError.USER_NOT_EXISTS] = "User is not exists.";
        result[DroiError.USER_PASSWORD_INCORRECT] = "Password is not correct.";
        result[DroiError.USER_ALREADY_EXISTS] = "User is already exists.";
        result[DroiError.NETWORK_NOT_AVAILABLE] = "Network is not available.";
        result[DroiError.USER_NOT_AUTHORIZED] = "User is not authorized.";
        result[DroiError.SERVER_NOT_REACHABLE] = "Server is not reachable.";
        result[DroiError.HTTP_SERVER_ERROR] = "Error happened in Server side.";
        result[DroiError.SERVICE_NOT_ALLOWED] = "Service is not allowed.";
        result[DroiError.SERVICE_NOT_FOUND] = "Service is not found.";
        result[DroiError.INTERNAL_SERVER_ERROR] = "Internal server error.";
        result[DroiError.INVALID_PARAMETER] = "Invalid parameters.";
        result[DroiError.USER_DISABLE] = "User is in disable state.";
        result[DroiError.EXCEED_MAX_SIZE] = "Exceed max size.";
        result[DroiError.FILE_NOT_READY] = "File is not ready.";
        result[DroiError.CORE_NOT_INITIALIZED] = "DroiBaaS SDK is not initialized.";
        result[DroiError.USER_CANCELED] = "User is canceled.";
        result[DroiError.BANDWIDTH_LIMIT_EXCEED] = "Bandwidth limit exceed.";
        result[DroiError.TIME_UNCORRECTED] = "Incorrected time, please correct time first.";
        result[DroiError.APPLICATION_ID_UNCORRECTED] = "Incorrected application id.";
        result[DroiError.TIMEOUT] = "Network timeout.";
        result[DroiError.USER_ALREADY_LOGIN] = "Already logged in a valid user.";
        result[DroiError.USER_CONTACT_HAD_VERIFIED] = "User contact had verified.";
        result[DroiError.USER_CONTACT_EMPTY] = "User contact is empty.";
        result[DroiError.USER_FUNCTION_NOT_ALLOWED] = "The function is not allowed for current user.";
        result[DroiError.READ_CACHE_FAILED] = "Read cache fail.";
        result[DroiError.UPLOAD_FAILED] = "Upload file failed.";
        result[DroiError.FIELD_NOT_FOUND] = "Field not found.";
        result[DroiError.NATIVE_LIBRARY_NOT_LOADED] = "Native plugin is not loaded.";
        result[DroiError.DROI_SECURE_NOT_SUPPORT] = "The current runtime not support DroiSecure";

        return result;
    }

    /**
     * Creates an instance of DroiError.
     * @param {number} code Error code
     * @param {string} [msg] Appended message
     * @param {string} [ticket] Server ticket
     * @memberof DroiError
     */
    constructor(code: number, msg?: string, ticket?: string) {
        this._code = code;
        this._appendMessage = msg || "";
        this._ticket = ticket || "";
    }

    /**
     * Error code
     * 
     * @type {number}
     * @memberof DroiError
     */
    get code(): number {
        return this._code;
    }

    /**
     * Set error code
     * 
     * @memberof DroiError
     */
    set code(v: number) {
        this._code = v;
    }

    /**
     * Server ticket
     * 
     * @type {string}
     * @memberof DroiError
     */
    get ticket(): string {
        return this._ticket;
    }

    /**
     * Set server ticket
     * 
     * @memberof DroiError
     */
    set ticket(v: string) {
        this._ticket = v;
    }

    /**
     * Appended message
     * 
     * @type {string}
     * @memberof DroiError
     */
    get appendMessage(): string {
        return this._appendMessage;
    }

    /**
     * Set appended message
     * 
     * @memberof DroiError
     */
    set appendMessage(v: string) {
        this._appendMessage = v;
    }

    /**
     * Check result
     * 
     * @readonly
     * @type {boolean}
     * @memberof DroiError
     */
    get isOk(): boolean {
        return this._code == 0;
    }

    /**
     * Format error string
     * 
     * @returns {string} 
     * @memberof DroiError
     */
    toString(): string {
        let message = DroiError.MESSAGES[this._code];
        if (!message)
            message = `Error code: ${this._code}`;

        if (this._ticket != "")
            message = `${message} Ticket: ${this._ticket}`;

        if (this._appendMessage != "")
            message = `${message} ${this._appendMessage}`;

        return message;
    }
}
