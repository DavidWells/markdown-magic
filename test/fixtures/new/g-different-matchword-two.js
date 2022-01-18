

/* block functionName foo={{ rad: 'yellow' }} */
console.log('cool')
/* ⛔️ end ⛔️*/

console.log('hi')

/** block myTransform foo={{ rad: 'purple' }} */
console.log('xyz')
/* ⛔️ end ⛔️*/

/* block wow foo=hi */
console.log('rad')
/* ⛔️ end ⛔️*/

/** 
block what foo={{ rad: 'yellow' }} 
*/
console.log('tester')
/* ⛔️ end ⛔️*/


/**
block greenie 
foo={{ rad: 'green' }} 
**/
console.log('NO')
/* ⛔️ end ⛔️*/


/* block wow foo=cool */
console.log('rad')
/* ⛔️ end ⛔️*/


/* block wow foo=cool */console.log('x')/* end */