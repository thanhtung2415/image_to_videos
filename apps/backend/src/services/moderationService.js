const blockedPromptWords = ['violence', 'nsfw', 'hate', 'self harm'];

export function moderateProjectInput({ prompt, file }) {
  const normalizedPrompt = String(prompt || '').toLowerCase();
  const matchedWord = blockedPromptWords.find((word) => normalizedPrompt.includes(word));

  if (matchedWord) {
    return {
      ok: false,
      message: 'Prompt vi pham chinh sach noi dung demo'
    };
  }

  if (!file || file.size > 5 * 1024 * 1024) {
    return {
      ok: false,
      message: 'File anh khong hop le'
    };
  }

  return { ok: true };
}

