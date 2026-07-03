export async function saveAiHistory({ supabase, userId, feature, prompt, response }) {
  if (!supabase || !userId || !feature || !prompt || !response) {
    return { error: null };
  }

  const { error } = await supabase.from("ai_history").insert({
    user_id: userId,
    feature,
    prompt,
    response,
  });

  return { error };
}
