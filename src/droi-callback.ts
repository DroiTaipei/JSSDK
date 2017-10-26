import { DroiError } from "./droi-error"

export interface DroiCallback<T> {
    (result: T, error: DroiError);
}