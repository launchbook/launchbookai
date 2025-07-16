const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // ✅ Add this line
  eleventyConfig.addPassthroughCopy("public");

  // Existing filters, etc.
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
