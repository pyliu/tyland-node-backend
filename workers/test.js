const { parentPort } = require('worker_threads');

parentPort.on('message', value => {
    console.info(value);
    parentPort.postMessage('report to master');
});