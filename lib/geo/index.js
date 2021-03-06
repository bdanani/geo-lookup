fs = require ('fs');

/** ipPrefixTree: The main data structure used to store the ip address mapping
  * The first 2 bytes of the ip will be stored in a 2-level tree, each with 256 node elements.
  * The last 2 bytes of the ip will be stored as a leaf node in the third branch of the prefix tree, 
  * which can have index ranging from 0 to 65535. Each leaf node will store the beginning index, 
  * country name, and the ending index of the ip address, to make advantage of the range values.
  */
var ipPrefixTree = {};

/**
  * Returns the number of elements in a Javascript object (Associative array) or array
  * @param {Object} object to be inspected
  * @return {Number} size
  */
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


/**
  * Returns the long representation of ipv4 address. This assumes ip is in the correct format
  * @param {string} ip address in ipv4 format
  * @return {Number} long representation of ipv4 address
  */
exports.ip2long = function ip2long (ip) {
    var arr = ip.split (".");
    var result =  arr[0] * 16777216 + arr[1] * 65536 + arr[2] * 256 + parseInt(arr[3]);
    return result;
};


/**
  * Returns the ipv4 array representation of an ipv4 address given in long format. This assumes longValue is a valid input.
  * @param {Number} longValue
  * @return {Array} arr[4]
  */
function long2iparray (longValue) {
    arr = [];
    var temp = longValue / 256;
    arr[3] = 256 * (temp - Math.floor (temp));
    temp = Math.floor(temp) / 256;
    arr[2] = 256 * (temp - Math.floor (temp));
    temp = Math.floor (temp) / 256;
    arr[1] = 256 * (temp - Math.floor (temp));
    arr[0] = Math.floor (temp);
    return arr;
};



/**
  * Returns the ipv4 decimal string representation (x.x.x.x) of a long-formatted ipv4 input. 
  * This assumes longValue is a valid input.
  * @param {Number} longValue
  * @return {String} ip address in ipv4 format
  */
exports.long2ip = function long2ip (longValue) {
    arr = long2iparray (longValue);
    ip = arr[0] + '.' + arr[1] + '.' + arr[2] + '.' + arr[3];
    return ip;
};



/**
  * Load the ip data from geo.txt input file.
  * The data will be stored in the ipPrefixTree.
  */
exports.loadData = function loadData () {
    var data = fs.readFileSync (__dirname + '/../../data/geo.txt', 'utf8');
    data = data.toString().split("\n"); //split input files line by line
    var i = 0, line, j, a, b, c, d, start, end, range, maxPossibleRange, country, startArrayIndex;
    console.log ("# of input lines = " + Object.size(data));

    /* Split each input line and grab the start of the ip range (in long format), 
     * end of the range (in long format), and the country name. 
     */
    while (line = data[i++]) {
        line = line.split("\t"); //split using tab as delimited
        start = parseInt (line[0]); // start of ip range in long format
        end = parseInt (line[1]); // end of ip range in long format
        country = line[3]; 

        for (j = start; j <= end; ++j) { // loop through ip range
            arr = long2iparray (j);
            a = arr[0], b = arr[1], c = arr[2], d = arr[3];

            if (!ipPrefixTree[a] ) {  // if the first level branch of the tree is not already exists
                ipPrefixTree[a] = {}; // create the first level node
            }
            if (!ipPrefixTree[a][b]) { //if the second level branch of the tree is not already exists
                ipPrefixTree[a][b] = {}; // create the second level node
            }
            // calculate the start index of the leaf node (value can be between 0 and 65535)
            // store the country name and starting index of the range values
            startArrayIndex = (c * 256) + d; 
            ipPrefixTree[a][b][startArrayIndex] = new Object();
            (ipPrefixTree[a][b][startArrayIndex]).country = country;
            (ipPrefixTree[a][b][startArrayIndex]).begin = startArrayIndex; 
            
            //Taking advantange of the range, we can prevent the creation of un-necessary leaf nodes
            //maxPossibleRange: the maximum number of IP addresses of the same IP class (class B) that can possibly owned by this country.
            //range: remaining ip addresses that belongs to this country according to the given range values in the input line, which may include more than one IP class (class B).
            maxPossibleRange = 65535 - startArrayIndex; 
            range = end - j; 
            if ( range > maxPossibleRange){ //range includes IP of other class B group
                (ipPrefixTree[a][b][startArrayIndex]).end = 65535; // mark 65535 as the end index
                j += maxPossibleRange; // increment counter and jump directly to the next IP class (optimisation step)
            }
            else { // remaining range is within the same IP class (class B).
	        (ipPrefixTree[a][b][startArrayIndex]).end = startArrayIndex + range;
                j += range; // increment counter, and iteration will move to the next input line (optimisation step)
            }
        }
    }
};




/**
  * Print the entire prefix tree (lookup table)
  */
exports.printLookupTable = function printLookupTable (){
  for (var a = 0; a < Object.size (ipPrefixTree); ++a){
    for (var b = 0; b < Object.size (ipPrefixTree[a]); ++b){
      console.log (ipPrefixTree[a][b]);
    }
  }
};




/**
  * Geo-location lookup that returns the country where the ip address belongs. 
  * @param {String} ip address in ipv4 format
  * @return {String / null} Country prefix or null if not found
  */
exports.lookup = function lookup (ip) {
    longValue = this.ip2long (ip);
    var arr = ip.split (".");
    //calculat actual index location in the third branch of the prefix tree
    var  index = (arr[2] * 256) + parseInt(arr[3]); 
    if (ipPrefixTree[ arr[0] ] && ipPrefixTree [arr[0]][arr[1]]) { // if there are exists tree nodes in the first branch and second branch of the prefix tree that correspong to this ip address
        lookupArray = ipPrefixTree [arr[0]][arr[1]];
        for (val in lookupArray) {// check if the ip is within the range of this particular IP class
          if (lookupArray[val].begin <= index && lookupArray[val].end >= index)
               return lookupArray[val].country;
        } // not found
        return null;
    }
    return null;
}

