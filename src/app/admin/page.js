import { addMovieWithSubtitle } from "./server-actions";

export default function AdminPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        <form
          action={addMovieWithSubtitle}
          className="space-y-3 border p-4 rounded-xl"
        >
          <h2 className="font-semibold">Add Movie + Subtitle (One form)</h2>

          <input
            name="title"
            placeholder="Movie title"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />

          <input
            name="year"
            placeholder="Year (optional)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="file"
            name="poster"
            accept="image/*"
            className="w-full text-sm"
            required
          />

          <hr className="opacity-30" />

          <input
            name="language"
            placeholder="Subtitle language (eg: Malayalam)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />

          <input
            type="file"
            name="subtitle"
            accept=".srt,.ass,.vtt"
            className="w-full text-sm"
            required
          />

          <button className="border rounded-lg px-3 py-2 text-sm">
            Save Movie + Subtitle
          </button>

          <p className="text-xs text-muted-foreground">
            Poster → R2 (<b>poster_key</b>) • Subtitle → R2 (<b>file_key</b>)
          </p>
        </form>
      </div>
    </main>
  );
}