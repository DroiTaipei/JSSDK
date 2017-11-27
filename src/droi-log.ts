export enum LogLevel {
    Verbose = 0, Debug, Info, Warning, Error
}

export class DroiLog {
    private static LOG_LEVEL = LogLevel.Error;
    private static ISCOLOR = true;
    private static COLORS_16_MAP = ["1;37", "1;34", "1;32", "33", "31"];

    private static LOG_LEVEL_STR = ["V", "D", "I", "W", "E"];

    static setLogLevel(level: LogLevel) {
        DroiLog.LOG_LEVEL = level;
    }

    static getLogLevel(): LogLevel {
        return DroiLog.LOG_LEVEL;
    }

    static enableColor() {
        DroiLog.ISCOLOR = true;
    }

    static disableColor() {
        DroiLog.ISCOLOR = false;
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
        let outmsg = `${new Date().toString()} ${levelStr}/${tag}: ${msg}`;
        if (DroiLog.ISCOLOR) {
            let color = DroiLog.COLORS_16_MAP[level];
            outmsg = `\x1b[${color}m${outmsg}\x1b[0;37m`;
        }
        console.log(outmsg);
    }
 }