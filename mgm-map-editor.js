
  function togglePreviewArea(hideClass){
	document.getElementById('previewArea').classList.toggle(hideClass);
  }
  
  function readBlob(file,callback) {

    var reader = new FileReader();
	
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
		callback(evt.target.result);
      }
    };
	
    reader.readAsBinaryString(file);
  }
  
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

var map = {};

function init(){
  map = {
	version:2,
	maxPlayers:8,
	width:64,
	height:64,
	altFactor:1,
	waterLevel:0,
	title:'',
	autor:'',
	description:'',
	magic: parseInt("1020304", 16),
	cliffLevel: 0,
	cameraHeight:0,
	meta:'',
	map:[],
	startLocation:[]
  };
	for(var p=0; p < map.maxPlayers; p++){
		var x = Math.round((map.width/4)*(p+0.5));
		var y = Math.round((map.height/4)*(p+0.5));
		if(p >3){
			x = x;
			y = map.height*2 - y;
		}
		map.startLocation[p] = {
			x:x % map.width,
			y:y % map.height
		};
	}
	for(var i=0; i < map.width; i++){
		map.map[i] = [];
		for(var j=0;j < map.height;j++){
			map.map[i][j]={
				h:10,
				s:1,
				o:0
			};
		}
	}
	setTimeout(renderMapToCanvas,0);
  }
  
  
function getCanvasWithContext(id){
	if(!map.maxPlayers){
		return;
	}
	var renderer = {};
	renderer.canvas = document.getElementById(id);
	renderer.scale = 512 / Math.max(map.width,map.height);
	renderer.canvas.style.width = (map.width * renderer.scale)+'px';
	renderer.canvas.style.height = (map.height * renderer.scale)+'px';
	if (renderer.canvas.getContext) {
		renderer.ctx = renderer.canvas.getContext('2d');
		renderer.renderScaled = function(callback/*({x,y,cell}) => {r,g,b,a}*/){
			renderer.ctx.canvas.width  = map.width*renderer.scale;
			renderer.ctx.canvas.height = map.height*renderer.scale;
			var imgData=renderer.ctx.createImageData(map.width*renderer.scale,map.height*renderer.scale);
			for (var i = 0 ;i < imgData.data.length ; i += 4){
				var cellID = i / 4;
				var cellPos = descale(cellID,renderer.scale);
				var cell = callback({x:cellPos.x,y:cellPos.y,cell:map.map[cellPos.x]&&map.map[cellPos.x][cellPos.y]});
				imgData.data[i+0]=cell.r;
				imgData.data[i+1]=cell.g;
				imgData.data[i+2]=cell.b;
				imgData.data[i+3]=cell.a;
			  }
			renderer.ctx.putImageData(imgData,0,0);	
		}
		renderer.renderObjects = function(callback/*({x,y,cell}) => {r,g,b,a}*/){
			renderer.ctx.canvas.width  = map.width*renderer.scale;
			renderer.ctx.canvas.height = map.height*renderer.scale;
			var imgData=renderer.ctx.createImageData(map.width*renderer.scale,map.height*renderer.scale);
			renderer.ctx.putImageData(imgData,0,0);	
			for (var cellID = 0 ;cellID < map.width*map.height ; cellID += 1){
				var cellPos = descale(cellID,1);
				var padding = Math.floor(renderer.scale / 4);
				var area = {
					x: cellPos.x*renderer.scale+padding,
					y: cellPos.y*renderer.scale+padding,
					w: renderer.scale-(padding*2),
					h: renderer.scale-(padding*2)
				};
				var cell = callback({
					x:cellPos.x,
					y:cellPos.y,
					cell:map.map[cellPos.x]&&map.map[cellPos.x][cellPos.y],
					ctx:renderer.ctx,
					area:area
				});
			  }
		}
		return renderer;
	}
	return false;
}

document.getElementById('btnSaveHeightmap').addEventListener("click", function( event ) {
		if(locked){
			return;
		}
		lock();
		var renderer = getCanvasWithContext('highmap');	
		if(!renderer){
			return;
		}
		this.href = renderer.canvas.toDataURL();
		this.download = map.title+'.hmap.png';
		unlock();
	}, false);
