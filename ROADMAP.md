# halostatue/starlist Roadmap

While I have been generating my stars file for a long time with
simeonecorsi/mawesome and have recently changed to using this fork, I had not
opened it in a while…and it does not open properly in modern GitHub, because the
output is nearly 2 MiB in size. I could clean this up by removing a bunch of
stars (which I should do anyway, because I have almost 5,000 starred repos) —
but there should be a fairly easy way to manage this moving forward.

I can also imagine using a tool like starlist within a development team to
generate a shared research list (merged or reported separately).

Possible features include the following. The only one that is certain, but needs
to be figured out more thoroughly, is multiple file generation.

- Extend star retrieval and storage. This would mostly be controlled with added
  configuration for `config.stars`:

  - Add `config.stars.logins` which works with either a single value or a list,
    which will make `user` calls to retrieve the starred repository list for
    each user. If unspecified, the current `viewer` query is called.

  - Add `config.stars.filename`, which changes the output file from `data.json`
    to the specified value. It will have the same security constraints as
    regular output files.

  - Extend `config.stars.filename` to support a templated filename, such as
    `data/${login}.json`, which would save the user's star list to a file named
    after the login (e.g., `data/halostatue.json`).

  - Add `config.stars.output_mode = merged | separate`. Separate output would be
    the default if the filename is templated and merged would be the default if
    the filename is not.

- Extend generation and output modes to support multiple file output. This will
  either require _two_ templates (one for index templates and one for data) or
  one template with multiple modes (I am leaning toward two templates). Because
  there needs to be some way of knowing how to split the data into multiple
  files, this will require some sort of configuration that executes the split
  and provides it for successive execution.
