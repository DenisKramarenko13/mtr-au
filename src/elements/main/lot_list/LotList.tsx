'use client';

import { memo, useState, useEffect } from 'react';
import { useFilterStore } from '@/store/useFilterStore';
import { CarLot, LotsResponse } from '@/app/api/aleado/lots/route';
import lotListS from './lotList.module.scss';

function LotList() {
  const { mark, markId, model, modelId } = useFilterStore();
  const [lots, setLots] = useState<CarLot[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Сбрасываем страницу на 1 при смене марки или модели
  useEffect(() => {
    setCurrentPage(1);
  }, [markId, modelId]);

  // Загружаем лоты при изменении марки/модели/страницы
  useEffect(() => {
    if (!markId) {
      setLots([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }

    async function fetchLots() {
      setIsLoading(true);
      try {
        let url = `/api/aleado/lots?mrk=${encodeURIComponent(markId)}&page=${currentPage}`;
        if (modelId) {
          url += `&mdl=${encodeURIComponent(modelId)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data: LotsResponse = await res.json();
          setLots(data.lots || []);
          setTotalCount(data.totalCount || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Ошибка загрузки лотов:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLots();
  }, [markId, modelId, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    // Плавный скролл к началу списка
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Генерация диапазона номеров страниц для красивой пагинации
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Сколько страниц показывать по бокам от текущей

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < totalPages)
      ) {
        pages.push('...');
      }
    }

    // Удаляем дубликаты '...'
    return pages.filter((item, index, array) => array.indexOf(item) === index);
  };

  // Формируем динамический заголовок
  let titleText = 'Актуальные аукционные лоты';
  if (mark) {
    titleText = model ? `Аукционные лоты: ${mark} ${model}` : `Аукционные лоты: ${mark}`;
  }

  if (!markId) {
    return (
      <div className={lotListS.section}>
        <div className={lotListS.emptyState}>
          <h3>Выберите марку, чтобы увидеть аукционные лоты</h3>
          <p>Выберите производителя автомобиля выше, чтобы загрузить первые 10 актуальных предложений с аукционов Японии.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={lotListS.section}>
      <div className={lotListS.header}>
        <h2>{titleText}</h2>
        <span className={lotListS.countBadge}>
          {isLoading ? 'Загрузка...' : `Всего найдено авто: ${totalCount.toLocaleString('ru-RU')}`}
        </span>
      </div>

      {isLoading ? (
        <div className={lotListS.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={lotListS.skeleton} />
          ))}
        </div>
      ) : lots.length > 0 ? (
        <>
          <div className={lotListS.grid}>
            {lots.map((lot) => (
              <div key={lot.id} className={lotListS.card}>
                <div className={lotListS.imageWrapper}>
                  <img
                    src={lot.imageUrl}
                    alt={`${lot.maker} ${lot.model}`}
                    loading="lazy"
                  />
                  <span className={lotListS.scoreBadge}>Оценка: {lot.score || '—'}</span>
                  <span className={lotListS.lotBadge}>Лот №{lot.lotNumber}</span>
                </div>

                <div className={lotListS.content}>
                  <h3 className={lotListS.title}>
                    {lot.maker} {lot.model}
                    {lot.grade && <span>{lot.grade}</span>}
                  </h3>

                  <div className={lotListS.specsGrid}>
                    <div className={lotListS.specItem}>
                      <span className={lotListS.specLabel}>Год</span>
                      <span className={lotListS.specValue}>{lot.year || '—'}</span>
                    </div>
                    <div className={lotListS.specItem}>
                      <span className={lotListS.specLabel}>Пробег</span>
                      <span className={lotListS.specValue}>{lot.mileage ? `${lot.mileage} км` : '—'}</span>
                    </div>
                    <div className={lotListS.specItem}>
                      <span className={lotListS.specLabel}>Двигатель</span>
                      <span className={lotListS.specValue}>{lot.displacement || '—'}</span>
                    </div>
                    <div className={lotListS.specItem}>
                      <span className={lotListS.specLabel}>КПП</span>
                      <span className={lotListS.specValue}>{lot.transmission || '—'}</span>
                    </div>
                  </div>

                  <div className={lotListS.footer}>
                    <div className={lotListS.price}>
                      <span className={lotListS.priceLabel}>Старт. цена</span>
                      <span className={lotListS.priceValue}>{lot.startPrice}</span>
                    </div>
                    <span className={lotListS.auctionName}>{lot.auction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className={lotListS.pagination}>
              <button
                className={lotListS.navButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Назад
              </button>

              {getPageNumbers().map((pageItem, idx) =>
                typeof pageItem === 'number' ? (
                  <button
                    key={idx}
                    className={`${lotListS.pageButton} ${
                      pageItem === currentPage ? lotListS.pageButtonActive : ''
                    }`}
                    onClick={() => handlePageChange(pageItem)}
                  >
                    {pageItem}
                  </button>
                ) : (
                  <span key={idx} className={lotListS.dots}>
                    ...
                  </span>
                )
              )}

              <button
                className={lotListS.navButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Вперед →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={lotListS.emptyState}>
          <h3>Лоты не найдены</h3>
          <p>В данный момент нет активных аукционных лотов, соответствующих выбранным фильтрам.</p>
        </div>
      )}
    </div>
  );
}

export default memo(LotList);
