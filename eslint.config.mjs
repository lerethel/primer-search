import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  {
    languageOptions: {
      globals: { ...globals.browser, Toastify: "readonly", Mark: "readonly" },
    },
  },
  pluginJs.configs.recommended,
];
