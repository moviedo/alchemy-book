defmodule AlchemyBookWeb.PageController do
  use AlchemyBookWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
