const GITHUB_API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';

function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
  };
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.message) {
      return data.message;
    }
  } catch (error) {
    // ignore parse errors
  }
  return `${response.status} ${response.statusText}`;
}

export async function createGist(
  token: string,
  filename: string,
  content: string
): Promise<string> {
  const response = await fetch(`${GITHUB_API_BASE}/gists`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({
      description: 'Terminal Script Manager Sync',
      public: false,
      files: {
        [filename]: {
          content,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`创建 Gist 失败: ${await parseErrorResponse(response)}`);
  }

  const data = await response.json();
  if (!data?.id) {
    throw new Error('创建 Gist 失败: 未返回 Gist ID');
  }

  return data.id as string;
}

export async function updateGist(
  token: string,
  gistId: string,
  filename: string,
  content: string
): Promise<void> {
  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: buildHeaders(token),
    body: JSON.stringify({
      files: {
        [filename]: {
          content,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`更新 Gist 失败: ${await parseErrorResponse(response)}`);
  }
}

export async function fetchGistContent(
  token: string,
  gistId: string,
  filename: string
): Promise<{ content: string; filename: string }> {
  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取 Gist 失败: ${await parseErrorResponse(response)}`);
  }

  const data = await response.json();
  const files = data?.files || {};
  const preferredFile = files[filename];
  const fallbackFile = preferredFile || Object.values(files)[0];

  if (!fallbackFile) {
    throw new Error('Gist 中未找到可用文件');
  }

  const fileInfo = fallbackFile as {
    filename?: string;
    content?: string;
    truncated?: boolean;
    raw_url?: string;
  };

  if (fileInfo.truncated && fileInfo.raw_url) {
    const rawResponse = await fetch(fileInfo.raw_url, {
      headers: buildHeaders(token),
    });

    if (!rawResponse.ok) {
      throw new Error(`获取 Gist 原始内容失败: ${await parseErrorResponse(rawResponse)}`);
    }

    return {
      content: await rawResponse.text(),
      filename: fileInfo.filename || filename,
    };
  }

  if (typeof fileInfo.content !== 'string') {
    throw new Error('Gist 内容为空或无效');
  }

  return {
    content: fileInfo.content,
    filename: fileInfo.filename || filename,
  };
}
