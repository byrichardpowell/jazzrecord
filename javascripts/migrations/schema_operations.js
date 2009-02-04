JazzRecord.setupSchema = function(force) {
  JazzRecord.createTable("schema_migrations", {version: "text"});
  if(JazzRecord.count("SELECT COUNT(*) FROM schema_migrations") === 0) {
    var sql = "INSERT INTO schema_migrations (version) VALUES(0)";
    JazzRecord.run(sql);
  }
  if(force && JazzRecord.count("SELECT COUNT(*) FROM schema_migrations") === 1) {
    var sql = "UPDATE schema_migrations set version = 0";
    JazzRecord.run(sql);
  }
  JazzRecord.createTable("schema_definitions", {
    id: "number",
    table_name: "text",
    column_names: "text",
    column_types: "text"
  });
};

JazzRecord.schema = new JazzRecord.Model({
  table: "schema_definitions",
  columns: {
    id: "number",
    table_name: "text",
    column_names: "text",
    column_types: "text"
  }
});

JazzRecord.writeSchema = function(tableName, cols) {
  if(tableName === "schema_definitions" || tableName === "schema_migrations")
    return;
  var sql = "";
  var colsHash = new JazzRecord.Hash(cols);
  var cols = colsHash.getKeys().join();
  var types = colsHash.getValues().join();
  var table = JazzRecord.schema.findBy("table_name", tableName);
  if(table) {
    table.column_names = cols;
    table.column_types = types;
  }
  else {
    JazzRecord.schema.create({
      table_name: tableName,
      column_names: cols,
      column_types: types
    });
  }
};

JazzRecord.readSchema = function(tableName) {
  if(tableName === "schema_definitions" || tableName === "schema_migrations")
    return;
  var table = JazzRecord.schema.findBy("table_name", tableName);
  var column_names = table.column_names.split(",");
  var column_types = table.column_types.split(",");
  var cols = {};
  JazzRecord.each(column_names, function(col, i) {
    cols[col] = types[i];
  });
  return cols;
};

JazzRecord.currentSchemaVersion = function() {
  var sql = "SELECT version FROM schema_migrations LIMIT 1";
  return parseInt(JazzRecord.run(sql)[0].version, 10);
};

JazzRecord.updateSchemaVersion = function(number) {
  var sql = "UPDATE schema_migrations SET version = " + number;
  JazzRecord.run(sql);
};

JazzRecord.createTable = function(name, columns) {
  if(!(JazzRecord.isDefined(name) && JazzRecord.isDefined(columns))) {
    return;
  }
  var sql = "CREATE TABLE IF NOT EXISTS " + name;
  if(columns) {
    sql += "(";
    JazzRecord.each(columns, function(colType, colName) {
      if(colName === "id")
        sql += "id INTEGER PRIMARY KEY AUTOINCREMENT, ";
      else
        sql += (colName + " " + colType.toString().toUpperCase() + ", ");
    });
    sql = sql.substr(0, sql.length - 2);
    sql += ")";
    JazzRecord.run(sql);
  }
  JazzRecord.writeSchema(name, columns);
};

JazzRecord.dropTable = function(name) {
  var sql = "DROP TABLE " + name;
  JazzRecord.run(sql);
  var schemaTable = JazzRecord.schema.findBy("table_name", name);
  schemaTable.destroy();
};

JazzRecord.renameTable = function(oldName, newName) {
  var sql = "ALTER TABLE " + oldName + " RENAME TO " + newName;
  JazzRecord.run(sql);
  var schemaTable = JazzRecord.schema.findBy("table_name", oldName);
  schemaTable.updateAttribute("table_name", newName);
};

JazzRecord.addColumn = function(tableName, columnName, dataType) {
  var sql = "ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + dataType.toUpperCase();
  JazzRecord.run(sql);
  var cols = JazzRecord.readSchema(tableName);
  cols[columnName] = dataType;
  JazzRecord.writeSchema(tableName, cols);
};

JazzRecord.modifyColumn = function(tableName, columnName, options) {
  if (!options) {
    throw("MIGRATION_EXCEPTION: Not a valid column modification");
  }
    
  var model = JazzRecord.models.get(tableName);
  var newCols = {};
     
  JazzRecord.each(model.options.columns, function(colType, colName) {
    switch(options["modification"]) {
      case "remove":
        if(colName !== columnName)
          newCols[colName] = colType;
        break;
    
      case "rename":
        if(colName !== columnName) {
          newCols[colName] = colType;
        }
        else {
          newCols[options.newName] = colType;
        }
        break;
    
      case "change":
        if(colName !== columnName) {
          newCols[colName] = colType;
        }
        else {
          newCols[colName] = options.newType;
        }
        break;
    
      default:
        throw("MIGRATION_EXCEPTION: Not a valid column modification");
    }
  });

  var records = JazzRecord.run('SELECT * FROM ' + tableName);
  JazzRecord.dropTable(tableName);
  JazzRecord.createTable(tableName, newCols);

  JazzRecord.each(records, function(record) {
    switch(options.modification) {
      case "remove":
        delete record[columnName];
        JazzRecord.save(tableName, newCols, record);
        break;
    
      case "rename":
        record[options.newName] = record[columnName];
        delete record[columnName];
        JazzRecord.save(tableName, newCols, record);
        break;
    
      case "change":
        JazzRecord.save(tableName, newCols, record);
        break;
    
      default:
        throw("MIGRATION_EXCEPTION: Not a valid column modification");
    }
  });
};

JazzRecord.removeColumn = function(tableName, columnName) {
  JazzRecord.runTransaction(function() {
    var options = {
      modification: "remove"
    };
    JazzRecord.modifyColumn(tableName, columnName, options);
  });
};

JazzRecord.renameColumn = function(tableName, columnName, newColumnName) {
  JazzRecord.runTransaction(function() {
    var options = {
      modification: "rename",
      newName: newColumnName
    };
    JazzRecord.modifyColumn(tableName, columnName, options);
  });
};
JazzRecord.changeColumn = function(tableName, columnName, type) {
  JazzRecord.runTransaction(function() {
    var options = {
      modification: "change",
      newType: type
    };
    JazzRecord.modifyColumn(tableName, columnName, options);
  });
};
