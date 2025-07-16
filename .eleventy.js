const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // ✅ Static folders
  eleventyConfig.addPassthroughCopy({ "src/templates": "templates" }); // For JSON templates

  // ✅ Filters
  eleventyConfig.addFilter("date", (value, format = "yyyy") => {
    return DateTime.fromJSDate(new Date(value)).toFormat(format);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
