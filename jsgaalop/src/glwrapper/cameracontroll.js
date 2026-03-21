import { Matrix,Vector } from "../util/linalg1.js";
function radians(degrees){return degrees*Math.PI/180;}


export class Cameracontroll{
    constructor(canvas,gl,_onChange=null){
        //todo replace gl with this.gl
      this.fov=120;
      this.canvas=canvas;
      this.colorpicker=true;
      this.c2w=Matrix.eye(3);
      this.cameraPos = new Vector([0,0,0]);
      this.basecampos = new Vector([0,0,0]);
      this.gl=gl;
      this.mouse = {
        x: undefined,
        y: undefined,
        left: false,  
        right: false, 
        middle: false
      };
      this.keysPressed = {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false,
        shift: false,
        space: false
      };

      this.initeventlisteners()

      this.onChange = _onChange;
    }

    set onChange(callback) {
      this._onChange = callback;
      this.camChanged();
    }

    camChanged(){
      this._onChange?.();
    }

    mousemove(event){
      const rect = this.canvas.getBoundingClientRect();
      const xcord=event.clientX - rect.left;
      const ycord=event.clientY - rect.top;
      //const dx=xcord-mouse.x;
      //const dy=event.clientY-mouse.y;
      if(this.mouse.x===undefined){
        this.mouse.x=xcord;
        this.mouse.y=ycord;
      }
  
      if(this.mouse.left){
        
        const width=rect.right-rect.left;
        const height=rect.bottom-rect.top;
        const fovfactor=1/Math.tan(radians(this.fov)/2);
        
        const u= c=>(2.0*c-width)/width;//cords between [-1,1]
        const v= c=>(2.0*c-height)/width;
        const uangle=(Math.atan(u(xcord)/fovfactor)-Math.atan(u(this.mouse.x)/fovfactor));
        const vangle=(Math.atan(v(ycord)/fovfactor)-Math.atan(v(this.mouse.y)/fovfactor));
  
  
        this.c2w=this.c2w.mul(Matrix.rotationMatrix(new Vector([0,-1,0]),uangle).mul(
            Matrix.rotationMatrix(new Vector([-1,0,0]),vangle)));
        this.camChanged();
      }
  
      this.mouse.x = xcord;
      this.mouse.y = ycord;
    }
  
    mousedown(event){
      // Update mouse button states
      if (event.button === 0) this.mouse.left = true;    // Left button
      if (event.button === 1) this.mouse.middle = true;  // Middle button
      if (event.button === 2) this.mouse.right = true;   // Right button
  
      if(this.colorpicker){
        const x = event.clientX*(this.canvas.width/this.canvas.clientWidth);//in css pix
        const y = (this.canvas.clientHeight - event.clientY)*(this.canvas.height/this.canvas.clientHeight); // Flip Y since WebGL has (0,0) at bottom-left
        const pixels = new Uint8Array(4); // RGBA
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        const color = `rgb(${(pixels[0]/255).toFixed(3)}, ${(pixels[1]/255).toFixed(3)}, ${(pixels[2]/255).toFixed(3)}, ${(pixels[3]/255).toFixed(3)})    rgb(${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]})    (${pixels[0]-128}, ${pixels[1]-128}, ${pixels[2]-128}, ${pixels[3]-128})`;
        console.log(color); // Display the color in console or UI
         console.log(x,y);
      }
    }
  
    mouseup(event){
      // Update mouse button states
      if (event.button === 0) this.mouse.left = false;
      if (event.button === 1) this.mouse.middle = false;
      if (event.button === 2) this.mouse.right = false;
    }
  
    keydown(event){
      if (event.key === ' ') {  // Space key
        this.keysPressed.space = true;
      }else{
        this.keysPressed[event.key.toLowerCase()]=true;
      }
    }
  
    keyup(event){
      if (event.key === ' ') {  // Space key
        this.keysPressed.space = false;
      }else{
        this.keysPressed[event.key.toLowerCase()]=false;
      }
    }
  
    initeventlisteners(){
      // Bind event listener functions to maintain 'this' context
      this.mousemove = this.mousemove.bind(this);
      this.mousedown = this.mousedown.bind(this);
      this.mouseup = this.mouseup.bind(this);
      this.keydown = this.keydown.bind(this);
      this.keyup = this.keyup.bind(this);
  
      window.addEventListener('mousemove', this.mousemove);
      this.canvas.addEventListener('mousedown', this.mousedown);//uses canvas because moving on other elements shouldnt influence the camera
      window.addEventListener('mouseup', this.mouseup);
      window.addEventListener('keydown',this.keydown);
      window.addEventListener('keyup',this.keyup);
    }
    update(deltatime){
      const posold=this.cameraPos;

      this.c2w=this.c2w.orthogonalize();//orthogonalize only against precision errors. probably unnessesary
      let movementfactor=deltatime*4;
      let deltapos=new Vector([0,0,0]);
      if(this.keysPressed.shift)movementfactor*=0.1;
      if(this.keysPressed.space)movementfactor*=5;
      if(this.keysPressed.a)deltapos=deltapos.add(new Vector([-1,0,0]));
      if(this.keysPressed.d)deltapos=deltapos.add(new Vector([1,0,0]));
      if(this.keysPressed.s)deltapos=deltapos.add(new Vector([0,0,-1]));
      if(this.keysPressed.w)deltapos=deltapos.add(new Vector([0,0,1]));
      if(this.keysPressed.x)deltapos=deltapos.add(new Vector([0,1,0]));
      if(this.keysPressed.y)deltapos=deltapos.add(new Vector([0,-1,0]));
      this.basecampos = this.basecampos.add(this.c2w.mul(deltapos.mul(movementfactor)));
      
      if(this.keysPressed.q){
        this.c2w=this.c2w.mul(Matrix.rotationMatrix(new Vector([0,1,0]),radians(-movementfactor*30)));
        this.camChanged();
      };
      if(this.keysPressed.e){
        this.c2w=this.c2w.mul(Matrix.rotationMatrix(new Vector([0,1,0]),radians(movementfactor*30)));
        this.camChanged();
      };
      

      if(this.keysPressed.f){
        if(this.rollAngle===null){this.rollAngle = 0;}
        const speed=this.keysPressed.space?9:3;
        const radius=this.keysPressed.shift?0.2:1;
        this.rollAngle+=deltatime*speed;

        this.cameraPos = this.basecampos.add(this.c2w.mul(new Vector([Math.cos(this.rollAngle),Math.sin(this.rollAngle),0]).mul(radius)));
        this.camChanged();
      }else {
        this.rollAngle = null;
        this.cameraPos = this.basecampos;
      }


      if(posold.sub(this.cameraPos).length()>0){
        this.camChanged();
      }

    }
    updateuniforms(shader){
      const cameraPosLocation = shader.getUniformLocation('cameraPos');
      shader.gl.uniform3fv(cameraPosLocation, this.cameraPos.array);
      const c2wLocation = shader.getUniformLocation("cameraMatrix");
      shader.gl.uniformMatrix3fv(c2wLocation, true, new Float32Array(this.c2w.array.flat()));
    }

    resizeCanvas(scale = 1.0) {
      const canvas = this.canvas;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(canvas.clientWidth * dpr * scale);
      const height = Math.floor(canvas.clientHeight * dpr * scale);
      canvas.width = width;
      canvas.height = height;
      return [width, height];
    }

}