document.getElementById('btnSaveMap').addEventListener("click", function( event ) {
		if(locked){
			return;
		}
		lock();
		event.preventDefault();
		setTimeout(writeMap,100,function(mapFile){
			process("Encoding File ...",1,0,2);
			var mapUrl = window.btoa(mapFile);
			var a = document.createElement("a");
			a.href = "data:application/x-megaglest-map;base64," + mapUrl;
			a.download = map.title+'.mgm';
			a.click();
			document.body.appendChild(a);
			a.addEventListener("click", function(e) {
			  a.parentNode.removeChild(a);
			});
			a.click();
			console.log(a);
			unlock();
		});

	}, false);
  
function renderHeightMap(){
	var renderer = getCanvasWithContext('highmap');	
	if(!renderer){
		return;
	}
	renderer.ctx.canvas.width  = map.width;
	renderer.ctx.canvas.height = map.height;
	
	var imgData=renderer.ctx.createImageData(map.width,map.height);
	for (var i=0;i<imgData.data.length;i+=4)
	  {
		var cellID = i / 4;
		var co = map.map[(cellID % map.width)][(Math.floor(cellID / map.width))]['h'] / 20 * 255;
		imgData.data[i+0]=co;
		imgData.data[i+1]=co;
		imgData.data[i+2]=co;
		imgData.data[i+3]=255;
	  }
	renderer.ctx.putImageData(imgData,0,0);
	
}

var textures = [
	{r:0,g:102,b:0,name:'Grass'},
	{r:51,g:76,b:0,name:'Secondary Grass'},
	{r:76,g:38,b:0,name:'Road'},
	{r:89,g:89,b:89,name:'Stone'},
	{r:89,g:64,b:38,name:'Custom'}
];
function renderSurfaces(){
	var renderer = getCanvasWithContext('texture');	
	if(!renderer){
		return;
	}
	renderer.renderScaled(function(d){ 
		var res ={};
		var tex = textures[d.cell.s-1];
		if(!tex){
			tex = textures[0];
		}
		res.r=tex.r;
		res.g=tex.g;
		res.b=tex.b;
		res.a=200;
		return res;
	});	
}


function checkIsCliff(x,y){
	for(var xi = x - 1;xi < x + 1; xi++){
		if( map.map[x] && map.map[xi]){
			for(var yi = y - 1;yi < y + 1; yi++){
				if(map.map[x][y] && map.map[xi][yi]){
					if(Math.abs( map.map[x][y].h - map.map[xi][yi].h ) >= map.cliffLevel){
						return true;
					}
				}
			}
		}
	}
	return false;
}

function renderCliff(){
	var renderer = getCanvasWithContext('cliff');	
	if(!renderer){
		return;
	}
	renderer.renderScaled(function(d){ 
		var res ={};
		if(!map.cliffLevel || map.cliffLevel == 0){
			res.r=0;
			res.g=0;
			res.b=0;
			res.a=0;
		}else if(checkIsCliff(d.x,d.y)){
			res.r=200;
			res.g=255;
			res.b=0;
			res.a=255;
		}else{
			res.r=0;
			res.g=0;
			res.b=0;
			res.a=0;
		}
		return res;
	});
}

function canvasDrawX(ctx,x,y,w,h,color){
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineWidth = 1;
	ctx.lineTo(x+w, y+h);
	ctx.closePath();
	ctx.strokeStyle = color;
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(x, y + h);
	ctx.lineWidth = 1;
	ctx.lineTo(x+w, y);
	ctx.closePath();
	ctx.strokeStyle = color;
	ctx.stroke();
}

function renderObjects(){
	var renderer = getCanvasWithContext('objects');	
	if(!renderer){
		return;
	}
	renderer.renderObjects(function(d){ 
		if(d.cell.o === 1){
			d.ctx.fillStyle="#FF0000";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 2){
			d.ctx.fillStyle="#FFFFFF";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 3){
			d.ctx.fillStyle="#9370DB";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 4){
			d.ctx.fillStyle="#0000cc";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 5){
			d.ctx.fillStyle="#cccccc";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 6){
			d.ctx.fillStyle="#FFA500";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 7){
			d.ctx.fillStyle="#7fffd4";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 8){
			d.ctx.fillStyle="#8b2323";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 9){
			d.ctx.fillStyle="#7fff00";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 10){
			d.ctx.fillStyle="#ff1493";
			d.ctx.fillRect(d.area.x,d.area.y,d.area.w,d.area.h); 
		}else if(d.cell.o === 11){
			canvasDrawX(d.ctx,d.area.x,d.area.y,d.area.w,d.area.h,'#ffb90f');
		}else if(d.cell.o === 12){
			canvasDrawX(d.ctx,d.area.x,d.area.y,d.area.w,d.area.h,'#bebebe');
		}else if(d.cell.o === 13){
			canvasDrawX(d.ctx,d.area.x,d.area.y,d.area.w,d.area.h,'#cc0000');
		}else if(d.cell.o === 14){
			canvasDrawX(d.ctx,d.area.x,d.area.y,d.area.w,d.area.h,'#0000cc');
		}else if(d.cell.o === 15){
			canvasDrawX(d.ctx,d.area.x,d.area.y,d.area.w,d.area.h,'#008b8b');
		}else if(d.cell.o === 0){
			// do nothing
		}else{
			console.log('Not supported object', d.cell.o);
		}
	});
}


