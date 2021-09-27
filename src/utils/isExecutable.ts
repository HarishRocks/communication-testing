const isExecutable = () => {
  return process.env.EXECUTION_TYPE === 'EXECUTABLE';
};

export default isExecutable;
