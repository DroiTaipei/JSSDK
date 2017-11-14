import { DroiError } from "./droi-error"

export class DroiPreference {
    private static INSTANCE: DroiPreference = null;

    static instance(): DroiPreference {
        if (DroiPreference.INSTANCE == null)
            DroiPreference.INSTANCE = new DroiPreference();

        return DroiPreference.INSTANCE;
    }

    private map: JSON;

    refresh(): Promise<DroiError> {
        return null;
    }

    getValue(key: string): any {
        return this.map[key];
    }
}