function descale(cellID,scale){
	var dividor = map.width * scale;
	return{
		x : Math.floor((cellID % dividor)/scale),
		y : Math.floor((Math.floor(cellID / dividor))/scale)
	};
}
function renderWater(){
	var renderer = getCanvasWithContext('water');	
	if(!renderer){
		return;
	}
	renderer.renderScaled(function(d){ 
		var res ={};
		
		res.r = 0;
		res.g = 0;
		if(d.cell.h <= map.waterLevel - 1.5){
			res.b = 51;
			res.a = 255;
		}else if(d.cell.h <= map.waterLevel){
			res.b = 51;
			res.a = 86;
		}else{
			res.b = 0;
			res.a = 0;
		}
		return res;
	});
}


var playerColors = [
	rgbToHex(255, 0, 0),
	rgbToHex( 0, 0, 255),
	rgbToHex( 0, 255, 0),
	rgbToHex( 255, 255, 0),
	rgbToHex( 255, 255, 255),
	rgbToHex( 0, 255, 255),
	rgbToHex( 255, 127, 0),
	rgbToHex( 255, 0, 255)
];

function renderStartPos(){
	var renderer = getCanvasWithContext('startpos');	
	if(!renderer){
		return;
	}
	renderer.ctx.canvas.width  = map.width*renderer.scale;
	renderer.ctx.canvas.height = map.height*renderer.scale;
	
	
	map.startLocation.forEach(function(loc,index){
		renderer.ctx.beginPath();
		var x = parseInt(loc.x *renderer.scale+renderer.scale/2);
		var y = parseInt(loc.y *renderer.scale+renderer.scale/2);
		renderer.ctx.moveTo(x -renderer.scale, y-renderer.scale);
		renderer.ctx.lineWidth = 1;
		renderer.ctx.lineTo(x+renderer.scale, y+renderer.scale);
		renderer.ctx.strokeStyle = playerColors[index];
		renderer.ctx.stroke();
		renderer.ctx.beginPath();
		renderer.ctx.moveTo(x +renderer.scale, y-renderer.scale);
		renderer.ctx.lineWidth = 1;
		renderer.ctx.lineTo(x-renderer.scale, y+renderer.scale);
		renderer.ctx.strokeStyle = playerColors[index];
		renderer.ctx.stroke();
	});
}

var startPosTemplate = false;
  
