const inheritHeaders = (actualHeaders, inheritingHeaders) => {
  for (let name in inheritingHeaders) {
    if (actualHeaders[name] === undefined) {
      actualHeaders[name] = inheritingHeaders[name];
    }
  }

  return actualHeaders;
};

module.exports = inheritHeaders;
