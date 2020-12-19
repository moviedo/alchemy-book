defmodule AlchemyBook.Document do
  use Ecto.Schema
  import Ecto.Changeset

  @crdt_base 256
  @default_site 0

  # We should probably guarantee that the slugs are unique, but it doesn't
  # really matter for the purpose of the demo.
  @coder Hashids.new([salt: "alchemy", min_len: 6])

  schema "documents" do
    field :title, :string
    field :contents, :string
    belongs_to :user, AlchemyBook.User

    timestamps()
  end

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [:title, :contents])
    #|> validate_required([:title, :contents])
  end

  def default() do
    %{ "title" => "untitled",
       "contents" => crdt_to_json(string_to_crdt("Time to do some alchemy!\nReady to have some fun?"))
    }
  end

  def slug_from_id(id) do
    Hashids.encode(@coder, id)
  end

  def id_from_slug(slug) do
    Hashids.decode(@coder, slug)
  end

  def json_to_crdt(json) do
    json
    |> Jason.decode!
    |> Enum.map(fn [position_identifier, lamport, char] ->
      {Enum.map(position_identifier, fn [digit, site] -> {digit, site} end), lamport, char}
    end)
  end

  def crdt_to_json(crdt) do
    crdt_to_json_ready(crdt)
    |> Jason.encode!
  end

  def crdt_to_json_ready(crdt) do
    crdt
    |> Enum.map(fn {position_identifier, lamport, char} ->
      [Enum.map(position_identifier, fn {digit, site} -> [digit, site] end), lamport, char]
    end)
  end

  defp string_to_crdt(string) do
    # TODO: support for bigger strings
    # (right now this is used only for the default string)
    if String.length(string) >= @crdt_base do
      throw "no supported yet"
    end

    string
    |> String.to_charlist
    |> Enum.with_index
    |> Enum.map(fn {char, index} ->
      identifier = { trunc(index / String.length(string) * @crdt_base) + 1, @default_site }
      { [identifier], index, to_string([char]) }
    end)
  end
end
