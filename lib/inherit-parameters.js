const inheritParameters = (actualParameters, inheritingParameters) => {
  for (let name in inheritingParameters) {
    if (actualParameters[name] === undefined) {
      actualParameters[name] = inheritingParameters[name];
    }
  }

  return actualParameters;
};

module.exports = inheritParameters;
