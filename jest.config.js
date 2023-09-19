export default {
  roots: ["<rootDir>"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx|js)$": "ts-jest"
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@mlc-ai/web-llm).+\\.js$'
  ],
  testRegex: "tests/.*.test.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};

