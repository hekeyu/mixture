var HashIndex = function(gl){ 
	  //  gl.viewport(0, 0, 200, 200);
		this.program = createProgram(gl, "hashIndexVertex", "hashIndexFragment");

		this.fbo = new createFBO(gl, 0, 128, 128);
	this.drawHashIndexTable = function(data){
		  gl.useProgram(this.program);
		 	gl.viewport(0, 0, 128, 128);   
		  var colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.atomIndex), gl.STATIC_DRAW);
		  gl.vertexAttribPointer(this.program.a_Color, 2, gl.FLOAT, false, 0, 0);
		  gl.enableVertexAttribArray(this.program.a_Color); 
      	  
		  var verticesBuffer = gl.createBuffer();
		  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
		  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.buckethash), gl.STATIC_DRAW);
		  gl.vertexAttribPointer(this.program.a_Position, 2, gl.FLOAT, false, 0, 0);  
		  gl.enableVertexAttribArray(this.program.a_Position);
      gl.uniform1f(this.program.u_Size, 2.0 / 128.0);
        
      this.fbo.enable();
		  gl.drawArrays(gl.POINTS, 0, data.atomIndex.length / 2);
	    this.fbo.disable();
	}	
}

var AtomAttribute = function(gl){
	this.program = createProgram(gl, "atomAttributeVertex", "atomAttributeFragment");
	this.fbo = new createFBO(gl, 1, 1024, 64); 
	this.drawAtomAttributePool = function(data){
		  gl.useProgram(this.program);
      gl.viewport(0, 0, 1024, 64);

      var colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.atomAttributePool), gl.STATIC_DRAW);
		  gl.vertexAttribPointer(this.program.a_Color, 3, gl.FLOAT, false, 0, 0);
		  gl.enableVertexAttribArray(this.program.a_Color); 
      	    
		  var verticesBuffer = gl.createBuffer();
		  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
		  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.atomAttributePos), gl.STATIC_DRAW);
		  gl.vertexAttribPointer(this.program.a_Position, 2, gl.FLOAT, false, 0, 0);  
		  gl.enableVertexAttribArray(this.program.a_Position);
      gl.uniform1f(this.program.u_SizeX, 2.0 / 2048);
	    gl.uniform1f(this.program.u_SizeY, 2.0 / 64);
	    
	    this.fbo.enable();
		  gl.drawArrays(gl.POINTS, 0, data.atomAttributePos.length / 2);
      this.fbo.disable();
	}	
}

var num_Bucket = 16384;	 	  //128 * 128
var cell = 13;     //在x, y, z方向网格划分的块数量
var CELL_SIZE = 2.0 / cell;     //每个cell的空间
var INV_CELL_SIZE = cell;

function hash(point){

  var hashmap = new Vector(11113.0, 12979.0, 13513.0);
  var discrete = point.add(100.0).multiply(INV_CELL_SIZE);
  discrete.floor();
  var result = discrete.multiply(hashmap);
  return (Math.abs(result.x) + Math.abs(result.y) + Math.abs(result.z)) % num_Bucket;
}

function makeData(){
	var hashindex_dim = 128;                           //Hash Index Table width
	var count = 0;
//////////////////////////////////////////////////////////////////////////////////
  var d = 15;
  var h = 15;
  var r = 1;
  var points = []; 
  var perD = Math.PI * 2 / d;
  var perH = Math.PI / h;
  points.push(0, 0, 1);
  points.push(0, 0, -1);
  for(var i = 0; i <d; i++){

  	for(var j = 1; j < h; j++){	
  		 points.push(r * Math.cos(i * perD) * Math.sin(j * perH),
  		             r * Math.sin(i * perD) * Math.sin(j * perH),
  		             r * Math.cos(j * perH)); 
  	}
  }			 
//////////////////////////////////////////////////////////////////////////////////
            var bucket = {};      //存储点的坐标值
            var buckethash = new Array();    //没放一个桶对应一组x, y 
            var atomIndex = new Array();
            var atomNum = new Array();     //记录当前桶中有多少个点
            var R = []; 
  for(var i = -1 + CELL_SIZE / 2; i < 1; i += CELL_SIZE)
  	for(var j = -1 + CELL_SIZE / 2; j < 1; j+= CELL_SIZE)
  	  for(var k = -1 +CELL_SIZE / 2; k < 1; k += CELL_SIZE){
        
       var bucketPos = new Vector(i, j, k);
       var bucketHash = hash(bucketPos); 
      
       if(!bucket[bucketHash]){
           bucket[bucketHash] = new Array();
           buckethash.push(bucketHash % hashindex_dim, parseInt(bucketHash / hashindex_dim));
           atomIndex.push(count>>8, count & 255);
           R.push(bucketHash);
           count++;
          }
 	  	 for(var p = 0; p < points.length; p+=3){
 	  	    var temp = new Vector(points[p], points[p + 1], points[p + 2]);
 	  	    if(bucketPos.subtract(temp).length() < 0.4) 
 	  	       bucket[bucketHash].push(points[p], points[p + 1], points[p + 2]);
 	  	 }   
  	  }
  	
  	var atomAttributePool = [];
  	var atomAttributePos = [];
  	for(var i = 0; i < R.length; i++){
  		  for(var j = 0; j < bucket[R[i]].length; j+=3){
  	 atomAttributePool.push(bucket[R[i]][j], bucket[R[i]][j + 1], bucket[R[i]][j + 2]);
  	 }
  	 atomAttributePos.push(i, j / 3);
  	}
    
    var data = {
                buckethash:buckethash,
                atomIndex:atomIndex,
                               
                atomAttributePool:atomAttributePool,
                atomAttributePos:atomAttributePos
    					}
    return data;
}

