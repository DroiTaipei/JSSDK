import { DroiError } from "./droi-error"
import { DroiPersistSettings } from "./droi-persist-settings";
import { RestPreference } from "./rest/preference"

export class DroiPreference {
    private static INSTANCE: DroiPreference = null;

    static instance(): DroiPreference {
        if (DroiPreference.INSTANCE == null)
            DroiPreference.INSTANCE = new DroiPreference();

        return DroiPreference.INSTANCE;
    }

    private map;
    private dataReady: boolean = false;

    private constructor() {
        // Load cache first
        let data = DroiPersistSettings.getItem(DroiPersistSettings.KEY_PREFERENCE);
        if (data != null) {
            this.map = JSON.parse(data);
        }
    }

    refresh(): Promise<DroiError> {
        this.dataReady = false;
        return RestPreference.instance().get().then( (json) => {
            this.dataReady = true;
            this.map = json;
            DroiPersistSettings.setItem(DroiPersistSettings.KEY_PREFERENCE, JSON.stringify(json));
            return new DroiError(DroiError.OK);
        }).catch( (error) => {
            this.dataReady = this.map != null;
            return error;
        });
    }

    getValue(key: string): any {
        return this.map[key];
    }
}