export async function saveStudyItem(supabase, payload) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("Your session expired. Please login again.");
  }

  const response = await fetch("/api/save-study-item", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Could not save study item.");
  }

  return result.item;
}
