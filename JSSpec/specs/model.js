describe("Model", {
  before_all: function() {
    initJazz();
    
    BlackBox = new JazzRecord.Model({
      table: "black_boxes",
      foreignKey: "black_box_id",
      hasOne: {content: "box_contents"},
      modelMethods: {
        findMiddleBox: function() {
          var middleNumber = Math.round(this.count()/2);
          return this.find(middleNumber);
        }
      },
      validate: {
        atSave: function() {
          this.validatesIsString("label");
          this.validatesIsInt("number");
        }
      }
    });
    
    BoxContent = new JazzRecord.Model({
      table: "box_contents",
      belongsTo: {box: "black_boxes"}
    });
    
    JazzRecord.createTable("black_boxes", {
      id: "number",
      label: "string",
      number: "number"
    });
    
    JazzRecord.createTable("box_contents", {
      id: "number",
      description: "string",
      black_box_id: "number"
    });
  },
  after_all: function() {
    JazzRecord.dropTable("black_boxes");
    JazzRecord.dropTable("box_contents");
    delete BlackBox;
    delete BoxContent;
  },
  "Querying user-provided models": function() {
    value_of(BlackBox.count()).should_be(0);
    
    JazzRecord.each([0,1,2], function(i) {
      var boxNum = i + 1;
      var b = BlackBox.create({label: "Box " + boxNum, number: boxNum});
      b.content = BoxContent.create({description: "Box Contents " + boxNum});
      b.save();
    });

    value_of(BlackBox.count()).should_be(3);
    value_of(BlackBox.find(1).getData()).should_be({id: 1, label: "Box 1", number: 1});
  },
  "Custom query using modelMethods" : function() {
    value_of(BlackBox.findMiddleBox().getData().label).should_be("Box 2");
  },
  "Loading associated records": function() {
    value_of(BlackBox.last().content.description).should_be("Box Contents 3");
  },
  "Should not allow saving of invalid data": function() {
    var invalidBox = BlackBox.create({label: 2, number: "Not a Number"});
    value_of(invalidBox.id).should_be_null();
    value_of(invalidBox.errors).should_include("label");
    value_of(invalidBox.errors).should_include("number");
  },
  "Should allow saving of valid data": function() {
    var validBox = BlackBox.create({label: "A box full of crap", number: 30});
    value_of(validBox.id).should_not_be_null();
  }
});
describe("Finders", {
  before_all: function() {
    initJazz();
    JazzRecord.migrate({refresh:true});
  },
  
  // test for ID or array, custom select, custom order, limit, offset, conditions
  "default order vs custom order": function() {
    value_of(Book.options.order).should_be("author");
    value_of(Book.all()[0].title).should_be("Pragmatic Thinking & Learning: Refactor Your Wetware");
    value_of(Book.all({order:"title"})[0].title).should_be("Even Faster Web Sites");
  },
  "find": function() {
    // single ID
    value_of(Person.find(1).name).should_be("Nick");
    // array of IDs
    value_of(Person.find([1,3,5])).should_have(3, "items");
  },
  "all": function() {
    value_of(Person.all()).should_have(5, "items");
    var people = Person.all();
    value_of(people[people.length - 1].name).should_be("Jesse");
    // custom orders
    value_of(Person.all({order: "name desc"})[0].name).should_be("Terri");
    value_of(Person.all({order: "name asc"})[0].name).should_be("David");
    // custom conditions
    value_of(Person.all({conditions: "name like '%i%'"})).should_have(3, "items");
    value_of(Person.all({conditions: "name like '%k%'"})).should_have(2, "items");
    // custom limit
    value_of(Person.all({limit: 4})).should_have(4, "items");
    // custom offset
    value_of(Person.all({limit: 4, offset: 2})).should_have(3, "items");
  },
  "findBy": function() {
    value_of(Person.findBy("name", "Nick").id).should_be(1);
    // verify even with multiple matching items, only first is returned
    value_of(Person.findBy("home_id", 1).name).should_be("Nick");
  },
  "findAllBy": function() {
    value_of(Person.findAllBy("name", "Nick")).should_have(1, "items");
    // verify with multiple matching items, all are returned
    value_of(Person.findAllBy("home_id", 1)).should_have(2, "items");
  },
  "first": function() {
    value_of(Animal.first().speak()).should_be("rawr!");
    // without custom select, other columns are not ommitted
    value_of(Person.first()).should_include("age");
    value_of(Person.first()).should_include("home_id");
    value_of(Person.first()).should_include("has_vehicle");
    
    // custom select, other columns should be ommitted
    value_of(Person.first({select: "name"}).name).should_be("Nick");
    value_of(Person.first({select: "name"})).should_not_include("age");
    value_of(Person.first({select: "name"})).should_not_include("home_id");
    value_of(Person.first({select: "name"})).should_not_include("has_vehicle");
  },
  "last": function() {
    value_of(Person.last().name).should_be("Jesse");
  },
  "count": function() {
    value_of(Person.count()).should_be(5);
  },
  "Finding with columns hash for conditions": function() {
    value_of(Person.find({conditions:{name: "Nick"}}).id).should_be(1);
    value_of(Person.find({conditions:{name: "Karen", age: 30}}).id).should_be(4);
  },
  "Finding with arbitrary comparison operators for conditions": function() {
    value_of(Person.find({conditions:{age: ["<", 24]}}).name).should_be("David");
  }
});

