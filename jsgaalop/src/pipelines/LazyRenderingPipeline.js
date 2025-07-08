

export class LazyRenderingPipeline{
  constructor(initFn) {
    this._initFn = initFn;
    this._initialized = false;
  }

  init() {
    if (!this._initialized) {
      this._initFn();
      this._initialized = true;
      return true;
    }
    return false;
  }
  render(ctx){
    throw new Error("method not implemented");
  }
  updateParams(ctx){
    throw new Error("method not implemented");
  }

  setRenderableObject(obj){
    this._obj=obj;
  }
  isTilable(){return false;}
}
