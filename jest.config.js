/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  // testEnvironment: "node",
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  coverageReporters: ["json", "lcov", "text", "clover"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}", "<rootDir>/examples/react/tests/*.test.{jsx,ts,tsx}"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": "babel-jest"
  }
};
