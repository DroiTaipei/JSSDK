export class RestUser {
    private static readonly REST_USER_URL = "/users/v2";
    private static readonly REST_HTTPS = "https://api.droibaas.com/rest";
    private static readonly REST_HTTPS_SECURE = "/droi";

    private static readonly REST_USER_LOGIN = "/login";

    static signupUser(userId: string, password: string, data: string): Promise<JSON> {
        return null;
    }

    static loginUser(userId: string, password: string): Promise<JSON> {
        return null;
    }
}