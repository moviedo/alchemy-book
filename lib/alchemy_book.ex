defmodule AlchemyBook do
  # @moduledoc """
  # AlchemyBook keeps the contexts that define your domain
  # and business logic.

  # Contexts are also responsible for managing your data, regardless
  # if it comes from the database, an external API or others.
  # """
  # use Application

  # # See http://elixir-lang.org/docs/stable/elixir/Application.html
  # # for more information on OTP Applications
  # def start(_type, _args) do
  #   import Supervisor.Spec

  #   # Define workers and child supervisors to be supervised
  #   children = [
  #     # Start the Ecto repository
  #     supervisor(AlchemyBook.Repo, []),
  #     # Start the endpoint when the application starts
  #     supervisor(AlchemyBook.Endpoint, []),
  #     supervisor(AlchemyBook.Presence, []),
  #     supervisor(AlchemyBook.DocumentRegistry, []),
  #     # Start your own worker by calling: AlchemyBook.Worker.start_link(arg1, arg2, arg3)
  #     # worker(AlchemyBook.Worker, [arg1, arg2, arg3]),
  #   ]

  #   # See http://elixir-lang.org/docs/stable/elixir/Supervisor.html
  #   # for other strategies and supported options
  #   opts = [strategy: :one_for_one, name: AlchemyBook.Supervisor]
  #   Supervisor.start_link(children, opts)
  # end

  # # Tell Phoenix to update the endpoint configuration
  # # whenever the application is updated.
  # def config_change(changed, _new, removed) do
  #   AlchemyBook.Endpoint.config_change(changed, removed)
  #   :ok
  # end
end
