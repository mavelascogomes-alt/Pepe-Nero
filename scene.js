/* Small, dependency-free WebGL still life. All geometry is created locally. */
(() => {
  const canvas = document.querySelector('.hero__canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) { canvas.parentElement.classList.add('scene-unavailable'); return; }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const vs = `attribute vec3 p; attribute vec3 n;
    uniform mat4 model; uniform mat4 projection;
    varying vec3 pos; varying vec3 normal;
    void main(){ vec4 world=model*vec4(p,1.); pos=world.xyz;
      normal=mat3(model)*n; gl_Position=projection*vec4(world.xyz-vec3(0.,0.,11.),1.); }`;
  const fs = `precision mediump float; varying vec3 pos; varying vec3 normal;
    uniform vec3 color; uniform float gloss;
    void main(){vec3 N=normalize(normal); if(!gl_FrontFacing) N=-N;
      vec3 L=normalize(vec3(-3.,5.,6.)-pos);
      vec3 R=normalize(vec3(4.,1.,-3.)-pos);
      vec3 V=normalize(vec3(0.,0.,11.)-pos);
      float diff=max(dot(N,L),0.); float rim=max(dot(N,R),0.);
      float spec=pow(max(dot(N,normalize(L+V)),0.),gloss);
      float grain=sin(pos.x*170.)*sin(pos.y*190.)*sin(pos.z*140.)*.018;
      vec3 c=color*(.16+diff*.8+rim*.30+grain)+vec3(1.,.77,.45)*spec*.48;
      c+=vec3(.15,.085,.035)*pow(1.-max(dot(N,V),0.),3.);
      gl_FragColor=vec4(pow(c,vec3(.88)),1.); }`;
  function shader(type, source) {
    const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vs)); gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  gl.useProgram(program); gl.enable(gl.DEPTH_TEST);
  const loc=Object.fromEntries(['model','projection','color','gloss'].map(k=>[k,gl.getUniformLocation(program,k)]));
  const pa=gl.getAttribLocation(program,'p'), na=gl.getAttribLocation(program,'n');
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const d=Math.hypot(...a)||1; return a.map(v=>v/d);};
  function mesh(fn, nu, nv) {
    const vertices=[], normals=[];
    function vertex(u,v){
      const p=fn(u,v), a=fn(u+.0001,v), b=fn(u,v+.0001);
      const n=norm(cross(a.map((x,i)=>x-p[i]),b.map((x,i)=>x-p[i])));
      vertices.push(...p); normals.push(...n);
    }
    for(let i=0;i<nu;i++) for(let j=0;j<nv;j++) {
      const u=i/nu,v=j/nv,U=(i+1)/nu,V=(j+1)/nv;
      vertex(u,v);vertex(U,v);vertex(u,V);vertex(u,V);vertex(U,v);vertex(U,V);
    }
    const upload=data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;};
    return {p:upload(vertices),n:upload(normals),count:vertices.length/3};
  }
  const sphere=mesh((u,v)=>{const a=u*Math.PI*2,b=v*Math.PI;return [Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];},32,20);
  const leaf=mesh((u,v)=>[(u-.5)*Math.sin(v*Math.PI)*.9, v-.5, .16*Math.sin(v*Math.PI)*(1-Math.pow(u*2-1,2))],12,18);
  const ribbon=mesh((u,v)=>{
    const t=u*Math.PI*2;
    const width=(v-.5)*.34;
    return [1.15*Math.sin(t)+.27*Math.sin(3*t)+width*Math.cos(t*2),
      1.85*Math.cos(t)+.13*Math.sin(3*t)+width*Math.sin(t*2),
      .63*Math.sin(2*t)+width*Math.cos(t*3)];
  },220,5);
  // Hollow, ridged pasta: connected outer wall, end rim, and inner wall.
  const tube=mesh((u,v)=>{
    const angle=u*Math.PI*2, phase=v*4;
    let radius,y;
    if(phase<1){radius=.20+.011*Math.cos(angle*18);y=phase*.78-.39;}
    else if(phase<2){radius=.20-(phase-1)*.065;y=.39;}
    else if(phase<3){radius=.135;y=.39-(phase-2)*.78;}
    else {radius=.135+(phase-3)*.065;y=-.39;}
    return [radius*Math.cos(angle)+.065*y*y,y,radius*Math.sin(angle)];
  },72,32);
  const objects=[];
  const add=(shape,position,rotation,scale,color,gloss=32,speed=1)=>objects.push({shape,position,rotation,scale,color,gloss,speed});
  const gold=[.77,.43,.13], green=[.07,.22,.055], red=[.57,.035,.012];
  add(ribbon,[.05,.1,0],[.15,-.25,-.42],[1,1,1],gold,38,.65);
  add(ribbon,[.05,.1,-.13],[.18,-.2,-.42],[.8,.94,.87],[.87,.54,.22],32,.7);
  add(ribbon,[.23,.1,.06],[.12,-.28,-.42],[1.15,1.04,.95],[.68,.36,.095],38,.55);
  [[-1.7,1.85,.5],[1.55,1.3,.3],[-1.25,-1.5,.5],[1.8,-1.7,0]].forEach((p,i)=>add(tube,p,[.7+i*.5,.4+i,.7+i],[.85,.85,.85],gold,26,1+i*.15));
  function tomato(p,s){
    add(sphere,p,[0,0,0],[s,s*.91,s],red,65,.6);
    for(let j=0;j<5;j++) add(leaf,[p[0],p[1]+s*.86,p[2]],[1.35,j*Math.PI*.4,0],[s*.7,s*.8,s*.7],green,24,.6);
  }
  tomato([1.3,-.85,.9],.34);tomato([-1.55,.55,.6],.24);tomato([1.6,2.1,-.7],.18);
  [[-.9,1.3,1.1],[1.5,.35,.5],[-1.7,-.7,-.2],[.5,-2.1,.3]].forEach((p,i)=>add(leaf,p,[.4+i*.5,.6,-1+i],[.95,1.05,.9],green,32,.65));
  const pepper=[[2,0,0],[-1.9,1.05,0],[.7,2.35,.1],[1,-2.1,.4],[-.9,-2,.5],[-2,.1,-.4],[1.9,-.6,.5]];
  pepper.forEach((p,i)=>add(sphere,p,[0,0,0],[.055,.06,.055],[.07,.052,.035],12,1+i*.1));
  function matrix(pos,rot,s) {
    const [x,y,z]=rot, a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
    return new Float32Array([(c*e)*s[0],(a*f+b*d*e)*s[0],(b*f-a*d*e)*s[0],0,
      (-c*f)*s[1],(a*e-b*d*f)*s[1],(b*e+a*d*f)*s[1],0,
      d*s[2],-b*c*s[2],a*c*s[2],0,...pos,1]);
  }
  let width=1,height=1,active=true,frame=0,time=0,last=0,px=0,py=0,tx=0,ty=0;
  function resize(){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
    width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
    const near=.1,far=40,f=1/Math.tan(34*Math.PI/360),aspect=width/height;
    gl.uniformMatrix4fv(loc.projection,false,new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]));
    draw();
  }
  function draw(){
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const t=motion.matches?0:time;
    for(const o of objects){
      const drift=motion.matches?0:Math.sin(t*.35*o.speed)*.045;
      const rot=[o.rotation[0]+py*.10,o.rotation[1]+px*.18+Math.sin(t*.2)*.035,o.rotation[2]+drift];
      const pos=[o.position[0]+px*.12,o.position[1]+Math.sin(t*.45*o.speed)*.045,o.position[2]];
      gl.uniformMatrix4fv(loc.model,false,matrix(pos,rot,o.scale)); gl.uniform3fv(loc.color,o.color);gl.uniform1f(loc.gloss,o.gloss);
      gl.bindBuffer(gl.ARRAY_BUFFER,o.shape.p);gl.enableVertexAttribArray(pa);gl.vertexAttribPointer(pa,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,o.shape.n);gl.enableVertexAttribArray(na);gl.vertexAttribPointer(na,3,gl.FLOAT,false,0,0);
      gl.drawArrays(gl.TRIANGLES,0,o.shape.count);
    }
    canvas.dataset.ready='true';
  }
  function tick(now){
    frame=0;if(!active||document.hidden||motion.matches)return;
    time+=Math.min((now-last)/1000,.05);last=now;px+=(tx-px)*.035;py+=(ty-py)*.035;
    draw();frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&active&&!document.hidden&&!motion.matches){last=performance.now();frame=requestAnimationFrame(tick);}}
  canvas.closest('.hero').addEventListener('pointermove',e=>{
    if(motion.matches||!finePointer.matches)return;const r=canvas.getBoundingClientRect();
    tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=(e.clientY-r.top)/r.height*2-1;
  },{passive:true});
  canvas.closest('.hero').addEventListener('pointerleave',()=>{tx=ty=0;});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e])=>{active=e.isIntersecting;start();}).observe(canvas);
  document.addEventListener('visibilitychange',start);
  motion.addEventListener('change',()=>{px=py=tx=ty=0;draw();start();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;canvas.parentElement.classList.add('scene-unavailable');});
  resize();start();
})();
