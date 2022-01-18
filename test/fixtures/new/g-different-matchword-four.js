

/* block functionName foo={{ rad: 'yellow' }} */
console.log('cool')
/* ⛔️ block-end ⛔️*/

console.log('hi')

/** block myTransform foo={{ rad: 'purple' }} */
console.log('xyz')
/* ⛔️ block-end ⛔️*/

/* block wow foo=hi */
console.log('rad')
/* ⛔️ block-end ⛔️*/

/** 
block what foo={{ rad: 'yellow' }} 
*/
console.log('tester')
/* ⛔️ block-end ⛔️*/


/**
block greenie 
foo={{ rad: 'green' }} 
**/
console.log('NO')
/* ⛔️ block-end ⛔️*/


/* block wow foo=cool */
console.log('rad')
/* ⛔️ block-end ⛔️*/


/* block wow foo=cool */console.log('x')/* block-end */