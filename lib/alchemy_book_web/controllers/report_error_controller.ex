defmodule AlchemyBookWeb.ReportErrorController do
  use AlchemyBookWeb, :controller
  require Logger

  plug :accepts, ["json"]

  def handle(conn, params) do
    Logger.error(inspect params)
    json(conn, %{body: "ok"})
  end
end
