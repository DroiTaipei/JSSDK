import { DroiError } from "./droi-error"
import { DroiObject } from "./droi-object";
import { RestGroup } from "./rest/group";

export class DroiGroup extends DroiObject {

    private static readonly KEY_NAME = "Name";
    private static readonly KEY_USERS = "Users";
    private static readonly KEY_GROUPS = "Groups";

    static createGroup(name?: string): DroiGroup {
        name = name || "";
        return new DroiGroup(name);
    }

    private static getGroupIdByObjectId(type: number, objectId: string): Promise<Array<string>> {
        return RestGroup.instance().getGroupIdByObjectId(type, objectId);
    }

    static getGroupIdsByUserObjectId(objectId: string): Promise<Array<string>> {
        return DroiGroup.getGroupIdByObjectId(0, objectId);
    }

    static getGroupIdsByGroupObjectId(objectId: string): Promise<Array<string>> {
        return DroiGroup.getGroupIdByObjectId(1, objectId);
    }

    private fetchReady: boolean = false;

    protected constructor(name: string) {
        super("_Group");

        if (name) {
            this.Name = name;
        }
    }

    fetchRelation(): Promise<DroiError> {
        return RestGroup.instance().fetch(this.Name)
            .then( (json) => {
                let group = DroiGroup.fromJson(json);
                this.cloneFrom(group);
                this.fetchReady = true;
                return new DroiError(DroiError.OK);
            });
    }

    addUser(objectId: string): DroiError {
        return this.addData(DroiGroup.KEY_USERS, objectId);
    }

    removeUser(objectId: string) {
        this.removeData(DroiGroup.KEY_USERS, objectId);
    }

    addGroup(objectId: string): DroiError {
        return this.addData(DroiGroup.KEY_GROUPS, objectId);
    }

    removeGroup(objectId: string) {
        this.removeData(DroiGroup.KEY_GROUPS, objectId);
    }

    private addData(listName: string, objectId: string) {
        let users = this.getValue(listName);
        if (users == null) {
            users = [objectId];
            this.setValue(listName, users);
        }

        if (users.indexOf(objectId) >= 0)
            return new DroiError(DroiError.INVALID_PARAMETER, "User object id was already existed");

        users.push(objectId);
        this.setValue(listName, users);
    }

    private removeData(listName: string, objectId: string) {
        let users = this.getValue(listName);
        if (users == null)
            return;

        let index = users.indexOf(objectId);
        if (index < 0)
            return;

        users.splice(index, 1);
        this.setValue(listName, users);
    }

    get isReady(): boolean {
        return this.fetchReady;
    }

    get Name(): string {
        return this.getValue(DroiGroup.KEY_NAME);
    }

    set Name(name: string) {
        this.setValue(DroiGroup.KEY_NAME, name);
    }

    get userIdList(): string[] {
        let ids = this.getValue(DroiGroup.KEY_USERS);
        if (ids == null)
            return null;

        return JSON.parse(JSON.stringify(ids));
    }

    get groupIdList(): string[] {
        let ids = this.getValue(DroiGroup.KEY_GROUPS);
        if (ids == null)
            return null;

        return JSON.parse(JSON.stringify(ids));
    }
}