function renderMapToCanvas(){
	if(!map.maxPlayers){
		return;
	}
	document.getElementById('version-field').value = map.version;
	document.getElementById('maxPlayers-field').value = map.maxPlayers;
	document.getElementById('width-field').value = map.width;
	document.getElementById('height-field').value = map.height;
	if(map.altFactor > 100){
		document.getElementById('altFactor-field').value = (map.altFactor / 100);
	}else{
		document.getElementById('altFactor-field').value = map.altFactor;
	}
	document.getElementById('waterLevel-field').value = map.waterLevel;
	document.getElementById('title-field').value = map.title;
	document.getElementById('autor-field').value = map.autor;
	document.getElementById('description-field').value = map.description;
	if(map.version > 1){
		document.getElementById('description-field').maxLength = 128;
		document.getElementById('description-field').rows = 2;
		
		document.getElementById('magic-field').parentElement.parentElement.style.display = 'block';
		document.getElementById('cliffLevel-field').parentElement.parentElement.style.display = 'block';
		document.getElementById('cameraHeight-field').parentElement.parentElement.style.display = 'block';
		document.getElementById('meta-field').parentElement.parentElement.style.display = 'block';
		
		document.getElementById('magic-field').innerHTML = '0x'+map.magic.toString(16);
		document.getElementById('cliffLevel-field').value = map.cliffLevel;
		if(map.cameraHeight < 20){
			document.getElementById('cameraHeight-field').value = 0;
		}else{
			document.getElementById('cameraHeight-field').value = Math.min(map.cameraHeight,40);
		}
		document.getElementById('meta-field').innerHTML = map.meta;
	}else{
		document.getElementById('description-field').maxLength = 256;
		document.getElementById('description-field').rows = 4;
		
		document.getElementById('magic-field').parentElement.parentElement.style.display = 'none';
		document.getElementById('cliffLevel-field').parentElement.parentElement.style.display = 'none';
		document.getElementById('cameraHeight-field').parentElement.parentElement.style.display = 'none';
		document.getElementById('meta-field').parentElement.parentElement.style.display = 'none';
	}
	//
	if(!startPosTemplate){
		startPosTemplate = document.getElementById('startLocation-field').innerHTML;
	}
	var startLocationsHTML =[];
	map.startLocation.forEach(function(loc,index){
		var line = startPosTemplate.replace(/\{\{color\}\}/gi,playerColors[index]);
		line = line.replace(/\{\{number\}\}/gi,(index+1));
		line = line.replace(/\-\-/gi,'-'+(index)+'-');
		line = line.replace(/\{\{x\}\}/gi,loc.x);
		line = line.replace(/\{\{y\}\}/gi,loc.y);
		line = line.replace(/\{\{maxX\}\}/gi,(map.width-1));
		line = line.replace(/\{\{maxY\}\}/gi,(map.height-1));
		
		startLocationsHTML.push(line);
	});
	document.getElementById('startLocation-field').innerHTML = startLocationsHTML.join('');
	setTimeout(renderHeightMap,0);
	setTimeout(renderSurfaces,0);
	setTimeout(renderCliff,0);
	setTimeout(renderObjects,0);
	setTimeout(renderWater,0);
	setTimeout(renderStartPos,0);	
}
  
  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = (evt.dataTransfer && evt.dataTransfer.files) || document.getElementById('files').files; // FileList object.
	document.getElementById('files').files = files;

    var output = [];
    var f = files[0];
	if(f.name.indexOf('.gbm') === f.name.length - 4 || f.name.indexOf('.mgm')  === f.name.length - 4){
		readBlob(f,function(handleData){
			var handle = {data:handleData,pos:0};
			map = {};
			map.version = getInt32(handle);
			map.maxPlayers = getInt32(handle);
			map.width = getInt32(handle);
			map.height = getInt32(handle);
			map.altFactor = getInt32(handle);
			map.waterLevel = getInt32(handle);
			map.title = getString(handle,128);
			if(!map.title || map.title === ''){
				map.title = f.name.slice(0,f.name.length - 4);
			}
			map.autor = getString(handle,128);
			
			if(map.version <= 1){
				map.description = getString(handle,256);
				map.magic = false;
				map.cliffLevel = false;
				map.cameraHeight = false;
				map.meta = false;
			}else{
				map.description = getString(handle,128);
				map.magic = getInt32(handle);
				map.cliffLevel = getInt32(handle);
				map.cameraHeight = getInt32(handle);
				map.meta = getString(handle,116);
			}
			
			map.startLocation = [];
			for( var i = 0; i < map.maxPlayers;i++){
				map.startLocation[i] = {
					x:getInt32(handle),
					y:getInt32(handle)
				};
			}
			
			map.map  = [];
			for(i = 0; i < ( map.width *  map.height);i++){
				if(!map.map[(i % map.width)]){
					map.map[(i % map.width)] = []; 
				}
				if(!map.map[(i % map.width)][(Math.floor(i / map.width))]){
					map.map[(i % map.width)][(Math.floor(i / map.width))] = {}; 
				}
				map.map[(i % map.width)][(Math.floor(i / map.width))]['h'] = getFloat(handle);
			}
			for(i = 0; i < ( map.width *  map.height);i++){
				if(!map.map[(i % map.width)]){
					map.map[(i % map.width)] = []; 
				}
				if(!map.map[(i % map.width)][(Math.floor(i / map.width))]){
					map.map[(i % map.width)][(Math.floor(i / map.width))] = {}; 
				}
				map.map[(i % map.width)][(Math.floor(i / map.width))]['s'] = getInt8(handle);
			}
			for(i = 0; i < ( map.width *  map.height);i++){
				if(!map.map[(i % map.width)]){
					map.map[(i % map.width)] = []; 
				}
				if(!map.map[(i % map.width)][(Math.floor(i / map.width))]){
					map.map[(i % map.width)][(Math.floor(i / map.width))] = {}; 
				}
				map.map[(i % map.width)][(Math.floor(i / map.width))]['o'] = getInt8(handle);
			}
			
			setTimeout(renderMapToCanvas,0);
			
		});
	}else if(f.name.indexOf('.png') === f.name.length - 4){
		var reader = new FileReader();
		reader.onload = function(event){
			var img = new Image();
			img.onload = function(){
				if(map.width === img.width && map.height === img.height){
					var canvasHighmap = document.getElementById('highmap');
			var scale = 512 / Math.max(map.width,map.height);
			canvasHighmap.style.width = (map.width * scale)+'px';
			canvasHighmap.style.height = (map.height * scale)+'px';
			
			if (canvasHighmap.getContext) {
				var ctx = canvasHighmap.getContext('2d');
				ctx.canvas.width  = map.width;
				ctx.canvas.height = map.height;
				
				ctx.drawImage(img,0,0);
				updateHeightMapFromCanvas();
			}
				}else{
					alert('Sizes do not match');
				}
				
			};
			img.src = event.target.result;
		}
		reader.readAsDataURL(f);  
	}
  }
  
  function contrastHighmap(contrast){
	  if(locked){
		  return;
	  }
	lock();
	var canvasHighmap = document.getElementById('highmap');
	if (canvasHighmap.getContext) {
		var ctx = canvasHighmap.getContext('2d');
		var imageData=ctx.getImageData(0,0,map.width,map.height);
		var data = imageData.data;
		var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

		for(var i=0;i<data.length;i+=4)
		{
			data[i] = factor * (data[i] - 128) + 128;
			data[i+1] = factor * (data[i+1] - 128) + 128;
			data[i+2] = factor * (data[i+2] - 128) + 128;
		}
		ctx.putImageData(imageData,0,0);
		updateHeightMapFromCanvas();
	}
	unlock();
  }
  
  function updateHeightMapFromCanvas(){
		var canvasHighmap = document.getElementById('highmap');			
			if (canvasHighmap.getContext) {
				var ctx = canvasHighmap.getContext('2d');
				var imgData=ctx.getImageData(0,0,map.width,map.height);
				for (var i=0;i<imgData.data.length;i+=4){
					var cellID = i / 4;
					map.map[(cellID % map.width)][(Math.floor(cellID / map.width))]['h'] = (imgData.data[i+0]+imgData.data[i+1]+imgData.data[i+2] )/ 3 * 20 / 255;
				}
				//console.log(map);
				setTimeout(renderMapToCanvas,0);
			}
  };
  
  var supportedMapSizes = [16,32,64,128,256,512];
  function updateFromFields(){
	var newVersion = parseInt(document.getElementById('version-field').value);
	if(newVersion && (newVersion === 1 || newVersion ===2)){
		map.version = newVersion;
	}
	
	map.startLocation.forEach(function(loc,index){
		var locX = parseInt(document.getElementById('startLocation-field-player-'+index+'-x').value);
		var locY = parseInt(document.getElementById('startLocation-field-player-'+index+'-y').value);
		if( locX >= 0 && locX < map.width){
			loc.x = locX;
		}
		if(locY >= 0 && locY < map.height){
			loc.y = locY;
		}
	});
	
	var newMaxPlayers = parseInt(document.getElementById('maxPlayers-field').value);
	if(newMaxPlayers && (newMaxPlayers > 0 || newMaxPlayers <= 8)){
		map.maxPlayers = newMaxPlayers;
		var startLocation = [];
		for( var i = 0; i < map.maxPlayers;i++){
			startLocation[i] = {
				x:(map.startLocation[i]&&map.startLocation[i].x)|| 0,
				y:(map.startLocation[i]&&map.startLocation[i].y)|| 0
			};
		}
		map.startLocation = startLocation;
	}
	var newWidth = parseInt(document.getElementById('width-field').value);
	if(newWidth && (supportedMapSizes.indexOf(newWidth) > -1 )){
		if((newWidth < map.width) && window.confirm("Do you really want to make the map smaller? Data might be lost!")){
			for(var iDeleteWidth = newWidth; iDeleteWidth < map.width; iDeleteWidth++){
				map.map.splice(iDeleteWidth, 1);
			}
			map.width = newWidth;
		}else if(newWidth > map.width){
			for(var iAddWidth = map.width; iAddWidth < newWidth; iAddWidth++){
				map.map[iAddWidth] = [];
				for(var iAddWidthHeight = 0; iAddWidthHeight < map.height; iAddWidthHeight++ ){
					map.map[iAddWidth][iAddWidthHeight]={h:10,s:1,o:0};
				}
			}
			map.width = newWidth;
		}
	}
	var newHeight = parseInt(document.getElementById('height-field').value);
	if(newHeight && (supportedMapSizes.indexOf(newHeight) > -1 )){
		if((newHeight < map.height) && window.confirm("Do you really want to make the map smaller? Data might be lost!")){
			for(var iDeleteHeight = newHeight; iDeleteHeight < map.height; iDeleteHeight++){
				for(var iDeleteHeightWidth = 0; iDeleteHeightWidth < map.width; iDeleteHeightWidth++){
					map.map[iDeleteHeightWidth].splice(iDeleteHeight, 1);
				}
			}
			map.height = newHeight;
		}else if(newHeight > map.height){
			for(var iAddHeight = map.height; iAddHeight < newHeight; iAddHeight++){
				for(var iAddHeightWidth = 0; iAddHeightWidth < map.width; iAddHeightWidth++ ){
					map.map[iAddHeightWidth][iAddHeight]={h:10,s:1,o:0};
				}
			}
			map.height = newHeight;
		}
	}
	var newAltFactor = parseFloat(parseFloat(document.getElementById('altFactor-field').value.replace(',','.')).toFixed(2));
	if(newAltFactor && (newAltFactor >= 1 && newAltFactor <= 100)){
		if(newAltFactor+'' === newAltFactor.toFixed(0)){
			map.altFactor = newAltFactor;
		}else{
			map.altFactor = newAltFactor*100;
		}
	}
	
	var newWaterLevel = parseInt(document.getElementById('waterLevel-field').value);
	if( newWaterLevel >= 0 && newWaterLevel <= 20){
		map.waterLevel = newWaterLevel;
	}
	map.title = (document.getElementById('title-field').value+'').substring(0,128);
	map.autor = (document.getElementById('autor-field').value+'').substring(0,128);
	if(map.version == 1){
		map.description = (document.getElementById('description-field').value+'').substring(0,256);
		map.magic = 0;
		map.cliffLevel = 0;
		map.cameraHeight = 0;
		map.meta = "";
	}else{
		map.description = (document.getElementById('description-field').value+'').substring(0,128);
		map.magic = parseInt("1020304", 16);
		
		var newCliffLevel = parseInt(document.getElementById('cliffLevel-field').value);
		if(newCliffLevel >= 0 && newCliffLevel <= 20){
			map.cliffLevel = newCliffLevel;
		}
		var newCameraHeight = parseInt(document.getElementById('cameraHeight-field').value);
		if(newCameraHeight < 20){
			map.cameraHeight = 0;
		}else if(newCameraHeight >= 20 && newCameraHeight <= 40){
			map.cameraHeight = newCameraHeight;
			map.meta = "";
		}
		
		
	}
	
	
	
	
	setTimeout(renderMapToCanvas,0);
  };
 
	function writeMap(callback){
		var handle = {data:"",pos:0};
		var handle2 = {data:"",pos:0};
		var rowHandles = [];
		var rowHandles2 = [];
		var rowHandles3 = [];
		var handle3 = {data:"",pos:0};
		var handle4 = {data:"",pos:0};
		if(!map.maxPlayers){
			return;
		}
		var steps = 13+map.maxPlayers+3*(map.width*map.height);
		var step = 0;

		writeInt32(handle,map.version);
		writeInt32(handle,map.maxPlayers);
		writeInt32(handle,map.width);
		writeInt32(handle,map.height);
		writeInt32(handle,map.altFactor);
		writeInt32(handle,map.waterLevel);
		writeString(handle,map.title,128);
		writeString(handle,map.autor,128);
		if(map.version <= 1){
			writeString(handle,map.description,256);
		}else{
			writeString(handle,map.description,128);
			writeInt32(handle,map.magic);
			writeInt32(handle,map.cliffLevel);
			writeInt32(handle,map.cameraHeight);
			writeString(handle,map.meta,116);
		}
		step = step + 13;
		process("Creating File ...",step,steps,0);
		for(var i = 0; i < map.maxPlayers;i++){
			var loc = map.startLocation[i];
			if(loc && loc.x > -1 && loc.y > -1){
				writeInt32(handle,loc.x);
				writeInt32(handle,loc.y);
			}else{
				writeInt32(handle,0);
				writeInt32(handle,0);
			}
		}
		step = step + map.maxPlayers;
		process("Creating File ...",step,steps,0);
		handle.finished = true;
		
		var reduceRowHandle = function(previousValue, currentValue) {
				previousValue.finished = previousValue.finished && currentValue.finished;
				if(previousValue.finished){
					previousValue.data = previousValue.data + currentValue.data;
				}
				return previousValue;
			};
		
		var checkDone =function(){
			var start = performance.now();
			if(!handle.finished){
				return;
			}
			if(!handle2.finished){
				handle2 = rowHandles.reduce(reduceRowHandle,{data:"",finished:true});
				if(!handle2.finished){
					return;
				}
			}
			if(!handle3.finished){
				handle3 = rowHandles2.reduce(reduceRowHandle,{data:"",finished:true});
				if(!handle3.finished){
					return;
				}
			}
			if(!handle4.finished){
				handle4 = rowHandles3.reduce(reduceRowHandle,{data:"",finished:true});
				if(!handle4.finished){
					return;
				}
			}
			callback(handle.data+handle2.data+handle3.data+handle4.data);
		};
		var rowWriter = function(d){
			for(i = 0; i < map.height;i++){
				if(!map.map[d.x][i]){
					map.map[d.x][i] = {}; 
				}
				writeFloat(rowHandles[d.x],d.row[i]['h']);
				writeInt8(rowHandles2[d.x],d.row[i]['s']);
				writeInt8(rowHandles3[d.x],d.row[i]['o']);
				process("Creating File ...",step,steps,0);
				step = step +3;
			}
			rowHandles[d.x].finished = true;
			rowHandles2[d.x].finished = true;
			rowHandles3[d.x].finished = true;
			checkDone();
		};
		for(i = 0; i < map.width;i++){
			if(!map.map[i]){
				map.map[i] = []; 
			}
			rowHandles.push({data:"",pos:0});
			rowHandles2.push({data:"",pos:0});
			rowHandles3.push({data:"",pos:0});
			setTimeout(rowWriter,i*map.height*0.125,{x:i,row:map.map[i]});
		}
		
	};

