import SavedList from "./SavedList";

export default function NotesList() {
  return (
    <SavedList
      type="notes"
      titleKey="title"
      contentKey="content"
      canCreate
      canEdit
      enableNoteTools
      searchPlaceholder="Search notes..."
      emptyTitle="No notes yet"
      emptyText="No saved notes yet. Generate notes and save them from the AI tool."
    />
  );
}
