// template-renderer.js
const { enableImageEditing } = require('./template-editor.js');

function renderTemplate(template, container) {
  container.innerHTML = '';
  template.pages.forEach((page, i) => {
    const section = renderBlock(page, i);
    container.appendChild(section);
  });
  enableImageEditing(container);
}

function renderBlock(page, index) {
  const section = document.createElement('section');
  section.className = "px-6 py-20 sm:py-28";
  section.style.backgroundColor = page.bgColor || "#fff";
  section.dataset.pageIndex = index;

  const wrap = (html) => {
    section.innerHTML = html;
    return section;
  };

  switch (page.type) {
    case "cover":
      return wrap(`
        <div class="text-center">
          <h1 contenteditable="true" class="text-5xl font-extrabold" style="color:${page.textColor}">${page.title}</h1>
          <p contenteditable="true" class="mt-4 text-xl" style="color:${page.subTextColor}">${page.author}</p>
          <div class="mt-10 max-w-md mx-auto border-4 rounded-2xl overflow-hidden shadow-xl" style="border-color:${page.borderColor}">
            <img src="${page.image}" data-editable-image data-prompt="${page.prompt || ''}" class="w-full object-cover rounded-lg shadow" />
            <div class="mt-2 flex justify-center gap-4">
              <button class="regen-image-btn px-3 py-1 text-sm bg-blue-500 text-white rounded">♻️ Regenerate</button>
              <label class="cursor-pointer text-sm bg-gray-200 px-3 py-1 rounded">Upload<input type="file" accept="image/*" class="hidden image-uploader" /></label>
            </div>
          </div>
        </div>
      `);

    case "imageText":
      const imageHTML = `
        <div>
          <img src="${page.image}" data-editable-image data-prompt="${page.prompt || ''}" class="rounded-xl border-4 shadow-lg" style="border-color:${page.borderColor}" />
          <div class="mt-2 flex gap-3">
            <button class="regen-image-btn px-2 py-1 text-xs bg-blue-500 text-white rounded">♻️</button>
            <label class="cursor-pointer text-xs bg-gray-300 px-2 py-1 rounded">Upload<input type="file" accept="image/*" class="hidden image-uploader" /></label>
          </div>
        </div>`;

      return wrap(`
        <div class="grid sm:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
          ${page.imagePosition === "left" ? imageHTML : ""}
          <div>
            <h2 contenteditable="true" class="text-3xl font-bold mb-4" style="color:${page.textColor}">${page.heading}</h2>
            <p contenteditable="true" class="text-lg leading-relaxed" style="color:${page.textColor}">${page.paragraph}</p>
          </div>
          ${page.imagePosition === "right" ? imageHTML : ""}
        </div>
      `);

    case "poem":
      return wrap(`
        <div class="text-center max-w-3xl mx-auto">
          <h2 contenteditable="true" class="text-4xl font-extrabold mb-6" style="color:${page.titleColor}">${page.title}</h2>
          <p class="text-xl leading-loose font-medium" style="color:${page.textColor}" contenteditable="true">
            ${page.lines.join("<br>")}
          </p>
        </div>
      `);

    case "ending":
      return wrap(`
        <div class="text-center max-w-2xl mx-auto text-white">
          <h2 contenteditable="true" class="text-4xl font-bold mb-4">${page.title}</h2>
          <p contenteditable="true" class="text-xl mb-10">${page.quote}</p>
          <img src="${page.image}" data-editable-image data-prompt="${page.prompt || ''}" class="mx-auto rounded-xl shadow-lg border-4" style="border-color: ${page.borderColor}" />
          <div class="mt-2 flex justify-center gap-4">
            <button class="regen-image-btn px-3 py-1 text-sm bg-blue-500 text-white rounded">♻️ Regenerate</button>
            <label class="cursor-pointer text-sm bg-gray-200 px-3 py-1 rounded">Upload<input type="file" accept="image/*" class="hidden image-uploader" /></label>
          </div>
        </div>
      `);
  }

  return section;
}

module.exports = {
  renderTemplate
};