function closeCells(x,y,type){
	var cells = 0;
	for(var j=y-1;j<=y+1;j++){
		for(var i=x-1;i<=x+1;i++){
			if(map.map[i] && map.map[i][j] && map.map[i][j].type == type && !(i==y && j==x)){
				cells++;
			}else if((!map.map[i] ||!map.map[i][j]) && !(i==y && j==x)){/*makes island*/
				cells++;
			}
		}
	}
	return cells;
}	

var locked = false;
$('#processingDialog').modal({
	'backdrop':'static',
	'show':false
});
function lock(){
	locked = true;
	process("",0,100,0);
	//setTimeout(function(){
		$('#processingDialog').modal('show');
	//},1);
}
function process(name,val,max,min){
	//setTimeout(function(){
		$('#processingDialogName').html(name);
		var $process = $('#processingDialogProcess');
		max = max || 100;
		min = min || 0;
		$process.attr("aria-valuenow",val);
		$process.attr("aria-valuemin",min);
		$process.attr("aria-valuemax",max);
		$process.css("width",( ( (val-min) / (max-min) ) * 100 )+ '%');
	//},1);
}
function unlock(){
	setTimeout(function(){
		$('#processingDialog').modal('hide');
		locked = false;
	},1);
}

var changes = 1;
var randomGenStep = 0;
//var rule = {'water':[5,6]};
var rule = {'water':[5,6]};

