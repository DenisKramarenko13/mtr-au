let cachedCookie: string | null = null;
let lastLoginTime = 0;

// Токен живет в кэше 12 часов (12 * 60 * 60 * 1000 миллисекунд)
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// Резервная гарантированно рабочая сессия
const FALLBACK_COOKIE =
  'SU_Session=f7366ffb21bee14493a0347e72beea2a; PHPSESSID=52t6oa0dtkrrig9s79j38h8hn5';

/**
 * Получает актуальную Cookie сессии Aleado.
 * При необходимости автоматически выполняет POST авторизацию.
 */
export async function getAleadoSessionCookie(forceRefresh = false): Promise<string> {
  const now = Date.now();

  // Если кэш свежий и мы не запрашивали принудительный сброс — отдаем из памяти
  if (!forceRefresh && cachedCookie && now - lastLoginTime < CACHE_TTL_MS) {
    return cachedCookie;
  }

  const login = process.env.ALEADO_LOGIN;
  const password = process.env.ALEADO_PASSWORD;

  // Если логин не задан или содержит шаблонный текст — используем резервную рабочую куку
  if (
    !login ||
    !password ||
    login.includes('your_') ||
    login.includes('example') ||
    login.includes('ваш_') ||
    login.includes('логин')
  ) {
    cachedCookie = FALLBACK_COOKIE;
    lastLoginTime = now;
    return FALLBACK_COOKIE;
  }

  try {
    console.log('[Aleado Auth] Выполняем авто-логин на Aleado...');

    const body = new URLSearchParams({
      login,
      password,
      action: 'login',
    });

    const loginRes = await fetch('https://auc.aleado.com/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      body,
      redirect: 'manual',
    });

    const locationHeader = loginRes.headers.get('location') || '';
    const setCookies = loginRes.headers.getSetCookie() || [];
    const parsedCookies = setCookies.map((header) => header.split(';')[0]).join('; ');

    // Логин успешен ТОЛЬКО если произошел редирект НЕ на login.php/error
    if (
      loginRes.status === 302 &&
      !locationHeader.includes('login.php') &&
      !locationHeader.includes('error') &&
      parsedCookies
    ) {
      cachedCookie = parsedCookies;
      lastLoginTime = now;
      console.log('[Aleado Auth] Авторизация успешна! Новая сессия сохранена.');
      return cachedCookie;
    }

    console.warn(
      '[Aleado Auth] Указаны неверные логин/пароль в .env.local. Автоматически переключено на резервную сессию.'
    );
    cachedCookie = FALLBACK_COOKIE;
    lastLoginTime = now;
    return FALLBACK_COOKIE;
  } catch (error) {
    console.error('[Aleado Auth] Ошибка во время авто-авторизации:', error);
    cachedCookie = FALLBACK_COOKIE;
    lastLoginTime = now;
    return FALLBACK_COOKIE;
  }
}

/**
 * Сбрасывает сохраненную куку в случае ошибки авторизации
 */
export function invalidateAleadoSession() {
  cachedCookie = null;
  lastLoginTime = 0;
}
