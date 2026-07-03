import SavedList from "./SavedList";

export default function SummaryList() {
  return (
    <SavedList
      type="summaries"
      titleKey="topic"
      contentKey="content"
      searchPlaceholder="Search summaries..."
      emptyTitle="No summaries yet"
      emptyText="No saved summaries yet. Summarize content and save it from the AI tool."
    />
  );
}
