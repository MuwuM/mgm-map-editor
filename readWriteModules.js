
function fread(handle,length){
	var data = handle.data.slice(handle.pos,handle.pos+length);
	handle.pos = handle.pos+length;
	return data;
}
function fwrite(handle,buffer,length){
	handle.data = handle.data + buffer.slice(0, length);
	handle.pos = handle.pos+length;
	return handle.pos;
}

function getInt32(handle){
	var str = fread(handle,4);
	var buf = pack('a4',str);
	var res = unpack('l',buf);
	return(res[1]||res[""]);
}
function getInt8(handle){
	var str = fread(handle,1);
	var buf = pack('a',str);
	var res = unpack('c',buf);
	return(res[1]||res[""]);
}
function getString(handle,length){
	var str =  fread(handle,length);
	var buf = pack('a'+length,str);
	var res = unpack('a'+length,buf);
	return(res[1]||res[""]);
}
function getFloat(handle){
	var str = fread(handle, 4);
	var buf = pack('a4',str);
	var res = unpack('f',buf);
	return(res[1]||res[""]);
}

function writeInt32(handle,val){
	var buf = pack('l',val);
	return fwrite(handle, buf,4);
}
function writeInt8(handle,val){
	var buf = pack('c',val);
	return fwrite(handle, buf,1);
}
function writeFloat(handle,val){
	buf = pack('f',val);
	return fwrite(handle, buf,4);
}
function writeString(handle,val,length){
	var buf = pack('a'+length,val);
	return fwrite(handle, buf,length);
}
