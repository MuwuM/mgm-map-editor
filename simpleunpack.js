function unpack(format, data) {
  // http://kevin.vanzonneveld.net
  // +   original by: Tim de Koning (http://www.kingsquare.nl)
  // +      parts by: Jonas Raoni Soares Silva - http://www.jsfromhell.com
  // +      parts by: Joshua Bell - http://cautionsingularityahead.blogspot.nl/
  // +
  // +   bugfixed by: marcuswestin
  // %        note 1: Float decoding by: Jonas Raoni Soares Silva
  // %        note 2: Home: http://www.kingsquare.nl/blog/22-12-2009/13650536
  // %        note 3: Feedback: phpjs-unpack@kingsquare.nl
  // %        note 4: 'machine dependant byte order and size' aren't
  // %        note 5: applicable for JavaScript unpack works as on a 32bit,
  // %        note 6: little endian machine
  // *     example 1: unpack('d', "\u0000\u0000\u0000\u0000\u00008YÀ");
  // *     returns 1: { "": -100.875 }

  var formatPointer = 0, dataPointer = 0, result = {}, instruction = '',
      quantifier = '', label = '', currentData = '', i = 0, j = 0,
      word = '', fbits = 0, ebits = 0, dataByteLength = 0;

  // Used by float decoding - by Joshua Bell
	//http://cautionsingularityahead.blogspot.nl/2010/04/javascript-and-ieee754-redux.html
  var fromIEEE754 = function(bytes, ebits, fbits) {
    // Bytes to bits
    var bits = [];
    for (var i = bytes.length; i; i -= 1) {
      var byte = bytes[i - 1];
      for (var j = 8; j; j -= 1) {
        bits.push(byte % 2 ? 1 : 0); byte = byte >> 1;
      }
    }
    bits.reverse();
    var str = bits.join('');

    // Unpack sign, exponent, fraction
    var bias = (1 << (ebits - 1)) - 1;
    var s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
    var e = parseInt(str.substring(1, 1 + ebits), 2);
    var f = parseInt(str.substring(1 + ebits), 2);

    // Produce number
    if (e === (1 << ebits) - 1) {
      return f !== 0 ? NaN : s * Infinity;
    }
    else if (e > 0) {
      return s * Math.pow(2, e - bias) * (1 + f / Math.pow(2, fbits));
    }
    else if (f !== 0) {
      return s * Math.pow(2, -(bias-1)) * (f / Math.pow(2, fbits));
    }
    else {
      return s * 0;
    }
  }

  while (formatPointer < format.length) {
    instruction = format.charAt(formatPointer);

    // Start reading 'quantifier'
    quantifier = '';
    formatPointer++;
    while ((formatPointer < format.length) &&
        (format.charAt(formatPointer).match(/[\d\*]/) !== null)) {
      quantifier += format.charAt(formatPointer);
      formatPointer++;
    }
    if (quantifier === '') {
      quantifier = '1';
    }


    // Start reading label
    label = '';
    while ((formatPointer < format.length) &&
        (format.charAt(formatPointer) !== '/')) {
      label += format.charAt(formatPointer);
      formatPointer++;
    }
    if (format.charAt(formatPointer) === '/') {
      formatPointer++;
    }

    // Process given instruction
    switch (instruction) {
      case 'a': // NUL-padded string
        if (quantifier === '*') {
          quantifier = data.length - dataPointer;
        } else {
          quantifier = parseInt(quantifier, 10);
        }
        currentData = data.substr(dataPointer, quantifier);
        dataPointer += quantifier;

        currentResult = currentData.replace(/\0+$/, '');
        result[label] = currentResult;
        break;
		
      case 'c': // signed char
        if (quantifier === '*') {
          quantifier = data.length - dataPointer;
        } else {
          quantifier = parseInt(quantifier, 10);
        }

        currentData = data.substr(dataPointer, quantifier);
        dataPointer += quantifier;

        for (i = 0; i < currentData.length; i++) {
          currentResult = currentData.charCodeAt(i);
          if (currentResult >= 128){
            currentResult -= 256;
          }
          result[label + (quantifier > 1 ?
              (i + 1) :
              '')] = currentResult;
        }
        break;

      case 'l': // signed long (always 32 bit, machine byte order)
        if (quantifier === '*') {
          quantifier = (data.length - dataPointer) / 4;
        } else {
          quantifier = parseInt(quantifier, 10);
        }

        currentData = data.substr(dataPointer, quantifier * 4);
        dataPointer += quantifier * 4;

        for (i = 0; i < currentData.length; i += 4) {
          currentResult =
              ((currentData.charCodeAt(i + 3) & 0xFF) << 24) +
              ((currentData.charCodeAt(i + 2) & 0xFF) << 16) +
              ((currentData.charCodeAt(i + 1) & 0xFF) << 8) +
              ((currentData.charCodeAt(i) & 0xFF));
          result[label + (quantifier > 1 ?
              ((i / 4) + 1) :
              '')] = currentResult;
        }

        break;
      case 'f': //float
        ebits = 8;
        fbits = 23;
        dataByteLength = 4;

        if (quantifier === '*') {
          quantifier = (data.length - dataPointer) / dataByteLength;
        } else {
          quantifier = parseInt(quantifier, 10);
        }

        currentData = data.substr(dataPointer, quantifier * dataByteLength);
        dataPointer += quantifier * dataByteLength;

        for (i = 0; i < currentData.length; i += dataByteLength) {
          data = currentData.substr(i, dataByteLength);

          bytes = [];
          for (j = data.length - 1; j >= 0; --j) {
            bytes.push(data.charCodeAt(j));
          }
          result[label + (quantifier > 1 ?
              ((i / 4) + 1) :
              '')] = fromIEEE754(bytes, ebits, fbits);
        }

        break;
      default:
        throw new Error('Warning:  unpack() Type ' + instruction +
            ': unknown format code');
    }
  }
  return result;
}
