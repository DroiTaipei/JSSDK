
export class MultimapEntry<K, V> {
    constructor(readonly key: K, readonly value: V) {
    }
}

export interface Multimap<K, V> {
    clear(): void;
    containsKey(key: K): boolean;
    containsEntry(key: K, value: V): boolean;
    remove(key: K): boolean;
    entries: Array<MultimapEntry<K, V>>;
    get(key: K): Array<V>;
    getElement(key: K, index:number): V;
    put(key: K, value: V): void;
}

export class ArrayListMultimap<K, V> implements Multimap<K, V> {

    private _entries: Array<MultimapEntry<K, V>> = []

    public clear(): void {
        this._entries = []
    }

    public containsKey(key: K): boolean {
        return this._entries
            .filter(entry => entry.key == key)
            .length > 0
    }

    public containsEntry(key: K, value: V): boolean {
        return this._entries
            .filter(entry => entry.key == key && entry.value == value)
            .length > 0
    }

    public remove(key: K): boolean {
        let temp = this._entries
        this._entries = this._entries
            .filter(entry => {
                return entry.key != key
            })
        return temp.length != this._entries.length
    }

    public get entries(): Array<MultimapEntry<K, V>> {
        return this._entries
    }

    public get(key: K): Array<V> {
        return this._entries
            .filter(entry => entry.key == key)
            .map(entry => entry.value)
    }

    public getElement(key: K, index:number): V {
        let res = this.get( key );
        if ( res.length < index )
            return res[index];
        return null;
    }

    public put(key: K, value: V): void {
        this._entries.push(new MultimapEntry<K,V>(key, value))
    }
}

