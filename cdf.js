const fs = require('fs');
const NetCDFReader = require('netcdfjs');

// http://www.unidata.ucar.edu/software/netcdf/examples/files.html
const data = fs.readFileSync('public/vv10avg_201909100000_0000.nc');

var reader = new NetCDFReader(data); // read the header
const grib = reader.getDataVariable('vv10avg'); // go to offset and read it
console.log(grib);
