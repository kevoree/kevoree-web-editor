module.exports = function handleErrors() {
  // Keep gulp from hanging on this task
  this.emit('end');
};
