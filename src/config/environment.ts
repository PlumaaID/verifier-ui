const env = {
  test: process.env.NODE_ENV === "test",
  prod: process.env.NODE_ENV === "production",
  development: process.env.NODE_ENV === "development",
};

export { env };
