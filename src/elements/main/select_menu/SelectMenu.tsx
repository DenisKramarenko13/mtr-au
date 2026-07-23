'use client';

import { memo, useState, useEffect } from 'react';
import { useFilterStore } from '@/store/useFilterStore';
import Select from './select/Select';
import selectMenuS from './selectMenu.module.scss';
import { OptionItem } from '@/app/api/aleado/filters/route';

function SelectMenu() {
  const { mark, markId, model, setMark, setModel } = useFilterStore();

  const [marksList, setMarksList] = useState<OptionItem[]>([]);
  const [modelsList, setModelsList] = useState<OptionItem[]>([]);
  const [isLoadingMarks, setIsLoadingMarks] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // 1. Загрузка списка МАРК с Aleado при монтировании компонента
  useEffect(() => {
    async function fetchMarks() {
      setIsLoadingMarks(true);
      try {
        const res = await fetch('/api/aleado/filters');
        if (res.ok) {
          const data: OptionItem[] = await res.json();
          setMarksList(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки марок:', err);
      } finally {
        setIsLoadingMarks(false);
      }
    }
    fetchMarks();
  }, []);

  // 2. Загрузка списка МОДЕЛЕЙ с Aleado при выборе марки (когда меняется markId)
  useEffect(() => {
    if (!markId) {
      setModelsList([]);
      return;
    }

    async function fetchModels() {
      setIsLoadingModels(true);
      try {
        const res = await fetch(`/api/aleado/filters?mrk=${encodeURIComponent(markId)}`);
        if (res.ok) {
          const data: OptionItem[] = await res.json();
          setModelsList(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки моделей:', err);
      } finally {
        setIsLoadingModels(false);
      }
    }
    fetchModels();
  }, [markId]);

  // Обработчик выбора марки
  const handleMarkSelect = (selectedName: string) => {
    const found = marksList.find((item) => item.name === selectedName);
    if (found) {
      setMark(found.name, found.id);
    } else {
      setMark('', '');
    }
  };

  // Обработчик выбора модели
  const handleModelSelect = (selectedName: string) => {
    const found = modelsList.find((item) => item.name === selectedName);
    if (found) {
      setModel(found.name, found.id);
    } else {
      setModel('', '');
    }
  };

  const markOptions = marksList.map((item) => item.name);
  const modelOptions = modelsList.map((item) => item.name);

  return (
    <div className={selectMenuS.container}>
      {/* 1. Динамический селект марки */}
      <Select
        label="Марка автомобиля"
        placeholder={isLoadingMarks ? 'Загрузка марок...' : 'Выберите марку...'}
        options={markOptions}
        value={mark}
        onChange={handleMarkSelect}
      />

      {/* 2. Динамический селект модели */}
      <Select
        label="Модель автомобиля"
        placeholder={
          isLoadingModels
            ? 'Загрузка моделей...'
            : mark
            ? 'Выберите модель...'
            : 'Сначала выберите марку'
        }
        options={modelOptions}
        value={model}
        onChange={handleModelSelect}
      />
    </div>
  );
}

export default memo(SelectMenu);
