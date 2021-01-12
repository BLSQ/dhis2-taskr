# Just enough js

This tutorial tries to get you comfortable with javascript and know the minimum to get you up and running with dhis2 taskr.

You can paste these samples in your taskr recipe, click run and check the output.

## Hello world

```
// this is a comment, this line is not executed by the interpreter
return "Hello, World!";

```

## Variables and assignment


```js
// declare  and initialize the variable
let mymessage = "hello"

// modify it a first time
mymessage = "hello world"

// modify it a second time
mymessage = "Hello, World!"

return mymessage;

```

Who wins ? the last assignement wins.


## Constants

What if I want to initialize a variable and make sure it won't change later ?

```js
// declare and initialize the constant
const mymessage = "hello"

// try modify it a first time
mymessage = "hello world"

return mymessage;

```

```
=> invalid assignment to const 'mymessage': line4:1
```

It means you are not allowed by the interpreter to change the value of mymessage.
This is generally  a good idea to use `const` where possible you know, leaving `let` for more complex cases where mutation of the variable is really desirable.



## Strings

```js
// strings can be single quoted
const username = 'stéphan';

// or double quoted
const sentence = "It's not easy to begin with js";

// you can also use this backtick notation to interpolate a string and inject the value of the constant username into it
const greetings = `Hello ${username} ! `;

// or just concatenate : combine 2 strings in to a new one
return greetings + sentence;

```

`
=> Hello stéphan ! It's not easy to begin with js
`

## Properties, booleans, and control flow

```js
const lengthOfTheWord = "stéphan".length; // Accessing the "length" property of a string

return lengthOfTheWord;

```
So my first name contains 7 characters 

`
=> 7
`

### boolean expressions

now we might want to know if the length is really equal to 7, note the usage of `==` (and not `=` which is the assignement operator) 

```js
const lengthOfTheWord = "stéphan".length; // Accessing the "length" property of a string

return lengthOfTheWord == 7;
```

The return value is a boolean, the boolean is either true or false.

You can then tweak the boolean condition to check if the length :

 * is greater or equal than 7 : ` >= 7`
 * is strictly greater than 7 : ` > 7`
 * is lower or equal than 7 : ` <= 7`
 * is strictly lower than 7 : ` < 7`
 
 check the outputs corresponds to what you initially thought.
 
 ### decision : if ... then ... else
 
 Note we can use the booleans to make decision in our code. 
 Let's check if a password is too short.
 
 ```js
 const password = "tooweak"
 
 if (password.length < 9) {
 
    return "Password is too short.";
    
 } else {
 
    return "Password is long enough";
    
 }
 ```
### Combining booleans


 ```js
 
const password = "tooisnotweak456";

const isLongEnough = password.length > 9;
const hasNumbers = /\d/.test(password); // this strange notation is called a regexp, we will see that later
const hasLetters = /[A-Za-z]/.test(password);

if (isLongEnough && hasNumbers && hasLetters) {
  return "Password is good";
} else {
  return "Password is weak";
}
 
 ```
 
 The `&&` operator is the logical AND operator, both booleans need to be true to return a true
 
 ```js
 return true && true 
 ```
 ```
 => true
 ```
 ```js
 return false && true 
 ```
 ```
 => false
 ```
```js
 return true && false
 ```
 ```
 => false
 ```
 
 ```js
 return false && false
 ```
 ```
 => false
 ```

Another operator you might want to use is the OR operator `||`, if one of the boolean is true then it's true

 ```js
 return true || true 
 ```
```
 => true
```
 
 ```js
 return false || true 
 => true

 ```js
 return true || false
```
```
 => true
```
 
 ```js
 return false || false
 ```
```
=> false
 ```

Negation of a condition with the not ! operator

```js
 return !true
```
```
=> false
```

```js
return !false
```
```
=> true
```

We can turn the previous example in "less" comprehensive form by using `!` and `||`

 ```js
 
const password = "tooisnotweak456";

const isLongEnough = password.length > 9;
const hasNumbers = /\d/.test(password); // this strange notation is called a regexp, we will see that later
const hasLetters = /[A-Za-z]/.test(password);

if (!isLongEnough || !hasNumbers || !hasLetters) {
  return "Password is weak";
} else {
  return "Password is good";
}
 
```
As you would write in english, avoid complex negations ;)


### Methods

On string some properties are functions, and we invoke it with the parentheses

 ```js
