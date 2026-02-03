var path = require('path');
var binding_path = path.join(__dirname, 'binding', 'duckdb.node');
var binding = require(binding_path);
module.exports = exports = binding;
