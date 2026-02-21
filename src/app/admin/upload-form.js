// src/app/admin/upload-form.js
import { addSubtitle } from "./server-actions";

export default function UploadForm({ movies }) {
  return (
    <form action={addSubtitle} className="rounded-xl border p-4 space-y-3">
      <h2 className="font-semibold">Add Subtitle</h2>

      <select
        name="movieId"
        defaultValue={movies[0]?.id ?? ""}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        {movies.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>

      <input
        name="language"
        placeholder="Language (eg: Malayalam)"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        required
      />

      <input
        name="file"
        type="file"
        accept=".srt,.ass,.vtt"
        className="w-full text-sm"
        required
      />

      <button className="rounded-lg border px-3 py-2 text-sm">
        Add Subtitle
      </button>

      <p className="text-xs text-muted-foreground">
        Subtitle file will upload to R2 and save as <b>file_key</b>.
      </p>
    </form>
  );
}