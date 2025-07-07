// ✅ This is correct (ESM-style)
import { DateTime } from "luxon";

export default function(eleventyConfig) {
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
}
