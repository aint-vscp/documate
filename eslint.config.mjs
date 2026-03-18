import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    ignores: [".next/**", "out/**", "node_modules/**", "artifacts/**", "cache/**"],
  },
];
