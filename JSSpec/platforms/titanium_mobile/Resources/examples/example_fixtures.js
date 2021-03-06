var fixtures = {
  tables: {
    people: [
      {name: "Nick", age: 29, gender: "m", home_id: 1, has_vehicle: true},
      {name: "Terri", age: 32, gender: "f", home_id: 1, has_vehicle: true},
      {name: "David", age: 23, gender: "m"},
      {name: "Karen", age: 30, gender: "f"},
      {name: "Jesse", age: 24, gender: "m", has_vehicle: true}
    ],
    homes: [
      {address: "4605 Deming Ave"},
      {address: "15009 Ulderic Dr"},
      {address: "65 Branch Way"}
    ],
    vehicles: [
      {make: "Suzuki", model: "Forenza", year: 2004, person_id: 1},
      {make: "Nissan", model: "Altima", year: 2005, person_id: 2}
    ],
    high_school_classes: [
      {name: "English"},
      {name: "Phys. Ed."}
    ],
    students: [
      {name: "Joe Bob", home_id: 1},
      {name: "Peggy Sue"}
    ],
    animals: [
      {name: "Tigra", species: "tiger", say: "rawr!"},
      {name: "Shere Khan", species: "tiger", say: "rawr!"},
      {name: "Tweety", species: "bird", say: "bawk!!"},
      {name: "Punkin", species: "cat", say: "meow!!"},
      {name: "Akai", species: "dog", say: "woof!"}
    ],
    books: [
      {title: "Even Faster Web Sites", author: "Steve Souders", category: "Web Programming", person_id: 1},
      {title: "Quicksilver", author: "Neal Stephenson", category: "Fiction", person_id: 1},
      {title: "Pragmatic Thinking & Learning: Refactor Your Wetware", author: "Andy Hunt", category: "Programming", person_id: 1}
    ]
  },
  
  mappingTables: {
    high_school_classes_students: [
      {high_school_class_id: 1, student_id: 1},
      {high_school_class_id: 1, student_id: 2},
      {high_school_class_id: 2, student_id: 1}
    ]
  }
};