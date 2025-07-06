module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/supabaseClient.js": "supabaseClient.js" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
