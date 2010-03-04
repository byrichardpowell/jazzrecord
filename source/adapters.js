JazzRecord.Adapter = function() {
  this.run = this.count = this.save = function(query) {
    JazzRecord.puts(query);
  };
};

JazzRecord.Adapter.prototype = {
  runTransaction: function(func, bind) {
    JazzRecord.run("BEGIN");
    try {
      func.apply(bind || this);
      JazzRecord.run("END");
    }
    catch(e) {
      JazzRecord.run("ROLLBACK");
    }
  }  
};

JazzRecord.AirAdapter = function(options) {
  JazzRecord.setOptions.call(this, options, {
    dbFile: "jazz_record.db"
  });
  JazzRecord.extend.call(this, JazzRecord.Adapter);

  this.connection = new air.SQLConnection();
  this.dbFile = air.File.applicationStorageDirectory.resolvePath(this.options.dbFile);
  this.connection.open(this.dbFile, air.SQLMode.CREATE);
  this.statement = new air.SQLStatement();
  this.statement.sqlConnection = this.connection;
};

JazzRecord.AirAdapter.prototype = {
  run: function(query) {
    this.parent.run(query);
    this.statement.text = query;
    this.statement.execute();
    var result = this.statement.getResult();
    return result.data;
  },
  
  count: function(query) {
    this.parent.count(query);
    query = query.toUpperCase();
    return this.run(query)[0]["COUNT(*)"];
  },
  
  save: function(query) {
    this.parent.save(query);
    this.statement.text = query;
    this.statement.execute();
    return this.statement.getResult().lastInsertRowID;
  },
  
  runTransaction: function(func, bind) {
    this.connection.begin();
    try {
      func.apply(bind || this);
      this.connection.commit();
    }
    catch(e) {
      this.connection.rollback();
    }
  }
};

JazzRecord.GearsAdapter = function(options) {
  JazzRecord.setOptions.call(this, options, {
    dbFile: "jazz_record.db"
  });
  JazzRecord.extend.call(this, JazzRecord.Adapter);

  this.db = google.gears.factory.create("beta.database");
  this.db.open(this.options.dbFile);
  this.result = null;
};

JazzRecord.GearsAdapter.prototype = {
  run: function(query) {
    this.parent.run(query);
    this.result = this.db.execute(query);
    var rows = [];
    if(query.indexOf("CREATE") > -1) {
      return rows;
    }
    while(this.result.isValidRow()) {
      var row = {};
      for(var i = 0, j = this.result.fieldCount(); i < j; i++) {
        var field = this.result.fieldName(i);
        row[field] = this.result.field(i);
      }
      rows.push(row);
      this.result.next();
    }
    this.result.close();
    return rows;
  },
  
  count: function(query) {
    this.parent.count(query);
    this.result = this.db.execute(query);
    var number = this.result.field(0);
    this.result.close();
    return number;
  },
  
  save: function(query) {
    this.parent.save(query);
    this.db.execute(query);
    return this.db.lastInsertRowId;
  }
};

JazzRecord.TitaniumAdapter = function(options) {
  // use the synchronous DB API in Titanium 0.4+ which
  // is API compatible with Gears DB API
  JazzRecord.setOptions.call(this, options, {
    dbFile: "jazz_record.db"
  });
  JazzRecord.extend.call(this, JazzRecord.Adapter);

  this.db = Titanium.Database.open(this.options.dbFile);
  this.result = null;
};

JazzRecord.TitaniumAdapter.prototype = JazzRecord.GearsAdapter.prototype;

JazzRecord.HTML5Adapter = function(options) {
  JazzRecord.setOptions.call(this, options, {
    dbFile: "jazz_record.db"
  });
  JazzRecord.extend.call(this, JazzRecord.Adapter, options);
  this.db = openDatabase(this.options.dbFile);
};

JazzRecord.HTML5Adapter.prototype = {
  run: function(query, success, error) {
    this.parent.run(query);
    this.db.transaction(function(tx) {
      tx.executeSql(query, [], function(tx, resultSet) {
          var rows = [];
          for(var i = 0, j = resultSet.rows.length; i < j; i++) {
            rows.push(resultSet.rows.item(i));
          }
          if(success)
            success(rows);
        }, function(tx, err) {
          if(error)
            error(err.message);
          else
            JazzRecord.puts("There was an error: " + err.message);
        });
    });
  },

  count: function(query, success, error) {
    this.parent.count(query);
    this.db.transaction(function(tx) {
      tx.executeSql(query, [], function(tx, resultSet) {
        if(success)
          success(resultSet.rows.item(0)["COUNT(*)"]);
        }, function(tx, err) {
        if(error)
          error(err.message);
        else
          JazzRecord.puts("There was an error: " + err.message);
      });
    });
  },

  save: function(query, success, error) {
    this.parent.save(query);
    this.db.transaction(function(tx) {
      tx.executeSql(query, [], function(tx, resultSet) {
        if(success)
          success(resultSet.insertId);
        }, function(tx, err) {
        if(error)
          error(err.message);
        else
          JazzRecord.puts("There was an error: " + err.message);
      });
    });
  }
};