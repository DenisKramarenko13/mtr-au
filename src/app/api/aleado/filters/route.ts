import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface OptionItem {
  id: string;
  name: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mrkId = searchParams.get('mrk');

  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cookie': 'SU_Session=f7366ffb21bee14493a0347e72beea2a; PHPSESSID=52t6oa0dtkrrig9s79j38h8hn5',
    };

    if (!mrkId) {
      // 1. Запрашиваем МАРКИ с Aleado
      const targetUrl = 'https://auc.aleado.com/auctions/?p=project/searchform';
      const response = await fetch(targetUrl, {
        headers,
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Ошибка сервера Aleado' },
          { status: response.status }
        );
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: OptionItem[] = [];

      $('select#mrk option').each((_, element) => {
        const val = $(element).attr('value')?.trim();
        const text = $(element).text().trim();
        if (val && val !== '-1' && val !== '0' && text) {
          results.push({ id: val, name: text });
        }
      });

      return NextResponse.json(results);
    } else {
      // 2. Запрашиваем МОДЕЛИ для выпранной марки через Sajax эндпоинт Aleado
      const targetUrl = `https://auc.aleado.com/auctions/?p=project/searchform&rs=loadModels&rsargs[]=${encodeURIComponent(
        mrkId
      )}&rsargs[]=%7B%7D`;

      const response = await fetch(targetUrl, {
        headers,
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Ошибка сервера Aleado' },
          { status: response.status }
        );
      }

      const rawText = await response.text();
      // Sajax возвращает строку в кавычках с экранированным HTML. Очищаем ее.
      const $ = cheerio.load(rawText);
      const results: OptionItem[] = [];

      $('option').each((_, element) => {
        let val = $(element).attr('value')?.replace(/\\|"/g, '').trim();
        const text = $(element).text().trim();
        if (val && val !== '-1' && val !== '0' && text) {
          results.push({ id: val, name: text });
        }
      });

      return NextResponse.json(results);
    }
  } catch (error) {
    console.error('Aleado filters fetch error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при парсинге фильтров' },
      { status: 500 }
    );
  }
}
