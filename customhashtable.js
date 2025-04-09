
class myHashtable {
    constructor() {
        this.buckets = new Map();
        this.size = 0;
    }

    get(key) {
        const hash = getHashCode(key);
        const bucket = this.buckets.get(hash);
        if (!bucket) return undefined;

        for (const { key: k, value } of bucket) {
            if (k.equals(key)) {
                return value;
            }
        }

        return undefined;
    }

    set(key, value) {
        const hash = getHashCode(key);
        let bucket = this.buckets.get(hash);

        if (!bucket) {
            bucket = [];
            this.buckets.set(hash, bucket);
        }

        for (const kv of bucket) {
            if (kv.key.equals(key)) {
                kv.value = value;
                return;
            }
        }

        bucket.push({ key, value });
        this.size++;
    }

    delete(key) {
        const hash = getHashCode(key);
        const bucket = this.buckets.get(hash);
        if (!bucket) return false;

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].key.equals(key)) {
                bucket.splice(i, 1);
                this.size--;
                if (bucket.length === 0) {
                    this.buckets.delete(hash); // Clean up empty buckets
                }
                return true;
            }
        }

        return false;
    }

    has(key) {
        const hash = getHashCode(key);
        const bucket = this.buckets.get(hash);
        if (!bucket) return false;
    
        for (const { key: k } of bucket) {
            if (k.equals(key)) {
                return true;
            }
        }
    
        return false;
    }
}

function getHashCode(obj) {
    if (obj instanceof myHashable) {
        return obj.hash();
    } else if (typeof obj === 'string') {
        return cyrb53(obj);
    } else if (typeof obj === 'number') {
        return obj;
    } else {
        throw new Error("Unsupported type for hashing");
    }
}


class myHashable{
    constructor() {
        this.hashcodecache = undefined;
    }
    equals(other) {
        throw new Error("equals() not implemented");
    }
    hash(){
        if (this.hashcodecache === undefined) {
            this.hashcodecache = this.hashCode();
        }
        return this.hashcodecache;
    }
    hashCode() {
        throw new Error("hashCode() not implemented");
    }
}



function cyrb53(str, seed = 0){
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}


class FrozenList extends myHashable {
    constructor(array) {
        super();
        this.array = array;
    }


}