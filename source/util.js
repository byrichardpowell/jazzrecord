//utilities - used in building query strings
JazzRecord.columnNames = function(cols) {
  var columns = "(";
  JazzRecord.each(cols, function(colType, colName) {
    columns += colName + ", ";
  });
  columns = columns.substr(0, columns.length - 2);
  return columns + ")";  
};

JazzRecord.columnValues = function(cols, data) {
  var values = " VALUES(";
  JazzRecord.each(cols, function(colType, colName) {
    values += JazzRecord.typeValue(cols, colName, data[colName]) + ", ";
  }, this);
  values = values.substr(0, values.length - 2);
  return values + ")";  
};

JazzRecord.typeValue = function(cols, field, val) {
  if(!JazzRecord.getType(val))
    return "NULL";
  else
    switch(cols[field]) {
      case "string":
      case "text":
        if(JazzRecord.getType(val) === "string") {
          // escape single quotes and dollar signs.
          // quotes are escaped for SQLite
          val = val.replace(/'/g, "''");
          // dollar signs are escaped for use in calling str.replace in JazzRecord.replaceAndClean()
          val = val.replace(/\$/g, "$$$$");
        }
        return "'" + val + "'";
      
      case "int":
      case "integer":
        val = parseInt(val, 10);
        return JazzRecord.getType(val) === "number" ? val : 0;
      case "number":
      case "float":
        val = parseFloat(val);
        return JazzRecord.getType(val) === "number" ? val : 0;
      
      case "bool":
        if(val)
          return 1;
        else
          return 0;
      default:
        return val;
    }
};