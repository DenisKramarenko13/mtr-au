import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getAleadoSessionCookie, invalidateAleadoSession } from '@/lib/aleadoAuth';

export interface CarLot {
  id: string;
  lotNumber: string;
  date: string;
  auction: string;
  imageUrl: string;
  maker: string;
  model: string;
  grade: string;
  year: string;
  mileage: string;
  displacement: string;
  transmission: string;
  color: string;
  score: string;
  startPrice: string;
}

export interface LotsResponse {
  lots: CarLot[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mrkId = searchParams.get('mrk');
  const mdlId = searchParams.get('mdl');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;

  if (!mrkId) {
    return NextResponse.json({
      lots: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
    });
  }

  let targetUrl = `https://auc.aleado.com/auctions?p=project/findlots&mrk=${encodeURIComponent(
    mrkId
  )}&pg=${page}`;

  if (mdlId) {
    targetUrl += `&mdl[]=${encodeURIComponent(mdlId)}`;
  }

  try {
    const cookie = await getAleadoSessionCookie();

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': cookie,
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      invalidateAleadoSession();
      return NextResponse.json({ error: 'Ошибка получения лотов' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const lots: CarLot[] = [];

    // Количество лотов
    const rawTotalRows = $('input#rows').attr('value') || '0';
    const totalCount = parseInt(rawTotalRows, 10) || 0;
    const totalPages = Math.ceil(totalCount / limit);

    $('tr[id^="cell_"]').each((index, element) => {
      if (lots.length >= limit) return false;

      const rowId = index + 1;
      const $row = $(element);

      const $link = $row.find(`td#bid_number_${rowId} a`);
      const href = $link.attr('href') || '';
      const idMatch = href.match(/id=(\d+)/);
      const id = idMatch ? idMatch[1] : String(rowId);
      const lotNumber = $link.text().trim();

      const $img = $row.find(`td#photo_${rowId} img`);
      let imageUrl = $img.attr('load_src') || $img.attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://auc.aleado.com${imageUrl}`;
      }
      imageUrl = imageUrl.replace(/\?w=\d+/, '?w=400');

      const date = $row.find(`td#date_${rowId}`).text().trim();
      const auction = $row.find(`td#auction_${rowId}`).text().trim();
      const maker = $row.find(`td#company_${rowId}`).text().trim();
      const model = $row.find(`td#model_${rowId}`).text().trim();
      const grade = $row.find(`td#grade_${rowId}`).text().trim();
      const year = $row.find(`td#year_${rowId}`).text().trim();
      const mileage = $row.find(`td#mileage_${rowId}`).text().trim();
      const displacement = $row.find(`td#displacement_${rowId}`).text().trim();
      const transmission = $row.find(`td#transmission_${rowId}`).text().trim();
      const color = $row.find(`td#color_${rowId}`).text().trim();
      const score = $row.find(`td#scores_${rowId}`).text().trim();

      const rawPrice = $(`#priceLotS${rowId}`).text().trim();
      const startPrice = rawPrice ? `${rawPrice} 000 JPY` : '—';

      lots.push({
        id,
        lotNumber,
        date,
        auction,
        imageUrl,
        maker,
        model,
        grade,
        year,
        mileage,
        displacement,
        transmission,
        color,
        score,
        startPrice,
      });
    });

    const result: LotsResponse = {
      lots,
      totalCount,
      currentPage: page,
      totalPages: totalPages || 1,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fetch lots error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
