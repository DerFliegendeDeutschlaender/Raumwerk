import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';

export class MathScene {
  constructor(container,onSelect) {
    this.container=container; this.onSelect=onSelect; this.mode='3d'; this.height=15; this.wires=true; this.items=[]; this.hidden=new Set(); this.labels=[]; this.selected=null;
    this.scene=new THREE.Scene();
    this.camera=new THREE.OrthographicCamera(-10,10,8,-8,.01,2000);
    this.camera.up.set(0,0,1); this.camera.position.set(11,-15,12); this.camera.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    container.prepend(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minZoom=.02;this.controls.maxZoom=300;this.controls.enablePan=true;
    this.scene.add(new THREE.AmbientLight(0xffffff,2.1));
    const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(3,-4,10);this.scene.add(light);
    const fill=new THREE.DirectionalLight(0xe6eee0,1);fill.position.set(-5,3,-3);this.scene.add(fill);
    this.grid=new THREE.Group();this.axes=new THREE.Group();this.scene.add(this.grid,this.axes);this.makeGrid();
    this.root=new THREE.Group();this.scene.add(this.root);
    this.raycaster=new THREE.Raycaster();this.raycaster.params.Line.threshold=.11;this.raycaster.params.Points.threshold=.12;
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];});
    this.renderer.domElement.addEventListener('pointerup',e=>{
      if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;
      const r=container.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
      const hit=this.raycaster.intersectObjects(this.root.children,true).find(h=>h.object.userData.index!==undefined);
      if(hit)this.onSelect(hit.object.userData.index,hit.point);else this.onSelect(null);
    });
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.renderer.setAnimationLoop(()=>{this.controls.update();this.updateLabels();this.renderer.render(this.scene,this.camera);});
  }
  line(points,color,opacity=1){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));}
  makeGrid(){
    for(let n=-10;n<=10;n++){
      if(n!==0){this.grid.add(this.line([[n,-10,0],[n,10,0]],0xc9d4bd,n%5===0?.60:.34));this.grid.add(this.line([[-10,n,0],[10,n,0]],0xc9d4bd,n%5===0?.60:.34));}
    }
    this.axes.add(this.line([[-10,0,.002],[10,0,.002]],0xc3a99a,.75),this.line([[0,-10,.002],[0,10,.002]],0x9aaf91,.8),this.line([[0,0,-5],[0,0,7]],0xb2a5c7,.65));
    const labelRoot=document.querySelector('#axis-labels');
    for(const [axis,position,color] of [['x',[9.7,0,0],'#b28372'],['y',[0,9.7,0],'#7d956e'],['z',[0,0,6.7],'#9380b4']]){
      const el=document.createElement('span');el.className='axis-label axis-name';el.textContent=axis;el.style.color=color;labelRoot.append(el);this.labels.push({el,position:new THREE.Vector3(...position),axis});
    }
    for(let n=-8;n<=8;n+=2){if(!n)continue;for(const [position,axis]of [[[n,-.28,0],'x'],[[-.28,n,0],'y']]){const el=document.createElement('span');el.className='axis-label';el.textContent=n;labelRoot.append(el);this.labels.push({el,position:new THREE.Vector3(...position),axis,tick:true});}}
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);const aspect=w/h;this.camera.left=-this.height*aspect/2;this.camera.right=this.height*aspect/2;this.camera.top=this.height/2;this.camera.bottom=-this.height/2;this.camera.updateProjectionMatrix();}
  updateLabels(){const w=this.container.clientWidth,h=this.container.clientHeight;for(const l of this.labels){const p=l.position.clone().project(this.camera);l.el.style.left=(p.x+1)*w/2+'px';l.el.style.top=(1-p.y)*h/2+'px';l.el.hidden=!this.axes.visible||p.z>1||p.z< -1||Math.abs(p.x)>.96||Math.abs(p.y)>.91||(this.mode==='2d'&&l.axis==='z');}}
  view(mode,plane='xy'){
    this.mode=mode;const target=this.controls.target.clone();let direction;
    if(mode==='2d') {this.camera.up.set(0,1,0);direction=new THREE.Vector3(0,0,25);this.controls.enableRotate=false;}
    else{this.camera.up.set(0,0,1);direction=plane==='xz'?new THREE.Vector3(0,-25,0):plane==='yz'?new THREE.Vector3(25,0,0):new THREE.Vector3(11,-15,12);this.controls.enableRotate=true;}
    this.camera.position.copy(target).add(direction);this.camera.lookAt(target);this.controls.update();
  }
  disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});group.clear();}
  update(specs){
    const signature=specs.map(s=>s.kind+':'+s.name+':'+(s.positions?.length||s.paths?.map(p=>p.length).join(',')||s.vertices?.length||'')).join('|');
    if(signature===this.signature){
      specs.forEach((s,i)=>{const group=this.items[i];if(s.kind==='surface'){const mesh=group.children[0];this.updateSurface(mesh,s);const wire=group.children[1];if(wire){wire.geometry.dispose();wire.geometry=this.gridGeometry(s);wire.visible=this.wires&&!s.wireframe;}}
      else if(['plot','curve','segment'].includes(s.kind)){s.paths.filter(p=>p.length>1).forEach((p,j)=>{group.children[j].geometry.setFromPoints(p.map(v=>new THREE.Vector3(...v)));group.children[j].geometry.computeBoundingSphere();});}
      else if(s.kind==='point'){group.children[0].position.set(...s.position);group.children[0].scale.setScalar(Math.min(5,Math.max(.01,s.size)));}
      else if(s.kind==='scatter'){const points=group.children[0];points.geometry.setAttribute('position',new THREE.Float32BufferAttribute(s.positions,3));points.geometry.computeBoundingSphere();points.material.size=s.size;}
      else if(s.kind==='vector'){const a=new THREE.Vector3(...s.start),b=new THREE.Vector3(...s.end).sub(a),len=b.length();group.children[0].position.copy(a);group.children[0].setDirection(len>0?b.normalize():new THREE.Vector3(0,0,1));group.children[0].setLength(Math.max(.0001,len),Math.min(.35,len*.25),Math.min(.16,len*.1));}
      else if(s.kind==='polygon'){group.children[0].geometry.dispose();group.children[0].geometry=this.polygonGeometry(s);group.children[1].geometry.setFromPoints([...s.vertices,s.vertices[0]].map(v=>new THREE.Vector3(...v)));}
      else if(s.kind==='polyhedron'){const mesh=group.children[0];mesh.geometry.dispose();mesh.geometry=this.polyhedronGeometry(s);mesh.material.opacity=s.opacity;group.children[1].geometry.dispose();group.children[1].geometry=new THREE.EdgesGeometry(mesh.geometry,1);}
      const color=new THREE.Color(s.color);group.traverse(o=>{if(o.material?.color&&!o.userData.surfaceWire)o.material.color.copy(color);});
      group.visible=!this.hidden.has(s.name);group.userData.spec=s;});
    }else{
      this.disposeGroup(this.root);this.items=[];this.signature=signature;
      specs.forEach((s,i)=>{const group=new THREE.Group();group.userData.spec=s;
        if(s.kind==='surface'){
          const g=new THREE.BufferGeometry();const indices=[];const n=s.resolution;
          for(let j=0;j<n;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+1,c=a+n+1,d=c+1;if([a,b,c].every(v=>s.positions[v*3+2]!==null))indices.push(a,b,c);if([b,c,d].every(v=>s.positions[v*3+2]!==null))indices.push(b,d,c);}
          g.setIndex(indices);g.setAttribute('position',new THREE.Float32BufferAttribute(s.positions.map(x=>x??0),3));g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(s.positions.length),3));
          const material=new THREE.MeshPhongMaterial({color:s.color,vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:s.opacity,shininess:35,wireframe:s.wireframe,depthWrite:true});
          const mesh=new THREE.Mesh(g,material);this.updateSurface(mesh,s);group.add(mesh);
          const wire=new THREE.LineSegments(this.gridGeometry(s),new THREE.LineBasicMaterial({color:0x645a82,transparent:true,opacity:.18,depthWrite:false}));wire.userData.surfaceWire=true;wire.visible=this.wires&&!s.wireframe;group.add(wire);
        }else if(['plot','curve','segment'].includes(s.kind)){for(const p of s.paths.filter(p=>p.length>1))group.add(this.line(p,s.color));}
        else if(s.kind==='point'){const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshPhongMaterial({color:s.color,shininess:60}));m.scale.setScalar(Math.min(5,Math.max(.01,s.size)));m.position.set(...s.position);group.add(m);}
        else if(s.kind==='scatter'){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(s.positions,3));group.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:s.color,size:s.size,sizeAttenuation:false})));}
        else if(s.kind==='vector'){const a=new THREE.Vector3(...s.start),b=new THREE.Vector3(...s.end).sub(a),len=b.length();group.add(new THREE.ArrowHelper(len>0?b.normalize():new THREE.Vector3(0,0,1),a,Math.max(.0001,len),s.color,Math.min(.35,len*.25),Math.min(.16,len*.1)));}
        else if(s.kind==='polygon'){group.add(new THREE.Mesh(this.polygonGeometry(s),new THREE.MeshPhongMaterial({color:s.color,side:THREE.DoubleSide,transparent:true,opacity:s.opacity})),this.line([...s.vertices,s.vertices[0]],s.color));}
        else if(s.kind==='polyhedron'){const geometry=this.polyhedronGeometry(s);group.add(new THREE.Mesh(geometry,new THREE.MeshPhongMaterial({color:s.color,side:THREE.DoubleSide,transparent:true,opacity:s.opacity,flatShading:true,shininess:65})),new THREE.LineSegments(new THREE.EdgesGeometry(geometry,1),new THREE.LineBasicMaterial({color:s.color,transparent:true,opacity:.75})));}
        group.traverse(o=>{o.userData.index=i;});group.visible=!this.hidden.has(s.name);this.root.add(group);this.items.push(group);
      });
    }
    this.specs=specs;
  }
  updateSurface(mesh,s){
    const attr=mesh.geometry.getAttribute('position'),colors=mesh.geometry.getAttribute('color');
    let min=Infinity,max=-Infinity;for(let i=2;i<s.positions.length;i+=3)if(s.positions[i]!==null){min=Math.min(min,s.positions[i]);max=Math.max(max,s.positions[i]);}
    const low=new THREE.Color('#9abcc2'),high=new THREE.Color('#f0e5fa');
    for(let i=0;i<s.positions.length;i+=3){attr.setXYZ(i/3,s.positions[i],s.positions[i+1],s.positions[i+2]??0);const mix=max>min?(s.positions[i+2]-min)/(max-min):.5;const c=low.clone().lerp(high,mix);colors.setXYZ(i/3,c.r,c.g,c.b);}
    attr.needsUpdate=true;colors.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();mesh.material.opacity=Math.min(1,Math.max(0,s.opacity));
    // Domain holes can change during animation; rebuild triangle indices accordingly.
    const n=s.resolution,indices=[];for(let j=0;j<n;j++)for(let k=0;k<n;k++){const a=j*(n+1)+k,b=a+1,c=a+n+1,d=c+1;if([a,b,c].every(v=>s.positions[v*3+2]!==null))indices.push(a,b,c);if([b,c,d].every(v=>s.positions[v*3+2]!==null))indices.push(b,d,c);}mesh.geometry.setIndex(indices);
  }
  gridGeometry(s){const n=s.resolution,p=[];const step=Math.max(1,Math.round(n/30));const add=(a,b)=>{if(s.positions[a*3+2]===null||s.positions[b*3+2]===null)return;p.push(...s.positions.slice(a*3,a*3+3),...s.positions.slice(b*3,b*3+3));};for(let j=0;j<=n;j+=step)for(let k=0;k<n;k++)add(j*(n+1)+k,j*(n+1)+k+1);for(let k=0;k<=n;k+=step)for(let j=0;j<n;j++)add(j*(n+1)+k,(j+1)*(n+1)+k);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;}
  polygonGeometry(s){
    // Project a planar polygon onto its dominant plane for concave triangulation.
    const vertices=s.vertices.map(v=>new THREE.Vector3(...v)),normal=new THREE.Vector3();for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];normal.x+=(a.y-b.y)*(a.z+b.z);normal.y+=(a.z-b.z)*(a.x+b.x);normal.z+=(a.x-b.x)*(a.y+b.y);}
    const axis=['x','y','z'].sort((a,b)=>Math.abs(normal[b])-Math.abs(normal[a]))[0];const uv=vertices.map(v=>axis==='z'?new THREE.Vector2(v.x,v.y):axis==='y'?new THREE.Vector2(v.x,v.z):new THREE.Vector2(v.y,v.z));
    const g=new THREE.BufferGeometry().setFromPoints(vertices);g.setIndex(THREE.ShapeUtils.triangulateShape(uv,[]).flat());g.computeVertexNormals();return g;
  }
  polyhedronGeometry(s){const positions=[];for(const face of s.faces){const g=this.polygonGeometry({vertices:face.map(i=>s.vertices[i])});const attr=g.getAttribute('position');for(const index of g.index.array)positions.push(attr.getX(index),attr.getY(index),attr.getZ(index));g.dispose();}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;}
  fit(){
    const visible=this.root.children.filter(o=>o.visible);if(!visible.length)return;
    const box=new THREE.Box3();for(const o of visible)box.expandByObject(o);if(box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3());const direction=this.camera.position.clone().sub(this.controls.target).normalize();this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(direction,Math.max(25,box.getSize(new THREE.Vector3()).length()*2));this.camera.lookAt(center);this.camera.updateMatrixWorld();
    const inverse=this.camera.matrixWorldInverse;const projected=new THREE.Box3();for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])projected.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(inverse));const size=projected.getSize(new THREE.Vector3());const aspect=this.container.clientWidth/this.container.clientHeight;this.camera.zoom=this.height/Math.max(3,size.y*1.3,size.x/aspect*1.3);this.camera.far=Math.max(2000,this.camera.position.length()*4);this.camera.updateProjectionMatrix();this.controls.update();
  }
  setHidden(name,hidden){hidden?this.hidden.add(name):this.hidden.delete(name);this.items.forEach(o=>o.visible=!this.hidden.has(o.userData.spec.name));}
  setTheme(dark){this.grid.traverse(o=>{if(o.material)o.material.color.set(dark?'#506578':'#c9d4bd');});this.axes.children.forEach((o,i)=>o.material.color.set((dark?['#ba8b7f','#80b59c','#b1a0d6']:['#c3a99a','#9aaf91','#b2a5c7'])[i]));}
  setWire(value){this.wires=value;this.items.forEach(o=>{if(o.userData.spec.kind==='surface'&&o.children[1])o.children[1].visible=value&&!o.userData.spec.wireframe;});}
  serialize(){return{mode:this.mode,position:this.camera.position.toArray(),target:this.controls.target.toArray(),up:this.camera.up.toArray(),zoom:this.camera.zoom,hidden:[...this.hidden],grid:this.grid.visible,axes:this.axes.visible,wires:this.wires};}
  restore(v){if(!v)return;this.view(v.mode==='2d'?'2d':'3d');if(v.position?.length===3&&v.position.every(Number.isFinite))this.camera.position.fromArray(v.position);if(v.target?.length===3&&v.target.every(Number.isFinite))this.controls.target.fromArray(v.target);if(v.up?.length===3&&v.up.every(Number.isFinite))this.camera.up.fromArray(v.up);if(Number.isFinite(v.zoom))this.camera.zoom=Math.min(300,Math.max(.02,v.zoom));this.hidden=new Set(Array.isArray(v.hidden)?v.hidden:[]);this.grid.visible=v.grid!==false;this.axes.visible=v.axes!==false;this.setWire(v.wires!==false);this.camera.updateProjectionMatrix();this.controls.update();}
}
