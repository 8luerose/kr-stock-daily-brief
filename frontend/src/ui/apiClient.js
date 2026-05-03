export function createApiClient({ apiBaseUrl, accessKey = "", adminKey = "" }) {
  async function request(path, opts = {}) {
    const url = new URL(apiBaseUrl + path);
    if (accessKey) url.searchParams.set("k", accessKey);

    const headers = new Headers(opts.headers || {});
    if (adminKey) headers.set("X-Admin-Key", adminKey);

    const res = await fetch(url.toString(), { ...opts, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return { request };
}

export function formatApiError(err) {
  const msg = err.message || String(err);
  if (msg.includes("409") || msg.includes("summary_already_exists")) {
    return "이미 생성된 요약이 있습니다. 재생성은 관리자만 가능합니다.";
  }
  if (msg.includes("403") || msg.includes("forbidden") || msg.includes("admin_only")) {
    return "관리자 권한이 필요합니다. URL에 ?ak=관리자키 를 추가하세요.";
  }
  if (msg.includes("HTTP 401")) return "인증이 필요합니다.";
  if (msg.includes("HTTP 404")) return "데이터를 찾을 수 없습니다.";
  if (msg.includes("HTTP 500")) return "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.";
  return msg;
}
