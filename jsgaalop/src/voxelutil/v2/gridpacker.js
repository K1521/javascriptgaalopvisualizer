
function mix(x,y,a){
  return x*(1-a)+y*a;
}

/*function mix(x,y,a){
  return x-(y-x)*a;
}*/


export class gridpacker{
    constructor(bounds=[[-1,1],[-1,1],[-1,1]],size=[65536+1,65536+1,65536+1]){
        [this.sizex,this.sizey,this.sizez]=size;
        [[this.minx,this.maxx],[this.miny,this.maxy],[this.minz,this.maxz]]=bounds;
    }

    xyztokey(x, y, z) {
        if (x < 0 || x >= this.sizex || y < 0 || y >= this.sizey || z < 0 || z >= this.sizez)
            throw new Error("vertex coordinate out of bounds");
        return (z * this.sizey + y) * this.sizex + x;
    }

    keytoxyz(key) {
        const x = key % this.sizex;
        const y = Math.floor(key / this.sizex) % this.sizey;
        const z = Math.floor(key / (this.sizey * this.sizex));
        return [x, y, z];
    }

    xyztocord(x,y,z){
        return [mix(this.minx,this.maxx,x/(this.sizex-1)),mix(this.miny,this.maxy,y/this.sizey),mix(this.minz,this.maxz,z/this.sizez)];
    }

    keytocord(key){
        return this.xyztocord(...this.keytoxyz(key));
    }


    
}

/*
    5      size
┌───────┐
0 1 2 3 4  vertex index
│ │ │ │ │
 0 1 2 3   cell index
*/
