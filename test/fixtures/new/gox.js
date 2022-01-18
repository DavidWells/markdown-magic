

/* DOCS:START functionName foo={{ rad: 'yellow' }} */
console.log('cool')
/* ⛔️ DOCS:END ⛔️*/

console.log('hi')

/** DOCS:START myTransform foo={{ rad: 'purple' }} */
console.log('xyz')
/* ⛔️ DOCS:END ⛔️*/

/* DOCS:START wow foo=hi */
console.log('rad')
/* ⛔️ DOCS:END ⛔️*/

/** 
DOCS:START what foo={{ rad: 'yellow' }} 
*/
console.log('tester')
/* ⛔️ DOCS:END ⛔️*/


/**
DOCS:START greenie 
foo={{ rad: 'green' }} 
**/
console.log('NO')
/* ⛔️ DOCS:END ⛔️*/


/* DOCS:START wow foo=cool */
console.log('rad')
/* ⛔️ DOCS:END ⛔️*/


/* DOCS:START wow foo=cool */console.log('x')/* ⛔️ DOCS:END ⛔️*/