return "Stéphan Mestach".toLowerCase();
 ```
 ```
 => stéphan mestach
 ```
 
 Let's say want to put everything to upper case ? How would you do it ?
 
 ```js
 return "Stéphan Mestach".toUpperCase();
 ```
 ```
 => STÉPHAN MESTACH
 ```
 
 Does a sentence contains another sentence ?
 
 ```js
 const orgUnitName = "chc MontLégia"
 return orgUnitName.toUpperCase().includes("CHC");
 ```
 ```
 => true
 ```
 
### Arrays

#### split & access

You can split a string based on a seperator (in our case a blank) 
By calling the method `split` with the separator
You can then access the various words via `[]`, indices starts at 0
```js
const words = "chc MontLégia".split(" ");
// return the firs word
return words[0]
```
```
=> chc
```


```js
const words = "chc MontLégia".split(" ");
// return the firs word
return words[1]
 ```
```
=> MontLégia
```

```js
const words = "chc MontLégia".split(" ");
// return an array with all the words
return words;
```
here taskr behaves a bit differently, it will show you a table
with columns being numbers from 0 to 8 holding each letter of the words

#### joining
```js
const words = "chc MontLégia".split(" ");
// return an array with all the words
return words.join("\t");
```
the words with a tab between them
```
chc MontLégia
```

#### slicing

```js
const words = "to be or not to be".split(" ");
// return an array with all the words
return words.slice(4)
```
return an array starting after the 4 word 
```
to
be
```
indices can be negative here
```js
const words = "to be or not to be".split(" ");
// return an array with all the words
return words.slice(-3);
```
the last 3 words 
```
not
to
be
```

#### iterating / pushing

```js
const words = "to be or not to be".split(" ");

const results = [];
for (let word of words) { // iterate on all the words
  const upcasedWord = word.toUpperCase()
  results.push(upcasedWord);
}
return results;
```

```
TO
BE
OR
NOT
TO
BE
```

#### mapping

The previous example can be simplified by using the map method.
The method receives a function where the first parameter is the item of the array.

```js
const words = "to be or not to be".split(" ");

const results = words.map( word => word.toUpperCase())

return results;
```
#### filtering

Let's say we want to find all the words that contains the letter e
We can call the filter method and pass the function that returns true if the condition is filled

```js
const words = "to be or not to be".split(" ");

const results = words.filter( word => word.includes("e"))

return results;
```

```
be
be
```

## Objects

Objects are everywhere in the world and in dhis2.

As an exemple, an organisationUnit can be represented as an object with multiple properties like a name, an id, an array of organisationUnitGroups

```js
const myCountry = {
  id: "ImspTQPwCqd",
  name: "Belgium",
  level: 1,
  organisatisationUnitGroups: [{ id: "xE7jOejl9FI" }]
};

return myCountry;
```
Note that taskr return the object but in the json format.

Objects can have more "behaviour" with methods as we saw for strings (split, join,...)

You can access property in different ways 

```js
const myCountry = {
  id: "ImspTQPwCqd",
  name: "Belgium",
  level: 1,
  organisatisationUnitGroups: [{ id: "xE7jOejl9FI" }]
};

return myCountry.name;
```

If you have a variable with the property name (as string)

```js
const myCountry = {
  id: "ImspTQPwCqd",
  name: "Belgium",
  level: 1,
  organisatisationUnitGroups: [{ id: "xE7jOejl9FI" }]
};

const field = "name"

return myCountry[field];
```

Generally these objects are mutable, can change their property/field values 

```js
const myCountry = {
  id: "ImspTQPwCqd",
  name: "Belgium",
  level: 1,
  organisatisationUnitGroups: [{ id: "xE7jOejl9FI" }]
};

myCountry.name = "Belgique"  // modify the name
myCountry["id"] = "OsPTWNqq26W" // modify the id

return myCountry;
```

```json
{
  "id": "OsPTWNqq26W",
  "name": "Belgique",
  "level": 1,
  "organisatisationUnitGroups": [
    {
      "id": "xE7jOejl9FI"
    }
  ]
}
```

You can also add field to the object. Either using the `.property=` or by field name `.["fieldname"]=` :

```js
const myCountry = {
  id: "ImspTQPwCqd",
  name: "Belgium",
  level: 1,
  organisatisationUnitGroups: [{ id: "xE7jOejl9FI" }]
};

myCountry.coordinates = "[4.4699, 50.5039]"; // add a coordinates field

myCountry["color"] = "blue"; // add a color field

return [myCountry];
```

Now we return an array containing an orgunit with 2 extra fields.
You will notice that taskr display the result as a Table and since the objects in the array has a coordinates it shows also a Map.

