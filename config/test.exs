use Mix.Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :alchemy_book, AlchemyBook.Repo,
  username: "vagrant",
  password: "123qwe",
  database: "alchemy_book_test#{System.get_env("MIX_TEST_PARTITION")}",
  hostname: "localhost",
  port: "54320",
  pool: Ecto.Adapters.SQL.Sandbox

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :alchemy_book, AlchemyBookWeb.Endpoint,
  http: [port: 4002],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn
