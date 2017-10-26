import { DroiError } from "./droi-error"

export default interface DroiCallback<T> {
    (result: T, error: DroiError);
}