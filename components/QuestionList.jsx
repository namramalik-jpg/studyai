import SavedList from "./SavedList";

export default function QuestionList() {
  return (
    <SavedList
      type="questions"
      titleKey="question"
      contentKey="answer"
      searchPlaceholder="Search questions..."
      emptyTitle="No questions yet"
      emptyText="No solved questions yet. Solve a question and save the answer from the AI tool."
    />
  );
}
