defmodule AlchemyBook.Repo do
  use Ecto.Repo,
    otp_app: :alchemy_book,
    adapter: Ecto.Adapters.Postgres
end
