export class TupleMap {
  constructor() {
    this._root = new Map();
  }

  _getNode(path, create = false) {
    if (!Array.isArray(path)) throw new Error("Key must be an array");
    let node = this._root;
    for (const part of path) {
      if (!node.has(part)) {
        if (!create) return undefined;
        node.set(part, new Map());
      }
      node = node.get(part);
    }
    return node;
  }

  set(tuple, value) {
    const node = this._getNode(tuple, true);
    node.value = value;
  }

  get(tuple) {
    const node = this._getNode(tuple, false);
    return node?.value;
  }

  has(tuple) {
    const node = this._getNode(tuple, false);
    return node !== undefined && 'value' in node;
  }

  delete(tuple) {
    if (!Array.isArray(tuple)) throw new Error("Key must be an array");
    

    function deleterec(node, path) {
        if (path.length === 0) {
            if ('value' in node) {
                delete node.value;
                return true;
            }
            return false;
        }

        const [pathstart, ...pathrest] = path;
        if (!node.has(pathstart))return false;
        const childnode = node.get(pathstart);

        const found = deleterec(childnode, pathrest);

        // Prune the child if it's now empty
        if (!('value' in childnode) && childnode.size === 0) {
            node.delete(pathstart);
        }

        return found;
    }

    return deleterec(this._root, tuple);
  }

  clear() {
    this._root = new Map();
    }
}