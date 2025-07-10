const { EPUB } = require("epub-gen-memory");

async function generateEpubBuffer({ html, title, author }) {
  const options = {
    title: title || "Untitled",
    author: author || "LaunchBook AI",
    content: [
      {
        title: title || "Untitled",
        data: html,
      }
    ]
  };

  return await EPUB(options);
}

module.exports = { generateEpubBuffer };