// test each of 4 kinds of associations
describe("Finder association loading", {
  before_all: function() {
    initJazz();
    JazzRecord.migrate({refresh:true});
  },
  "Loading a hasOne association": function() {
    value_of(Person.first().vehicle.model).should_be("Forenza");
  },
  "Loading a belongsTo association": function() {
    value_of(Person.first().home.address).should_be("4605 Deming Ave");
  },
  "Loading a hasMany association": function() {
    value_of(Home.first()).should_have(2, "people");
    value_of(Home.first().people[0].name).should_be("Nick");
  },
  "Loading hasAndBelongsToMany associations": function() {
    value_of(HighSchoolClass.first()).should_have(2, "students");
    value_of(HighSchoolClass.first().students[0].name).should_be("Joe Bob");
    
    value_of(Student.first()).should_have(2, "classes");
    value_of(Student.first().classes[1].name).should_be("Phys. Ed.");
  }
});

describe("Updating and destroying from Model", {
  before_each: function() {
    initJazz();
    JazzRecord.migrate({refresh: true});
  },
  "Updating a single record": function() {
    // update from model rather than record
    var p = Person.update(Person.first().id, {name: "Nicholas"});
    value_of(p.name).should_be("Nicholas");
  },
  "Updating multiple specified records": function() {
    var folks = new JazzRecord.Hash({
      1: {
        name: "Jimmy"
      },
      2: {
        name: "Rosalynn"
      },
      3: {
        name: "Deep"
      }
    });
    Person.update(folks.getKeys(), folks.getValues());
    value_of(Person.find(1).name).should_be("Jimmy");
    value_of(Person.find(2).name).should_be("Rosalynn");
    value_of(Person.find(3).name).should_be("Deep");
  },
  "Updating fails validation": function() {
    //should still return modified record obj
    var p = Person.update(1, {age: 111});
    value_of(p.errors).should_include("age");
  },
  "Updating all records": function() {
    Person.updateAll({name: "Juan"});
    var people = Person.all();
    JazzRecord.each(people, function(record, index) {
     value_of(record.name).should_be("Juan");
    });
  },
  "Updating all records conditionally": function() {
    value_of(Person.find(2).name).should_be("Terri");
    Person.updateAll({name: "Theresa"}, {name: "Terri"});
    value_of(Person.find(2).name).should_be("Theresa");
  },
  "Destroying a record from Model": function() {
    value_of(Person.find(1).name).should_be("Nick");
    Person.destroy(1);
    value_of(Person.find(1)).should_be_null();
  },
  "Destroying multiple records from Model": function() {
    var people = [1,2,3];
    Person.destroy(people);
    JazzRecord.each(people, function(id, index) {
      value_of(Person.find(id)).should_be_null();
    });
  },
  "Destroying all records": function() {
    value_of(Person.count()).should_be(5);
    Person.destroyAll();
    value_of(Person.count()).should_be(0);
  },
  "Destroying all records conditionally": function() {
    value_of(Animal.count()).should_be(5);
    Animal.destroyAll({say: "rawr!"});
    value_of(Animal.count()).should_be(3);
  }
});