///////////////////////////////////////////////////////////////////////////////////

var Particles = function(gl){
	this.program = createProgram(gl, "particlesVertex", "particlesFragment");
	var vertices = [];  	
	for(var i = 0; i < 300; i++)
	   vertices.push(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0);
	
	var verticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
	
	this.draw = function(vmMatrix, doubleFBO){
		gl.useProgram(this.program);
      gl.viewport(0, 0, 128, 128);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.vertexAttribPointer(this.program.a_Position, 3, gl.FLOAT, false, 0, 0);  
			gl.enableVertexAttribArray(this.program.a_Position);
       
      gl.uniformMatrix4fv(this.program.u_MvpMatrix, false, vmMatrix);
       
      doubleFBO.fbo1.enable();
 	    gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
	    doubleFBO.fbo1.disable();
	    doubleFBO.swap();  
	} 
}

var FirstPass = function(gl){
	  this.program = createProgram(gl, "firstPassVertex", "firstPassFragment");
   
	  var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    
    this.doubleFBO = new createDoubleFBO(gl, 2, 128, 128);  
	  
	  this.draw = function(vpMatrix){
	  	gl.viewport(0, 0, 128, 128);
      gl.useProgram(this.program);
	  	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  		gl.vertexAttribPointer(this.program.a_Position, 2, gl.FLOAT, false, 0, 0);
  		gl.enableVertexAttribArray(this.program.a_Position);
  		
  		gl.uniform1f(this.program.u_Size, 2.0 / 128.0);
 	    gl.uniform1i(this.program.Second, 4); 
 	    gl.uniform1i(this.program.Particle, this.doubleFBO.fbo2.num);
 	    gl.uniformMatrix4fv(this.program.u_MvpMatrix, false, vpMatrix);
 	    
 	    this.doubleFBO.fbo1.enable();
 	    gl.drawArrays(gl.POINTS, 0, this.vertices.length / 2);
	    this.doubleFBO.fbo1.disable();
	    this.doubleFBO.swap();
	    
	  }
} 
var positionData = {
	  vertices:function(){
	  	var pixel = 2.0 / 128.0;
	  	var temp = [];
	  	for(var i = 0; i < 128; i++)
	    for(var j = 0; j < 128; j++){
	      temp.push(-1 + i * pixel, -1 + j * pixel);
	    } 
	    return new Float32Array(temp);
	   }()
}
FirstPass.prototype = positionData;


var SecondPass =  function(gl){
	  this.program = createProgram(gl, "secondPassVertex", "secondPassFragment");
   
	  var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    this.fbo = new createFBO(gl, 4, 128, 128);
    
	  this.draw = function(image1){
	  	gl.viewport(0, 0, 128, 128);
      gl.useProgram(this.program);
	  	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  		gl.vertexAttribPointer(this.program.a_Position, 2, gl.FLOAT, false, 0, 0);
  		gl.enableVertexAttribArray(this.program.a_Position);
  		 
  		gl.uniform1f(this.program.u_Size, 2.0 / 128.0);
  		gl.uniform1f(this.program.rep_radius, 0.2); 
      gl.uniform1i(this.program.image1, image1); 
      this.fbo.enable(); 
 	    gl.drawArrays(gl.POINTS, 0, this.vertices.length / 2);
	    this.fbo.disable(); 
	  }
}  
SecondPass.prototype = positionData; 
   
var FinalRender = function(gl){
	  this.program = createProgram(gl, "finalRenderVertex", "finalRenderFragment");
	  
	  var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
 
	  this.draw = function(image1){
	  	gl.viewport(0, 0, 128, 128);
      gl.useProgram(this.program);
	  	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  		gl.vertexAttribPointer(this.program.a_Position, 2, gl.FLOAT, false, 0, 0);
  		gl.enableVertexAttribArray(this.program.a_Position);
  		 
  		gl.uniform1f(this.program.u_Size, 2.0 / 128.0);
      gl.uniform1i(this.program.u_Sampler, image1);
      gl.uniform1i(this.program.Second, 4);
      
 	    gl.drawArrays(gl.POINTS, 0, this.vertices.length / 2);
	  } 
}
 
FinalRender.prototype = positionData;

 