function next(){
	if(changes <= 0){
		//fillOcean();
		map.startLocation.forEach(ensureStatpointLand);
		unlock();
		return;
	}
	process("Random island",randomGenStep++,randomGenStep+((map.width+map.height)/32),0);
	changes = 0;
	for(var x=0;x<map.width;x++){
		for(var y=0;y<map.height;y++){
			var waterCells = closeCells(x,y,'water');
			if(waterCells < rule['water'][0] && map.map[x][y].type != 'land'){
				map.map[x][y].type = 'land';
				changes++;
			}else if(waterCells > rule['water'][1] && map.map[x][y].type == 'land'){
				map.map[x][y].type = 'water';
				changes++;
			}
			if(map.map[x][y].type === 'water'){
				map.map[x][y].h = Math.random()*(map.waterLevel - 1.5);
			}else if(map.cliffLevel){
				map.map[x][y].h = map.waterLevel + Math.random()*(map.cliffLevel);
			}else{
				map.map[x][y].h = map.waterLevel + Math.random()*(20-map.waterLevel);
			}
		}
	}
	map.startLocation.forEach(ensureStatpointLand);
	setTimeout(renderMapToCanvas,0);
	setTimeout(next,0);
}

function ensureStatpointLand(loc,index){
	var size = 8;
	var resourceMargin = 2;
	var offsetX = 0;
	var offsetY = 0;
	
	if(loc.x-size < 0){
		offsetX = 0-(loc.x-size);
	}
	if(loc.x+size >= map.width){
		offsetX = 0-(loc.x+size+1-map.width);
	}
	if(loc.y-size < 0){
		offsetY = 0-(loc.y-size);
	}
	if(loc.y+size >= map.height){
		offsetY = 0-(loc.y+size+1-map.height);
	}
	
	loc.x = loc.x + offsetX;
	loc.y = loc.y + offsetY;
	
	//console.log(loc.x,loc.y,map.map[loc.x][loc.y],offsetX,offsetY);
	for(var i = loc.x - size; i <= loc.x + size; i++){
		for(var j = loc.y - size; j <= loc.y + size; j++){
			map.map[i][j].type = 'land';
			map.map[i][j].h = 10;
			if(map.cliffLevel > 0){
				map.map[i][j].h = map.waterLevel + (map.cliffLevel/2);
			}
			map.map[i][j].s = 3;
			if(i === loc.x - size || i === loc.x + size || j === loc.y - size || j === loc.y + size){
				map.map[i][j].s = 2;
			}
		}
	}
	for(var i = loc.x - size+resourceMargin; i <= loc.x - resourceMargin; i++){
		for(var j = loc.y - size+resourceMargin; j <= loc.y -resourceMargin; j++){
			if(-i-j > -loc.x - loc.y + size){
				map.map[i][j].o = 11;
			}
		}
	}
	for(var i = loc.x + resourceMargin; i <= loc.x +size-resourceMargin; i++){
		for(var j = loc.y + resourceMargin; j <= loc.y + size-resourceMargin; j++){
			if(i+j > loc.x + loc.y + size){
				map.map[i][j].o = 12;
			}
		}
	}
	for(var i = loc.x + resourceMargin; i <= loc.x +size-resourceMargin; i++){
		for(var j = loc.y - size+resourceMargin; j <= loc.y -resourceMargin; j++){
			if(i-j > loc.x - loc.y + size){
				map.map[i][j].o = 1;
			}
		}
	}
	for(var i = loc.x - size+resourceMargin; i <= loc.x - resourceMargin; i++){
		for(var j = loc.y + resourceMargin; j <= loc.y + size-resourceMargin; j++){
			if(-i+j > -loc.x + loc.y + size){
				map.map[i][j].o = 2;
			}
		}
	}
	
	
}

function randomIsland(){
	if(locked || map.width <= 0 || map.height <= 0||map.maxPlayer < 1||!map.startLocation){
		return;
	}
	lock();
	randomGenStep = 0;
	process("Random island",randomGenStep++,randomGenStep+((map.width+map.height)/32),0);
	map.map = [];
	map.title = 'generaded_'+Math.random();
	map.author = 'http://muwns.eu/mgm/';
	for(var i=0;i<map.width;i++){
		map.map[i] = [];
		for(var j=0;j<map.height;j++){
			map.map[i][j] = {};
			map.map[i][j].type = (Math.random()<0.4)?'land':'water';
			if(i==0||j==0||i==map.width-1||j==map.height-1){
				map.map[i][j].type = 'water';
			}
			if(map.map[i][j].type === 'water'){
				map.map[i][j].h = 0;
			}else{
				map.map[i][j].h = 10;
			}
			map.map[i][j].s = 1;
			map.map[i][j].o = 0;
		}
	}
	map.startLocation.forEach(ensureStatpointLand);
	
	changes = 1;
	
	
	setTimeout(renderMapToCanvas,0);
	setTimeout(next,0);
	
}

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
  }

var dropZone = document;
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
  init();