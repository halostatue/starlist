import esgleam

pub fn main() {
  let assert Ok(_) =
    esgleam.new("./dist")
    |> esgleam.entry("starlist_action.gleam")
    |> esgleam.kind(esgleam.Script)
    |> esgleam.format(esgleam.Cjs)
    |> esgleam.autoinstall(True)
    |> esgleam.platform(esgleam.Node)
    |> esgleam.bundle()
}
