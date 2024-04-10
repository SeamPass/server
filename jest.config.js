/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.test.json",
    },
  },
};
