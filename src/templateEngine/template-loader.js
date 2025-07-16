// template-loader.js
function loadTemplate(path) {
  return fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load template: ${path}`);
      return res.json();
    });
}

module.exports = {
  loadTemplate
};
