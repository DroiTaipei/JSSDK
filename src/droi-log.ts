export enum LogLevel {
    Verbose = 0, Debug, Info, Warning, Error
}

export class DroiLog {
    static LOG_LEVEL = LogLevel.Debug;
    private static LOG_LEVEL_STR = ["V", "D", "I", "W", "E"];

    static setLogLevel(level: LogLevel) {
        DroiLog.LOG_LEVEL = level;
    }

    static getLogLevel(): LogLevel {
        return DroiLog.LOG_LEVEL;
    }

    static v(tag: string, msg: string) {
        DroiLog.log(LogLevel.Verbose, tag, msg);
    }

    static d(tag: string, msg: string) {
        DroiLog.log(LogLevel.Debug, tag, msg);
    }

    static i(tag: string, msg: string) {
        DroiLog.log(LogLevel.Info, tag, msg);
    }
    
    static w(tag: string, msg: string) {
        DroiLog.log(LogLevel.Warning, tag, msg);
    }

    static e(tag: string, msg: string) {
        DroiLog.log(LogLevel.Error, tag, msg);
    }

    private static log(level: LogLevel, tag: string, msg: string) {
        if (DroiLog.LOG_LEVEL > level)
            return;
        let levelStr = DroiLog.LOG_LEVEL_STR[level];
        console.log(`${new Date().toString()} ${levelStr}/${tag}: ${msg}`)
    }
 }