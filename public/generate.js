const template = {
  id: "kids_template_1",
  name: "Dreamy Adventure",
  pages: [
    {
      type: "cover",
      bgColor: "#fef6e4",
      title: "🌈 The Magical Forest",
      author: "Ashish Kumar",
      image: "cover.jpg",
      textColor: "#f582ae",
      subTextColor: "#001858",
      borderColor: "#8bd3dd"
    },
    {
      type: "imageText",
      bgColor: "#8bd3dd",
      heading: "Once Upon a Time...",
      paragraph: "In a faraway land...",
      image: "img1.jpg",
      textColor: "#001858",
      imagePosition: "left",
      borderColor: "#ffffff"
    },
    {
      type: "poem",
      bgColor: "#fef6e4",
      title: "🌟 A Magical Moment",
      lines: [
        "Through forests deep and skies so wide,",
        "Lily soared with dreams as guide.",
        "With Ollie’s help, she found the light,",
        "That made the stars shine extra bright."
      ],
      textColor: "#001858",
      titleColor: "#f582ae"
    }
  ]
};

function renderTemplate(template) {
  const container = document.getElementById('live-preview');
  container.innerHTML = '';

  template.pages.forEach(page => {
    const section = document.createElement('section');
    section.style.backgroundColor = page.bgColor;
    section.className = "p-10 text-center";

    if (page.type === 'cover') {
      section.innerHTML = `
        <h1 class="text-5xl font-extrabold text-[${page.textColor}]">${page.title}</h1>
        <p class="mt-4 text-xl text-[${page.subTextColor}]">Written by ${page.author}</p>
        <div class="mt-10 mx-auto w-full max-w-md border-4 rounded-2xl overflow-hidden shadow-xl" style="border-color: ${page.borderColor};">
          <img src="${page.image}" class="w-full object-cover" />
        </div>
      `;
    } else if (page.type === 'imageText') {
      section.innerHTML = `
        <div class="grid sm:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
          ${page.imagePosition === 'left' ? `
            <img src="${page.image}" class="rounded-xl shadow-lg border-4" style="border-color: ${page.borderColor}" />
            <div class="text-left text-[${page.textColor}]">
              <h2 class="text-3xl font-bold mb-4">${page.heading}</h2>
              <p class="text-lg leading-relaxed">${page.paragraph}</p>
            </div>
          ` : `
            <div class="text-left text-[${page.textColor}]">
              <h2 class="text-3xl font-bold mb-4">${page.heading}</h2>
              <p class="text-lg leading-relaxed">${page.paragraph}</p>
            </div>
            <img src="${page.image}" class="rounded-xl shadow-lg border-4" style="border-color: ${page.borderColor}" />
          `}
        </div>
      `;
    } else if (page.type === 'poem') {
      section.innerHTML = `
        <h2 class="text-4xl font-extrabold text-[${page.titleColor}] mb-6">${page.title}</h2>
        <p class="text-xl leading-loose font-medium text-[${page.textColor}] max-w-3xl mx-auto">
          ${page.lines.join('<br />')}
        </p>
      `;
    }

    container.appendChild(section);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTemplate(template);
});
