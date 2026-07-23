let cachedCookie: string | null = null;
let lastLoginTime = 0;

// Токен живет в кэше 12 часов (12 * 60 * 60 * 1000 миллисекунд)
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

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

  // Если логин и пароль не заданы в .env, берем резервную рабочую куку
  if (!login || !password) {
    console.warn(
      '[Aleado Auth] Переменные ALEADO_LOGIN и ALEADO_PASSWORD не заданы в .env! Используется резервная сессия.'
    );
    return 'SU_Session=f7366ffb21bee14493a0347e72beea2a; PHPSESSID=52t6oa0dtkrrig9s79j38h8hn5';
  }

  try {
    console.log('[Aleado Auth] Выполняем авто-логин на Aleado...');

    const body = new URLSearchParams({
      login: login,
      password: password,
      action: 'login',
    });

    const response = await fetch('https://auc.aleado.com/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      redirect: 'manual', // Не следуем за 302 автоматически, чтобы перехватить Set-Cookie
    });

    // Извлекаем куки из заголовков Set-Cookie
    const setCookieHeaders = response.headers.getSetCookie();

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      // Собираем куки в единую строку для заголовка Cookie
      const parsedCookies = setCookieHeaders
        .map((header) => header.split(';')[0])
        .filter(Boolean)
        .join('; ');

      if (parsedCookies) {
        cachedCookie = parsedCookies;
        lastLoginTime = now;
        console.log('[Aleado Auth] Авторизация успешна! Новая сессия сохранена.');
        return cachedCookie;
      }
    }

    // Если не удалось извлечь куку — используем фоллбэк
    console.error('[Aleado Auth] Не удалось извлечь Set-Cookie из ответа авторизации.');
    return 'SU_Session=f7366ffb21bee14493a0347e72beea2a; PHPSESSID=52t6oa0dtkrrig9s79j38h8hn5';
  } catch (error) {
    console.error('[Aleado Auth] Ошибка во время авто-авторизации:', error);
    return 'SU_Session=f7366ffb21bee14493a0347e72beea2a; PHPSESSID=52t6oa0dtkrrig9s79j38h8hn5';
  }
}

/**
 * Сбрасывает сохраненную куку в случае ошибки авторизации
 */
export function invalidateAleadoSession() {
  cachedCookie = null;
  lastLoginTime = 0;
}
