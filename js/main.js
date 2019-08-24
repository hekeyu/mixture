var canvas = document.getElementById("canvas");
var gl = canvas.getContext('webgl');
canvas.width =  window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);
var view = LookAt(0, 0, 5, 0, 0, 0, 0, 1, 0); 
var proj = SetPerspective(90, canvas.width / canvas.height,0.1, 500);
var rotate = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var vpMatrix = multiply(view, proj);
   
var Star = function(gl) { 
    
	this.program = createProgram(gl, "starVertex", "starFragment");
	var vertices = [];
   
   for(var i = 0; i < 100; i++)
      vertices.push(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);

   
   
  var verticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  this.draw = function(u_MvpMatrix){ 
    gl.useProgram(this.program); 
   
  	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  	gl.vertexAttribPointer(this.program.a_Position, 3, gl.FLOAT, false, 0, 0);  
  	gl.enableVertexAttribArray(this.program.a_Position);
 
    gl.uniformMatrix4fv(this.program.u_MvpMatrix, false, u_MvpMatrix);
    gl.uniform1i(this.program.u_Sampler, 1);  
   
 // 	gl.drawElements(gl.POINTS, indices.length, gl.UNSIGNED_BYTE, 0); 
  	gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
  }
} 

var Star2 = function(gl) {  
    
	this.program = createProgram(gl, "star2Vertex", "star2Fragment");
	var vertices = new Float32Array([   // Coordinates
      -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0
	]);
 
	var indices = new Uint8Array([
	     0, 1, 2,   0, 2, 3,     
	 ]);
  var verticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  createTexture(gl, 1, 1); 
   
  this.draw = function(){
    gl.useProgram(this.program); 
   
  	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  	gl.vertexAttribPointer(this.program.a_Position, 2, gl.FLOAT, false, 0, 0);  
  	gl.enableVertexAttribArray(this.program.a_Position);
    
  	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.uniform1i(this.program.u_Sampler, 0);  
   gl.uniform1i(this.program.u_Test, 1);  
  	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0); 
  }
} 


var fbo = new createFBO(gl, 0, canvas.width, canvas.height);

 
var star = new Star(gl);
var star2 = new Star2(gl);

function tick(){
	
    vpMatrix = multiply(rotateY(0.5), vpMatrix);
 
gl.enable(gl.BLEND);
gl.blendFunc( gl.SRC_ALPHA, gl.DST_ALPHA);  
fbo.enable();
gl.clear(gl.COLOR_BUFFER_BIT); 
star.draw(vpMatrix);
fbo.disable();

gl.disable(gl.BLEND);  
 gl.clear(gl.COLOR_BUFFER_BIT);
 star2.draw();
 requestAnimationFrame(tick);
}

tick()
